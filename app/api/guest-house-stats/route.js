import { connectToDatabase } from "@/lib/mongodb";
import GuestHouse from "@/lib/models/GuestHouse.model";
import Room from "@/lib/models/Room.model";
import Bed from "@/lib/models/Bed.model";
import Booking from "@/lib/models/Booking.model";
import RoomMaintenance from "@/lib/models/RoomMaintainence.modal";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getAuthUser } from "@/lib/auth";
import { getISTDayBoundsUTC } from "@/lib/istDate";

export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse("Unauthorized", 401);

    await connectToDatabase();

    const { startUTC, endUTC } = getISTDayBoundsUTC();

    const guestHouses = await GuestHouse.find({ isActive: true }).lean();
    const guestHouseIds = guestHouses.map((g) => g._id);

    /* ---------- FETCH ROOMS ---------- */
    const rooms = await Room.find({
      guestHouseId: { $in: guestHouseIds },
      isActive: true,
    }).lean();
    const roomIds = rooms.map((r) => r._id);

    /* ---------- BED COUNTS PER ROOM ---------- */
    const totalBedsAgg = await Bed.aggregate([
      { $match: { roomId: { $in: roomIds }, isActive: true } },
      { $group: { _id: "$roomId", total: { $sum: 1 } } },
    ]);
    const totalBedsMap = {};
    totalBedsAgg.forEach((r) => { totalBedsMap[r._id.toString()] = r.total; });

    /* ---------- CURRENT OCCUPIED BOOKINGS ---------- */
    // CHECKED_IN rooms are always occupied (no date filter – physically present)
    // BOOKED rooms are occupied only if their dates overlap today
    const activeBookings = await Booking.find({
      guestHouseId: { $in: guestHouseIds },
      $or: [
        { status: 'CHECKED_IN' },
        {
          status: 'BOOKED',
          checkInDate: { $lt: endUTC },
          checkOutDate: { $gt: startUTC },
        },
      ],
    }).lean();

    /* ---------- MAP OCCUPIED BEDS PER ROOM ---------- */
    const occupiedBedsPerRoom = {}; // roomId -> Set(bedId)
    activeBookings.forEach((b) => {
      if (!b.bedId) return; // legacy booking predating bed-level booking — not attributable to a bed
      const rid = b.roomId.toString();
      if (!occupiedBedsPerRoom[rid]) occupiedBedsPerRoom[rid] = new Set();
      occupiedBedsPerRoom[rid].add(b.bedId.toString());
    });

    /* ---------- ROOMS CURRENTLY UNDER MAINTENANCE ---------- */
    const maintenanceRoomIds = await RoomMaintenance.distinct("roomId", {
      roomId: { $in: roomIds },
      status: "ACTIVE",
      startDate: { $lt: endUTC },
      endDate: { $gt: startUTC },
    });
    const maintenanceSet = new Set(maintenanceRoomIds.map((id) => id.toString()));

    /* ---------- FINAL STATS ---------- */
    const stats = guestHouses.map((gh) => {
      const ghRooms = rooms.filter(
        (r) => r.guestHouseId.toString() === gh._id.toString(),
      );

      const totalRooms = ghRooms.length;

      let underMaintenance = 0;
      let occupiedRooms = 0;
      ghRooms.forEach((r) => {
        const idStr = r._id.toString();
        if (maintenanceSet.has(idStr)) {
          underMaintenance++;
          return;
        }
        const total = totalBedsMap[idStr] || 0;
        const occupiedBeds = occupiedBedsPerRoom[idStr]?.size || 0;
        if (total > 0 && occupiedBeds >= total) occupiedRooms++;
      });

      const available = totalRooms - occupiedRooms - underMaintenance;

      const utilization =
        totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      return {
        ...gh,
        totalRooms,
        occupied: occupiedRooms,
        underMaintenance,
        available: Math.max(available, 0),
        utilization,
      };
    });

    return successResponse(stats);
  } catch (err) {
    console.error("[GuestHouse Stats]", err);
    return errorResponse("Internal server error", 500);
  }
}
