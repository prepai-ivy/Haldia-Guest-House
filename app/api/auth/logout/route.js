import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import RefreshToken from "@/lib/models/RefreshToken.model";
import { hashRefreshToken } from "@/lib/auth";

// Best-effort: revokes the refresh token so it can't be used again. Missing/already-invalid
// tokens aren't an error — the client is logging out either way.
export async function POST(request) {
  try {
    const { refreshToken } = await request.json().catch(() => ({}));
    if (refreshToken) {
      await connectToDatabase();
      await RefreshToken.updateOne(
        { tokenHash: hashRefreshToken(refreshToken) },
        { $set: { revoked: true } },
      );
    }
    return successResponse({ ok: true });
  } catch (error) {
    console.error("[Auth Logout Error]", error);
    return errorResponse("Internal server error", 500);
  }
}
