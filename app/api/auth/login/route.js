import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import User from '@/lib/models/User.model';
import RefreshToken from '@/lib/models/RefreshToken.model';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
} from '@/lib/auth';

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

    if (!user.isActive) {
      return errorResponse('This account has been deactivated. Contact an administrator.', 403);
    }

    // Short-lived access token + a long-lived, revocable refresh token — see lib/auth.js
    // for why (bounds how long a demoted/deactivated account's token stays usable).
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
    });

    // remove password safely
    const userObject = user.toObject();
    delete userObject.password;

    return successResponse({
      user: userObject,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    return errorResponse('Internal server error', 500);
  }
}
