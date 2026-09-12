import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import Room from '@/lib/models/Room.model';
import Bed from '@/lib/models/Bed.model';
import Booking from '@/lib/models/Booking.model';
import RoomMaintenance from '@/lib/models/RoomMaintainence.modal';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';
import GuestHouse from '@/lib/models/GuestHouse.model';

export async function GET(request) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const guestHouseId = searchParams.get('guestHouseId');

    const filter = {
      isActive: true,
    };

    if (guestHouseId) {
      if (!mongoose.Types.ObjectId.isValid(guestHouseId)) {
        return errorResponse('Invalid guestHouseId', 400);
      }
      filter.guestHouseId = new mongoose.Types.ObjectId(guestHouseId);
    }

    let rooms = await Room.find(filter)
      .sort({ floor: 1, roomNumber: 1 })
      .lean();

    const roomIds = rooms.map((r) => r._id);

    const totalBedsAgg = await Bed.aggregate([
      { $match: { roomId: { $in: roomIds }, isActive: true } },
      { $group: { _id: '$roomId', total: { $sum: 1 } } },
    ]);
    const totalBedsMap = {};
    totalBedsAgg.forEach((r) => { totalBedsMap[r._id.toString()] = r.total; });

    // Always attach bed counts, even without a date filter, so callers (room selection,
    // room inventory) can show "X of Y beds" without a second request.
    rooms = rooms.map((r) => ({ ...r, totalBeds: totalBedsMap[r._id.toString()] || 0 }));

    // Filter by date availability if from/to provided — a room stays available as long as
    // it has at least one free bed for those dates (bed-level, not whole-room) and isn't
    // under maintenance for that window.
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      if (!isNaN(start) && !isNaN(end) && start < end) {
        const occupiedBedsAgg = await Booking.aggregate([
          {
            $match: {
              roomId: { $in: roomIds },
              status: { $in: ['BOOKED', 'CHECKED_IN'] },
              checkInDate: { $lt: end },
              checkOutDate: { $gt: start },
            },
          },
          { $group: { _id: { room: '$roomId', bed: '$bedId' } } },
          { $group: { _id: '$_id.room', occupied: { $sum: 1 } } },
        ]);
        const occupiedBedsMap = {};
        occupiedBedsAgg.forEach((r) => { occupiedBedsMap[r._id.toString()] = r.occupied; });

        const maintenanceRoomIds = await RoomMaintenance.distinct('roomId', {
          roomId: { $in: roomIds },
          status: 'ACTIVE',
          startDate: { $lt: end },
          endDate: { $gt: start },
        });
        const maintenanceSet = new Set(maintenanceRoomIds.map((id) => id.toString()));

        rooms = rooms
          .map((r) => {
            const idStr = r._id.toString();
            const occupied = occupiedBedsMap[idStr] || 0;
            return {
              ...r,
              occupiedBeds: occupied,
              availableBeds: Math.max(r.totalBeds - occupied, 0),
              underMaintenance: maintenanceSet.has(idStr),
            };
          })
          .filter((r) => !r.underMaintenance && r.availableBeds > 0);
      }
    }

    return successResponse(rooms);
  } catch (error) {
    console.error('[Rooms GET]', error);
    return errorResponse('Internal server error', 500);
  }
}




export async function POST(request) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const {
      guestHouseId,
      roomNumber,
      type,
      capacity = 1,
      amenities = [],
      floor = 1,
    } = body;

    if (!guestHouseId || !roomNumber || !type) {
      return errorResponse(
        'guestHouseId, roomNumber and type are required',
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(guestHouseId)) {
      return errorResponse('Invalid guestHouseId', 400);
    }

    if (!['SINGLE', 'DOUBLE'].includes(type)) {
      return errorResponse('Invalid room type', 400);
    }

    /* -------- Validate guest house exists -------- */
    const guestHouseExists = await GuestHouse.exists({
      _id: guestHouseId,
      isActive: true,
    });

    if (!guestHouseExists) {
      return errorResponse('Guest house not found', 404);
    }

    const room = await Room.create({
      guestHouseId: new mongoose.Types.ObjectId(guestHouseId),
      roomNumber,
      type,
      capacity,
      status: 'ACTIVE',
      amenities,
      floor,
    });

    const bedDocs = Array.from({ length: capacity }, (_, i) => ({
      roomId: room._id,
      bedNumber: i + 1,
    }));
    await Bed.insertMany(bedDocs);

    return successResponse(room, 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(
        'Room number already exists in this guest house',
        409
      );
    }

    console.error('[Rooms POST]', error);
    return errorResponse('Internal server error', 500);
  }
}
