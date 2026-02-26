import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import User from "@/lib/models/User.model";
import Otp from "@/lib/models/Otp.model";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "@/lib/mail";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { email } = await request.json();

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return errorResponse("Email already exists", 409);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({
      email: normalizedEmail,
      purpose: "SIGNUP",
    });

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      purpose: "SIGNUP",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const mailSent = await sendMail({
      email: normalizedEmail,
      subject: "Verify Your Email - Haldia Guest House",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    if (!mailSent) {
      return errorResponse("Failed to send OTP email", 500);
    }

    return successResponse(
      { message: "OTP sent successfully" },
      200
    );
  } catch (error) {
    console.error("[Signup Send OTP Error]", error);
    return errorResponse("Internal server error", 500);
  }
}
