import { connectToDatabase } from "@/lib/mongodb";
import Booking from "@/lib/models/Booking.model";
import User from "@/lib/models/User.model";
import { successResponse, errorResponse } from "@/lib/api-utils";
import mongoose from "mongoose";
import { getAuthUser } from "@/lib/auth";
import "@/lib/models/GuestHouse.model"; // register schema for populate
import "@/lib/models/Room.model";        // register schema for populate
import sendMail from "@/lib/mail";
import { bookingOnlyEmail } from "@/lib/emailTemplates";

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

    const body = await request.json();
    const { status: action, ...editFields } = body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    /* ---------- EDIT MODE (no action provided) ---------- */
    if (!action) {
      if (!["PENDING", "BOOKED"].includes(booking.status)) {
        return errorResponse("Only PENDING or BOOKED bookings can be edited", 400);
      }

      const { guestName, department, purpose, paymentMode, checkInDate, checkOutDate, roomId, guestHouseId } = editFields;

      if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        if (checkIn >= checkOut) return errorResponse("Invalid date range", 400);

        // Overlap check (exclude current booking)
        const overlapBookings = await Booking.find({
          _id: { $ne: booking._id },
          roomId: new mongoose.Types.ObjectId(roomId || booking.roomId),
          status: { $in: ["BOOKED", "CHECKED_IN"] },
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn },
        })
          .select('checkInDate checkOutDate')
          .lean();

        if (overlapBookings.length > 0) {
          const ranges = overlapBookings.map((ob) => {
            const from = new Date(ob.checkInDate).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
            });
            const to = new Date(ob.checkOutDate).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
            });
            return `${from} – ${to}`;
          });
          const uniqueRanges = [...new Set(ranges)];
          return errorResponse(`Room already booked for those ranges: ${uniqueRanges.join('; ')}`, 409);
        }

        booking.checkInDate = checkIn;
        booking.checkOutDate = checkOut;
      }

      if (department !== undefined) booking.department = department;
      if (purpose !== undefined) booking.purpose = purpose;
      if (paymentMode !== undefined) booking.paymentMode = paymentMode;
      if (roomId) booking.roomId = new mongoose.Types.ObjectId(roomId);
      if (guestHouseId) booking.guestHouseId = new mongoose.Types.ObjectId(guestHouseId);

      if (guestName) {
        await User.findByIdAndUpdate(booking.userId, { name: guestName });
      }

      await booking.save();

      const updated = await Booking.findById(id)
        .populate("guestHouseId", "name location category")
        .populate("roomId", "roomNumber type")
        .populate("userId", "name email department");

      return successResponse(updated);
    }

    /* ---------- ACTION MODE (state machine) ---------- */
    const allowedActions = ["APPROVE", "REJECT", "CHECK_IN", "CHECK_OUT", "CANCEL"];
    if (!allowedActions.includes(action)) {
      return errorResponse("Invalid action", 400);
    }

    const now = new Date();

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

    if (action === "CHECK_IN") {
      if (booking.status !== "BOOKED") {
        return errorResponse("Only BOOKED bookings can be checked in", 400);
      }
      booking.status = "CHECKED_IN";
      booking.actualCheckIn = now;
    }

    if (action === "CHECK_OUT") {
      if (booking.status !== "CHECKED_IN") {
        return errorResponse("Only CHECKED_IN bookings can be checked out", 400);
      }
      booking.status = "CHECKED_OUT";
      booking.actualCheckOut = now;
    }

    if (action === "CANCEL") {
      if (booking.status !== "BOOKED") {
        return errorResponse("Only BOOKED bookings can be cancelled", 400);
      }
      booking.status = "CANCELLED";
    }

    await booking.save();

    const updated = await Booking.findById(id)
      .populate("guestHouseId", "name location category")
      .populate("roomId", "roomNumber type")
      .populate("userId", "name email department");

    // Send confirmation email on APPROVE
    if (action === "APPROVE") {
      try {
        const bookingUser = await User.findById(booking.userId);
        if (bookingUser) {
          await sendMail({
            email: bookingUser.email,
            subject: "Guest House Booking Confirmed",
            html: bookingOnlyEmail({
              name: bookingUser.name,
              booking: updated,
            }),
          });
        }
      } catch (mailErr) {
        console.error("[APPROVE email error]", mailErr);
      }
    }

    return successResponse(updated);
  } catch (err) {
    console.error("[BOOKING PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}
