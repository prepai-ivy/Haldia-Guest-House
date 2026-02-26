import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import Room from '@/lib/models/Room.model';
import Booking from '@/lib/models/Booking.model';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
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

    const now = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    const nowIST = new Date(now.getTime() + IST_OFFSET);

    const startOfTodayIST = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate()
    );

    const endOfTodayIST = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate() + 1
    );

    const startUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET);
    const endUTC = new Date(endOfTodayIST.getTime() - IST_OFFSET);

    /* ---------- FETCH ROOMS ---------- */

    const rooms = await Room.find({
      guestHouseId: objId,
      isActive: true,
    }).lean();

    /* ---------- TODAY OCCUPANCY ---------- */

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

    const occupiedRoomIds = new Set(
      todayBookings.map(b => b.roomId.toString())
    );

    /* ---------- ROOM LEVEL STATS ---------- */

    const roomStats = rooms.map(room => {
      const isUnderMaintenance = room.status === 'MAINTENANCE';
      const isOccupied = occupiedRoomIds.has(room._id.toString());

      let todayStatus = 'AVAILABLE';

      if (isUnderMaintenance) {
        todayStatus = 'MAINTENANCE';
      } else if (isOccupied) {
        todayStatus = 'OCCUPIED';
      }

      return {
        _id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity,
        floor: room.floor,
        amenities: room.amenities,
        status: room.status,
        todayStatus,
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
