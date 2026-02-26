import Booking from '@/lib/models/Booking.model';
import { connectToDatabase } from '@/lib/mongodb';

import Room from '@/lib/models/Room.model';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function PATCH(req, { params }) {
    await connectToDatabase();
    const { id } = await params;
  const booking = await Booking.findById(id);
  if (!booking) return errorResponse('Booking not found', 404);

  if (booking.status !== 'pending') {
    return errorResponse('Booking already processed', 400);
  }

  const room = await Room.findById(booking.roomId);
  if (!room || room.status !== 'available') {
    return errorResponse('Room not available', 409);
  }

  booking.status = 'checked_in';
  await booking.save();

  room.status = 'occupied';
  await room.save();

  return successResponse({ message: 'Booking approved & room occupied' });
}
