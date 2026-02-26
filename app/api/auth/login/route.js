import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import User from '@/lib/models/User.model';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase();

    // remove .lean()
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return errorResponse('Email address not found', 401);
    }

    // bcrypt comparison
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return errorResponse('Invalid Password', 401);
    }

    // Create JWT
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    // remove password safely
    const userObject = user.toObject();
    delete userObject.password;

    return successResponse({
      user: userObject,
      token,
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    return errorResponse('Internal server error', 500);
  }
}
