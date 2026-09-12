import Otp from "@/lib/models/Otp.model";

const COOLDOWN_MS = 30 * 1000;

/**
 * Prevents an OTP's attempt counter from being trivially reset by just requesting a new
 * one — deleting and recreating the record (the existing send-otp flow) would otherwise
 * wipe `attempts` back to 0 for free, defeating the 5-try cap on verify-otp.
 *
 * Returns null if a new OTP can be requested now, or the number of seconds left to wait.
 */
export async function getOtpCooldownSeconds(email, purpose) {
  const recent = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!recent) return null;

  const elapsed = Date.now() - recent.createdAt.getTime();
  if (elapsed >= COOLDOWN_MS) return null;

  return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
}
