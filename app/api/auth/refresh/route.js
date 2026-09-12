import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import User from "@/lib/models/User.model";
import RefreshToken from "@/lib/models/RefreshToken.model";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
} from "@/lib/auth";

// Exchanges a refresh token for a new access token. This is the one place that re-reads
// the user's current role/isActive from the DB — every other request only trusts the
// short-lived access token's signature (see lib/auth.js). A revoked/expired refresh token,
// or a user who's since been deactivated, fails here, which is what actually forces a
// demoted/deactivated user out once their current access token expires.
export async function POST(request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) return errorResponse("Refresh token is required", 400);

    await connectToDatabase();

    const tokenHash = hashRefreshToken(refreshToken);
    const record = await RefreshToken.findOne({ tokenHash });

    if (!record || record.revoked || record.expiresAt < new Date()) {
      return errorResponse("Invalid or expired refresh token", 401);
    }

    const user = await User.findById(record.userId);
    if (!user || !user.isActive) {
      record.revoked = true;
      await record.save();
      return errorResponse("Account is no longer active", 401);
    }

    // Rotate on every use: the old token can never be replayed again, even if it leaked.
    record.revoked = true;
    await record.save();

    const newRefreshToken = generateRefreshToken();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: getRefreshTokenExpiryDate(),
    });

    const accessToken = generateAccessToken(user);

    const userObject = user.toObject();
    delete userObject.password;

    return successResponse({
      user: userObject,
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("[Auth Refresh Error]", error);
    return errorResponse("Internal server error", 500);
  }
}
