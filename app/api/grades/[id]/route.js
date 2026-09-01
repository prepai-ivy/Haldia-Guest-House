import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/auth';
import Grade from '@/lib/models/Grade.model';
import mongoose from 'mongoose';

export async function PATCH(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid grade id', 400);
    }

    const body = await request.json();
    const updatePayload = {};

    if (body.code !== undefined) {
      if (!body.code.trim()) {
        return errorResponse('Grade code cannot be empty', 400);
      }
      updatePayload.code = body.code.trim();
    }
    if (body.allowedOccupancies !== undefined) {
      const validOccupancies = (Array.isArray(body.allowedOccupancies) ? body.allowedOccupancies : [])
        .filter((o) => ['SINGLE', 'DOUBLE'].includes(o));

      if (validOccupancies.length === 0) {
        return errorResponse('Select at least one allowed occupancy type', 400);
      }
      updatePayload.allowedOccupancies = validOccupancies;
    }
    if (body.isActive !== undefined) {
      updatePayload.isActive = !!body.isActive;
    }

    const grade = await Grade.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    );

    if (!grade) {
      return errorResponse('Grade not found', 404);
    }

    return successResponse(grade);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse('Grade code already exists', 409);
    }

    console.error('[Grade PATCH]', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid grade id', 400);
    }

    const grade = await Grade.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!grade) {
      return errorResponse('Grade not found', 404);
    }

    return successResponse({ message: 'Grade deactivated' });
  } catch (error) {
    console.error('[Grade DELETE]', error);
    return errorResponse('Internal server error', 500);
  }
}
