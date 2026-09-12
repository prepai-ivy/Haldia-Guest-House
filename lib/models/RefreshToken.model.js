import mongoose from "mongoose";

// Refresh tokens are stored hashed (never the raw token) so a DB read alone can't be used
// to impersonate a session. Revoking a user's tokens here (role change / deactivation) is
// what actually bounds how long a stale access token stays useful — see lib/auth.js.
const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", RefreshTokenSchema);
