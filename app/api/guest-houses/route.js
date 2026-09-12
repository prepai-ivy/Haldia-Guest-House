import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/auth';
import GuestHouse from '@/lib/models/GuestHouse.model';
import Room from '@/lib/models/Room.model';
import Bed from '@/lib/models/Bed.model';
import Booking from '@/lib/models/Booking.model';
import RoomMaintenance from '@/lib/models/RoomMaintainence.modal';
import { getISTDayBoundsUTC } from '@/lib/istDate';

export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401);

    await connectToDatabase();

    /* ---------------- IST DAY BOUNDARY ---------------- */
    const { startUTC, endUTC } = getISTDayBoundsUTC();

    /* ---------------- FETCH GUEST HOUSES ---------------- */
    const guestHouses = await GuestHouse.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const guestHouseIds = guestHouses.map((g) => g._id);

    /* ---------------- ROOMS + BEDS ---------------- */
    const rooms = await Room.find({
      guestHouseId: { $in: guestHouseIds },
      isActive: true,
    }).lean();
    const roomIds = rooms.map((r) => r._id);

    const totalBedsAgg = await Bed.aggregate([
      { $match: { roomId: { $in: roomIds }, isActive: true } },
      { $group: { _id: '$roomId', total: { $sum: 1 } } },
    ]);
    const totalBedsMap = {};
    totalBedsAgg.forEach((r) => { totalBedsMap[r._id.toString()] = r.total; });

    const maintenanceRoomIds = await RoomMaintenance.distinct('roomId', {
      roomId: { $in: roomIds },
      status: 'ACTIVE',
      startDate: { $lt: endUTC },
      endDate: { $gt: startUTC },
    });
    const maintenanceSet = new Set(maintenanceRoomIds.map((id) => id.toString()));

    /* ---------------- CURRENTLY OCCUPIED (bed-level) ---------------- */
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

    const occupiedBedsPerRoom = {}; // roomId -> Set(bedId)
    activeBookings.forEach((b) => {
      if (!b.bedId) return; // legacy booking predating bed-level booking — not attributable to a bed
      const rid = b.roomId.toString();
      if (!occupiedBedsPerRoom[rid]) occupiedBedsPerRoom[rid] = new Set();
      occupiedBedsPerRoom[rid].add(b.bedId.toString());
    });

    /* ---------------- FINAL RESPONSE ---------------- */
    const result = guestHouses.map((gh) => {
      const ghRooms = rooms.filter((r) => r.guestHouseId.toString() === gh._id.toString());
      const totalRooms = ghRooms.length;

      let underMaintenance = 0;
      let occupied = 0;
      ghRooms.forEach((r) => {
        const idStr = r._id.toString();
        if (maintenanceSet.has(idStr)) {
          underMaintenance++;
          return;
        }
        const total = totalBedsMap[idStr] || 0;
        const occupiedBeds = occupiedBedsPerRoom[idStr]?.size || 0;
        if (total > 0 && occupiedBeds >= total) occupied++;
      });

      const available = Math.max(totalRooms - occupied - underMaintenance, 0);

      const utilization =
        totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

      return {
        _id: gh._id,
        name: gh.name,
        location: gh.location,
        category: gh.category,

        totalRooms,
        underMaintenance,
        occupied,
        available,
        utilization,
      };
    });

    return successResponse(result);
  } catch (error) {
    console.error('[Guest Houses GET]', error);
    return errorResponse('Internal server error', 500);
  }
}




export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) return errorResponse('Unauthorized', 401);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return errorResponse('Forbidden', 403);

    await connectToDatabase();

    const body = await request.json();
    const { name, location, category, address } = body;

    if (!name) {
      return errorResponse('Guest house name is required', 400);
    }

    const guestHouse = await GuestHouse.create({
      name,
      location,
      category,
      address,
      isActive: true,
    });

    return successResponse(guestHouse, 201);
  } catch (error) {
    console.error('[Guest Houses POST]', error);
    return errorResponse('Internal server error', 500);
  }
}
