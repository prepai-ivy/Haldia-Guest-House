import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import Otp from "@/lib/models/Otp.model";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return errorResponse("Email and OTP required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const record = await Otp.findOne({
      email: normalizedEmail,
      purpose: "SIGNUP",
    });

    if (!record) {
      return errorResponse("OTP expired or invalid", 400);
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

    return successResponse(
      { message: "Email verified successfully" },
      200
    );
  } catch (error) {
    console.error("[Verify OTP Error]", error);
    return errorResponse("Internal server error", 500);
  }
}
