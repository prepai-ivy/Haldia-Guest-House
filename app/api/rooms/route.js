import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import Room from '@/lib/models/Room.model';
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

    const rooms = await Room.find(filter)
      .sort({ floor: 1, roomNumber: 1 })
      .lean();

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
