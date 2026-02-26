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
      return errorResponse("Email required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't reveal if user exists
      return successResponse({ message: "If account exists, OTP sent" }, 200);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({
      email: normalizedEmail,
      purpose: "RESET_PASSWORD",
    });

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      purpose: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendMail({
      email: normalizedEmail,
      subject: "Password Reset OTP - Haldia Guest House",
      html: `
        <h2>Password Reset</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    return successResponse({ message: "OTP sent successfully" }, 200);
  } catch (error) {
    console.error("[Send OTP Error]", error);
    return errorResponse("Internal server error", 500);
  }
}
