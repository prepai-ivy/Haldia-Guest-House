import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import Room from '@/lib/models/Room.model';
import Bed from '@/lib/models/Bed.model';
import Booking from '@/lib/models/Booking.model';
import RoomMaintenance from '@/lib/models/RoomMaintainence.modal';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';
import { getISTDayBoundsUTC } from '@/lib/istDate';

export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401);

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const guestHouseId = searchParams.get('guestHouseId');

    if (!guestHouseId) {
      return errorResponse('guestHouseId is required', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(guestHouseId)) {
      return errorResponse('Invalid guestHouseId', 400);
    }

    const objId = new mongoose.Types.ObjectId(guestHouseId);

    /* ---------- IST DAY BOUNDARY ---------- */

    const { startUTC, endUTC } = getISTDayBoundsUTC();

    /* ---------- FETCH ROOMS ---------- */

    const rooms = await Room.find({
      guestHouseId: objId,
      isActive: true,
    }).lean();
    const roomIds = rooms.map((r) => r._id);

    /* ---------- BED COUNTS PER ROOM ---------- */

    const totalBedsAgg = await Bed.aggregate([
      { $match: { roomId: { $in: roomIds }, isActive: true } },
      { $group: { _id: '$roomId', total: { $sum: 1 } } },
    ]);
    const totalBedsMap = {};
    totalBedsAgg.forEach((r) => { totalBedsMap[r._id.toString()] = r.total; });

    /* ---------- TODAY OCCUPANCY (bed-level) ---------- */

    const todayBookings = await Booking.find({
      guestHouseId: objId,
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
    todayBookings.forEach((b) => {
      if (!b.bedId) return; // legacy booking predating bed-level booking — not attributable to a bed
      const rid = b.roomId.toString();
      if (!occupiedBedsPerRoom[rid]) occupiedBedsPerRoom[rid] = new Set();
      occupiedBedsPerRoom[rid].add(b.bedId.toString());
    });

    /* ---------- TODAY MAINTENANCE ---------- */

    const maintenanceRoomIds = await RoomMaintenance.distinct('roomId', {
      roomId: { $in: roomIds },
      status: 'ACTIVE',
      startDate: { $lt: endUTC },
      endDate: { $gt: startUTC },
    });
    const maintenanceSet = new Set(maintenanceRoomIds.map((id) => id.toString()));

    /* ---------- ROOM LEVEL STATS ---------- */

    const roomStats = rooms.map(room => {
      const idStr = room._id.toString();
      const totalBeds = totalBedsMap[idStr] || 0;
      const occupiedBeds = occupiedBedsPerRoom[idStr]?.size || 0;
      const isUnderMaintenance = maintenanceSet.has(idStr);
      const isFullyOccupied = totalBeds > 0 && occupiedBeds >= totalBeds;

      let todayStatus = 'AVAILABLE';

      if (isUnderMaintenance) {
        todayStatus = 'MAINTENANCE';
      } else if (isFullyOccupied) {
        todayStatus = 'OCCUPIED';
      }

      return {
        _id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity,
        floor: room.floor,
        amenities: room.amenities,
        todayStatus,
        totalBeds,
        occupiedBeds,
        isAvailableForAllocation:
          todayStatus === 'AVAILABLE',
      };
    });

    /* ---------- SUMMARY ---------- */

    const totalRooms = rooms.length;
    const occupiedToday = roomStats.filter(r => r.todayStatus === 'OCCUPIED').length;
    const underMaintenanceToday = roomStats.filter(r => r.todayStatus === 'MAINTENANCE').length;
    const availableToday = roomStats.filter(r => r.todayStatus === 'AVAILABLE').length;

    const utilizationToday =
      totalRooms > 0
        ? Math.round((occupiedToday / totalRooms) * 100)
        : 0;

    const summary = {
      totalRooms,
      occupiedToday,
      availableToday,
      underMaintenanceToday,
      utilizationToday,
    };

    return successResponse({
      summary,
      rooms: roomStats,
    });

  } catch (error) {
    console.error('[Room Stats] Fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
