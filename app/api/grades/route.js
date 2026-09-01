import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getAuthUser } from '@/lib/auth';
import Grade from '@/lib/models/Grade.model';

export async function GET(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401);

    await connectToDatabase();

    const grades = await Grade.find({ isActive: true })
      .sort({ code: 1 })
      .lean();

    return successResponse(grades);
  } catch (error) {
    console.error('[Grades GET]', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    await connectToDatabase();

    const body = await request.json();
    const { code, allowedOccupancies } = body;

    if (!code || !code.trim()) {
      return errorResponse('Grade code is required', 400);
    }

    const occupancies = Array.isArray(allowedOccupancies) ? allowedOccupancies : [];
    const validOccupancies = occupancies.filter((o) => ['SINGLE', 'DOUBLE'].includes(o));

    if (validOccupancies.length === 0) {
      return errorResponse('Select at least one allowed occupancy type', 400);
    }

    const grade = await Grade.create({
      code: code.trim(),
      allowedOccupancies: validOccupancies,
    });

    return successResponse(grade, 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse('Grade code already exists', 409);
    }

    console.error('[Grades POST]', error);
    return errorResponse('Internal server error', 500);
  }
}
