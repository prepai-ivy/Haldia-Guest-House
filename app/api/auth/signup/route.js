import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import User from "@/lib/models/User.model";
import Otp from "@/lib/models/Otp.model";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { name, email, password, phone, department } = await request.json();

    if (!name || !email || !password) {
      return errorResponse("Name, email and password are required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return errorResponse("Email already exists", 409);
    }

    const verifiedOtp = await Otp.findOne({
      email: normalizedEmail,
      purpose: "SIGNUP",
      verified: true,
    });

    if (!verifiedOtp) {
      return errorResponse(
        "Please verify your email with the OTP sent to it before signing up",
        400
      );
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password, // hashed by pre-save hook
      role: "CUSTOMER",
      phone,
      department,
    });

    await Otp.deleteMany({ email: normalizedEmail, purpose: "SIGNUP" });

    const userObject = user.toObject();
    delete userObject.password;

    return successResponse(userObject, 201);
  } catch (error) {
    console.error("[Signup Error]", error);

    if (error.code === 11000) {
      return errorResponse("Email already exists", 409);
    }

    return errorResponse("Internal server error", 500);
  }
}
