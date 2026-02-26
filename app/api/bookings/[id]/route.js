import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/lib/models/Booking.model";
import { successResponse, errorResponse } from "@/lib/api-utils";
import mongoose from "mongoose";
import { getAuthUser } from "@/lib/auth";
import "@/lib/models/GuestHouse.model"; // register schema for populate
import "@/lib/models/Room.model";        // register schema for populate
import "@/lib/models/User.model";        // register schema for populate

export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser || !["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid booking id", 400);
    }

    const { status: action } = await request.json();

    console.log("Action:", action);

    if (!action) {
      return errorResponse("Action is required", 400);
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    const now = new Date();

    /* ---------- STATE MACHINE ---------- */

    if (action === "APPROVE") {
      if (booking.status !== "PENDING") {
        return errorResponse("Only pending bookings can be approved", 400);
      }

      booking.status = "BOOKED";
    }

    if (action === "REJECT") {
      if (booking.status !== "PENDING") {
        return errorResponse("Only pending bookings can be rejected", 400);
      }

      booking.status = "REJECTED";
    }

    // CHECK-IN
    if (action === "CHECK_IN") {
      if (booking.status !== "BOOKED") {
        return errorResponse("Only BOOKED bookings can be checked in", 400);
      }

      booking.status = "CHECKED_IN";
      booking.actualCheckIn = now;
    }

    // CHECK-OUT
    if (action === "CHECK_OUT") {
      if (booking.status !== "CHECKED_IN") {
        return errorResponse(
          "Only CHECKED_IN bookings can be checked out",
          400,
        );
      }

      booking.status = "CHECKED_OUT";
      booking.actualCheckOut = now;
    }

    // CANCEL
    if (action === "CANCEL") {
      if (booking.status !== "BOOKED") {
        return errorResponse("Only BOOKED bookings can be cancelled", 400);
      }

      booking.status = "CANCELLED";
    }

    const allowedActions = [
      "APPROVE",
      "REJECT",
      "CHECK_IN",
      "CHECK_OUT",
      "CANCEL",
    ];

    if (!allowedActions.includes(action)) {
      return errorResponse("Invalid action", 400);
    }

    await booking.save();

    const updated = await Booking.findById(id)
      .populate("guestHouseId", "name location category")
      .populate("roomId", "roomNumber type")
      .populate("userId", "name email department");

    return successResponse(updated);
  } catch (err) {
    console.error("[BOOKING PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}
