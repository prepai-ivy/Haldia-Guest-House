import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import Room from '@/lib/models/Room.model';
import Bed from '@/lib/models/Bed.model';
import Booking from '@/lib/models/Booking.model';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

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

    const { id } = await params;
    const body = await request.json();

    console.log('[Room PATCH] id:', id, '| body:', JSON.stringify(body));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('[Room PATCH] 400 - Invalid room id:', id);
      return errorResponse('Invalid room id', 400);
    }

    const room = await Room.findById(id);
    if (!room) {
      return errorResponse('Room not found', 404);
    }

    const updatePayload = {};

    if (body.roomNumber !== undefined) updatePayload.roomNumber = body.roomNumber;
    if (body.floor !== undefined) updatePayload.floor = body.floor;
    if (body.amenities !== undefined) updatePayload.amenities = body.amenities;

    if (body.type) {
      if (!['SINGLE', 'DOUBLE'].includes(body.type)) {
        console.log('[Room PATCH] 400 - Invalid room type:', body.type);
        return errorResponse('Invalid room type', 400);
      }
      updatePayload.type = body.type;
    }

    // Maintenance is scheduled exclusively via POST /api/rooms/[id]/maintenance now
    // (that flow checks for conflicting bookings first) — a direct status toggle here
    // would bypass that check entirely, so it's no longer accepted.

    /* -------- CAPACITY CHANGE: keep Bed documents in sync -------- */
    if (body.capacity !== undefined && body.capacity !== room.capacity) {
      const newCapacity = body.capacity;
      if (!Number.isInteger(newCapacity) || newCapacity < 1) {
        return errorResponse('capacity must be a positive integer', 400);
      }

      if (newCapacity > room.capacity) {
        for (let n = room.capacity + 1; n <= newCapacity; n++) {
          // $set (not $setOnInsert) so a bed that was previously deactivated by a capacity
          // decrease gets reactivated here too — $setOnInsert only fires on a brand-new
          // insert, so it silently no-opped against an existing-but-inactive bed doc,
          // permanently stranding it inactive even after capacity was raised back up.
          await Bed.updateOne(
            { roomId: id, bedNumber: n },
            { $set: { isActive: true } },
            { upsert: true }
          );
        }
      } else {
        const bedsToRemove = await Bed.find({
          roomId: id,
          bedNumber: { $gt: newCapacity },
          isActive: true,
        });

        // PENDING included too — an unapproved request would otherwise survive a capacity
        // reduction and could later be approved onto a bed that's since been deactivated.
        const activeBookingOnRemovedBed = await Booking.findOne({
          bedId: { $in: bedsToRemove.map((b) => b._id) },
          status: { $in: ['PENDING', 'BOOKED', 'CHECKED_IN'] },
        });

        if (activeBookingOnRemovedBed) {
          return errorResponse(
            'Cannot reduce capacity — one of the beds being removed has a pending or active booking',
            409
          );
        }

        await Bed.updateMany(
          { _id: { $in: bedsToRemove.map((b) => b._id) } },
          { isActive: false }
        );
      }

      updatePayload.capacity = newCapacity;
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    );

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

    await Bed.updateMany({ roomId: id }, { isActive: false });

    return successResponse({ message: 'Room deactivated' });
  } catch (err) {
    console.error('[Room DELETE]', err);
    return errorResponse('Internal server error', 500);
  }
}
