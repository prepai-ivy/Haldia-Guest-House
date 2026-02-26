import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import GuestHouse from '@/lib/models/GuestHouse.model';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';
import Room from '@/lib/models/Room.model';
import Booking from '@/lib/models/Booking.model';

export async function GET(request, context) {
  try {
    await connectToDatabase();

    const { id } = context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid guest house id', 400);
    }

    const guestHouse = await GuestHouse.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!guestHouse) {
      return errorResponse('Guest house not found', 404);
    }

    return successResponse(guestHouse);
  } catch (error) {
    console.error('[GuestHouse GET]', error);
    return errorResponse('Internal server error', 500);
  }
}


export async function PUT(request, context) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser || !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return errorResponse('Forbidden', 403);
    }

    const { id } = context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid guest house id', 400);
    }

    const body = await request.json();

    const updatePayload = {
      name: body.name,
      location: body.location,
      category: body.category,
      address: body.address,
    };

    // Remove undefined fields
    Object.keys(updatePayload).forEach(
      (key) => updatePayload[key] === undefined && delete updatePayload[key]
    );

    const updated = await GuestHouse.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return errorResponse('Guest house not found', 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error('[GuestHouse UPDATE]', error);
    return errorResponse('Internal server error', 500);
  }
}


export async function DELETE(request, context) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid guest house id', 400);
    }

    /* ---------- CHECK BOOKINGS EXIST ---------- */

    const hasBookings = await Booking.exists({ guestHouseId: id });

    if (hasBookings) {
      return errorResponse(
        'Cannot delete guest house with existing bookings',
        400
      );
    }

    // Soft-delete guest house
    const guestHouse = await GuestHouse.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!guestHouse) {
      return errorResponse('Guest house not found', 404);
    }

    // Disable all rooms under this guest house
    await Room.updateMany(
      { guestHouseId: id },
      { isActive: false }
    );

    return successResponse({ message: 'Guest house deactivated' });
  } catch (error) {
    console.error('[GuestHouse DELETE]', error);
    return errorResponse('Internal server error', 500);
  }
}
