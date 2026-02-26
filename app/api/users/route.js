import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import User from '@/lib/models/User.model';

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password') // never send password
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(users);
  } catch (error) {
    console.error('[Users] Fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      email,
      password,
      role = 'customer',
      phone,
      department,
    } = body;

    if (!name || !email || !password) {
      return errorResponse(
        'name, email and password are required',
        400
      );
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      department,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return successResponse(userObj, 201);
  } catch (error) {
    console.error('[Users] Create error:', error);

    if (error.code === 11000) {
      return errorResponse('Email already exists', 409);
    }

    return errorResponse('Internal server error', 500);
  }
}
