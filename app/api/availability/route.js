import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/lib/models/Booking.model';
import Bed from '@/lib/models/Bed.model';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401);

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
      // PENDING included too — matches the bed-assignment logic elsewhere, which treats
      // a pending request as already holding its bed so two overlapping requests can't
      // both land on it.
      status: { $in: ['PENDING', 'BOOKED', 'CHECKED_IN'] },
      checkInDate: { $lt: end },
      checkOutDate: { $gt: start },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const bookings = await Booking.find(query)
      .select('checkInDate checkOutDate bedId')
      .lean();

    const totalBeds = await Bed.countDocuments({ roomId, isActive: true });

    /* -------------------- BUILD BLOCKED SLOTS --------------------
       Tagged with bedId so the caller can tell whether a given moment has every bed
       taken (a real conflict) or just some of them (another bed is still free). */

    const blockedSlots = bookings.map((b) => ({
      from: b.checkInDate.toISOString(),
      to: b.checkOutDate.toISOString(),
      bedId: b.bedId ? b.bedId.toString() : null,
    }));

    return successResponse({
      roomId,
      from: start.toISOString(),
      to: end.toISOString(),
      totalBeds,
      blockedSlots,
    });
  } catch (err) {
    console.error('[Availability API]', err);
    return errorResponse('Internal server error', 500);
  }
}
