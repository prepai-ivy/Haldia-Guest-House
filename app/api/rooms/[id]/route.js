import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import Room from '@/lib/models/Room.model';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid room id', 400);
    }

    const room = await Room.findById(id).lean();
    if (!room) return errorResponse('Room not found', 404);

    return successResponse(room);
  } catch (err) {
    console.error('[Room GET]', err);
    return errorResponse('Internal server error', 500);
  }
}


/* -------------------- PATCH -------------------- */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return errorResponse('Forbidden', 403);
    }

    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid room id', 400);
    }

    const updatePayload = {};

    if (body.roomNumber !== undefined) updatePayload.roomNumber = body.roomNumber;
    if (body.capacity !== undefined) updatePayload.capacity = body.capacity;
    if (body.floor !== undefined) updatePayload.floor = body.floor;
    if (body.amenities !== undefined) updatePayload.amenities = body.amenities;

    if (body.type) {
      if (!['SINGLE', 'DOUBLE'].includes(body.type)) {
        return errorResponse('Invalid room type', 400);
      }
      updatePayload.type = body.type;
    }

    if (body.status) {
      if (!['ACTIVE', 'MAINTENANCE'].includes(body.status)) {
        return errorResponse('Invalid room status', 400);
      }
      updatePayload.status = body.status;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    );

    if (!updatedRoom) {
      return errorResponse('Room not found', 404);
    }

    return successResponse(updatedRoom);
  } catch (err) {
    console.error('[Room PATCH]', err);

    if (err.code === 11000) {
      return errorResponse(
        'Room number already exists in this guest house',
        409
      );
    }

    return errorResponse('Internal server error', 500);
  }
}


/* -------------------- DELETE -------------------- */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid room id', 400);
    }

    const room = await Room.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!room) {
      return errorResponse('Room not found', 404);
    }

    return successResponse({ message: 'Room deactivated (maintenance)' });
  } catch (err) {
    console.error('[Room DELETE]', err);
    return errorResponse('Internal server error', 500);
  }
}
