import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import User from "@/lib/models/User.model";
import Otp from "@/lib/models/Otp.model";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { email, otp, password } =
      await request.json();

    if (!email || !otp || !password) {
      return errorResponse(
        "All fields are required",
        400
      );
    }

    const normalizedEmail = email.toLowerCase();

    const record = await Otp.findOne({
      email: normalizedEmail,
      purpose: "RESET_PASSWORD",
    });

    if (!record) {
      return errorResponse(
        "OTP expired or invalid",
        400
      );
    }

    if (record.attempts >= 5) {
      return errorResponse("Too many attempts", 400);
    }

    const isMatch = await bcrypt.compare(
      otp,
      record.otpHash
    );

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return errorResponse("Invalid OTP", 400);
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    user.password = password; // hashed by pre-save
    await user.save();

    await Otp.deleteMany({
      email: normalizedEmail,
      purpose: "RESET_PASSWORD",
    });

    return successResponse(
      { message: "Password reset successful" },
      200
    );
  } catch (error) {
    console.error("[Reset Password Error]", error);
    return errorResponse("Internal server error", 500);
  }
}
