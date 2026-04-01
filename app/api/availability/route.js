import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/lib/models/Booking.model';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const excludeId = searchParams.get('excludeId'); // booking ID to exclude (for edit)

    if (!roomId || !from || !to) {
      return errorResponse('Missing query parameters', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return errorResponse('Invalid roomId', 400);
    }

    const start = new Date(from);
    const end = new Date(to);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return errorResponse('Invalid date-time range', 400);
    }

    /* -------------------- FIND BLOCKING BOOKINGS -------------------- */

    const query = {
      roomId: new ObjectId(roomId),
      status: { $in: ['BOOKED', 'CHECKED_IN'] },
      checkInDate: { $lt: end },
      checkOutDate: { $gt: start },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const bookings = await Booking.find(query)
      .select('checkInDate checkOutDate')
      .lean();

    /* -------------------- BUILD BLOCKED SLOTS -------------------- */

    const blockedSlots = bookings.map((b) => ({
      from: b.checkInDate.toISOString(),
      to: b.checkOutDate.toISOString(),
    }));

    return successResponse({
      roomId,
      from: start.toISOString(),
      to: end.toISOString(),
      blockedSlots,
    });
  } catch (err) {
    console.error('[Availability API]', err);
    return errorResponse('Internal server error', 500);
  }
}
