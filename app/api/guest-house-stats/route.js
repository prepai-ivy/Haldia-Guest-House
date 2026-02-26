import { connectToDatabase } from "@/lib/mongodb";
import GuestHouse from "@/lib/models/GuestHouse.model";
import Room from "@/lib/models/Room.model";
import Booking from "@/lib/models/Booking.model";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    await connectToDatabase();

    // Get current time
    const now = new Date();

    // Convert to IST (UTC +5:30)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    // Current IST time
    const nowIST = new Date(now.getTime() + IST_OFFSET);

    // Start of today in IST
    const startOfTodayIST = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate(),
    );

    // End of today in IST
    const endOfTodayIST = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate() + 1,
    );

    // Convert back to UTC for MongoDB query
    const startUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET);
    const endUTC = new Date(endOfTodayIST.getTime() - IST_OFFSET);

    const guestHouses = await GuestHouse.find({ isActive: true }).lean();
    const guestHouseIds = guestHouses.map((g) => g._id);

    /* ---------- FETCH ROOMS ---------- */
    const rooms = await Room.find({
      guestHouseId: { $in: guestHouseIds },
      isActive: true,
    }).lean();

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


    /* ---------- MAP OCCUPIED ROOMS PER GUEST HOUSE ---------- */
    const occupiedMap = {};

    activeBookings.forEach((b) => {
      const ghId = b.guestHouseId.toString();

      if (!occupiedMap[ghId]) {
        occupiedMap[ghId] = new Set();
      }

      occupiedMap[ghId].add(b.roomId.toString());
    });

    /* ---------- FINAL STATS ---------- */
    const stats = guestHouses.map((gh) => {
      const ghRooms = rooms.filter(
        (r) => r.guestHouseId.toString() === gh._id.toString(),
      );

      const totalRooms = ghRooms.length;

      const underMaintenance = ghRooms.filter(
        (r) => r.status === "MAINTENANCE",
      ).length;

      const occupiedRooms = occupiedMap[gh._id.toString()]?.size || 0;

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
