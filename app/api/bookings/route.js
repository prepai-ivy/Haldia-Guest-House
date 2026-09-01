import { connectToDatabase, useTransactions } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import Booking from "@/lib/models/Booking.model";
import Room from "@/lib/models/Room.model";
import User from "@/lib/models/User.model";
import Grade from "@/lib/models/Grade.model";
import "@/lib/models/GuestHouse.model"; // register schema for populate
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import sendMail from "@/lib/mail";
import { generatePassword } from "@/lib/password";
import {
  bookingOnlyEmail,
  credentialsAndBookingEmail,
  bookingRequestEmail,
  newBookingNotificationEmail,
} from "@/lib/emailTemplates";

export async function GET(request) {
  try {
    await connectToDatabase();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const guestHouseId = searchParams.get("guestHouseId");

    const filter = {};

    /* -------- STATUS FILTER -------- */
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim());
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    /* -------- GUEST HOUSE FILTER -------- */
    if (guestHouseId) {
      filter.guestHouseId = new ObjectId(guestHouseId);
    }

    /* -------- ROLE-BASED ACCESS -------- */
    if (authUser.role === "CUSTOMER") {
      filter.userId = new ObjectId(authUser._id);
    }

    const bookings = await Booking.find(filter)
      .populate("guestHouseId", "name location category")
      .populate("roomId", "roomNumber type")
      .populate("userId", "name email department")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(bookings);
  } catch (err) {
    console.error("[Bookings GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request) {
  let session = null;

  try {
    await connectToDatabase();
    session = await mongoose.startSession();
    if (useTransactions) session.startTransaction();

    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const {
      guestHouseId,
      roomId,
      checkInDate,
      checkOutDate,
      purpose,
      department,
      email,
      guestName,
      paymentMode,
      occupancyType,
    } = body;

    if (!guestHouseId || !roomId || !checkInDate || !checkOutDate) {
      throw new Error("Missing required fields");
    }

    if (!["SINGLE", "DOUBLE"].includes(occupancyType)) {
      throw new Error("occupancyType must be SINGLE or DOUBLE");
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) throw new Error("Invalid date range");

    /* -------- ROOM VALIDATION -------- */
    const room = await Room.findOne({
      _id: roomId,
      guestHouseId,
      status: "ACTIVE",
    }).session(session);

    if (!room) throw new Error("Room not available");

    if (room.type !== occupancyType) {
      throw new Error(
        `Selected room is ${room.type} occupancy, not ${occupancyType}`
      );
    }

    /* -------- GRADE-BASED OCCUPANCY GATE (customer self-requests only) -------- */
    if (authUser.role === "CUSTOMER") {
      const currentUser = await User.findById(authUser._id).session(session);
      const grade = currentUser?.grade
        ? await Grade.findOne({
            code: currentUser.grade,
            isActive: true,
          }).session(session)
        : null;

      // No grade assigned: fall back to Double-only (matches the default a new grade gets)
      const allowedOccupancies = grade ? grade.allowedOccupancies : ["DOUBLE"];

      if (!allowedOccupancies.includes(occupancyType)) {
        throw new Error(
          grade
            ? `Your grade (${grade.code}) is not eligible for ${occupancyType.toLowerCase()} occupancy`
            : `No grade assigned to your account — contact an admin to book ${occupancyType.toLowerCase()} occupancy`
        );
      }
    }

    /* -------- OVERLAP CHECK -------- */
    const overlap = await Booking.findOne(
      {
        roomId: new ObjectId(roomId),
        status: { $in: ["BOOKED", "CHECKED_IN"] },
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn },
      },
      null,
      { session },
    );

    if (overlap) throw new Error("Room already booked");

    /* -------- USER HANDLING -------- */
    let bookingUser = authUser;
    let generatedPassword = null;
    let isNewUser = false;

    if (authUser.role !== "CUSTOMER") {
      if (!email || !guestName) {
        throw new Error("Guest name and email required");
      }

      bookingUser = await User.findOne({ email }).session(session);

      if (!bookingUser) {
        generatedPassword = generatePassword(8);

        bookingUser = await User.create(
          [
            {
              name: guestName,
              email,
              password: generatedPassword,
              role: "CUSTOMER",
              department,
            },
          ],
          { session },
        );

        bookingUser = bookingUser[0];
        isNewUser = true;
      }
    }

    /* -------- CREATE BOOKING -------- */
    const [booking] = await Booking.create(
      [
        {
          guestHouseId,
          roomId,
          userId: bookingUser._id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          requestedOccupancy: occupancyType,
          purpose,
          department,
          status: authUser.role === "CUSTOMER" ? "PENDING" : "BOOKED",
          paymentMode: paymentMode || "COMPANY_SPONSORED",
          createdBy: authUser._id,
          createdByRole: authUser.role,
        },
      ],
      { session },
    );

    if (useTransactions) await session.commitTransaction();
    session.endSession();

    /* -------- SEND EMAIL -------- */
    const populatedBooking = await Booking.findById(booking._id)
      .populate("guestHouseId", "name")
      .populate("roomId", "roomNumber")
      .lean();

    if (isNewUser) {
      // Admin created new user → send credentials + booking confirmed
      await sendMail({
        email: bookingUser.email,
        subject: "Guest House Booking & Login Details",
        html: credentialsAndBookingEmail({
          name: bookingUser.name,
          email: bookingUser.email,
          password: generatedPassword,
          booking: populatedBooking,
        }),
      });
    } else if (authUser.role === "CUSTOMER") {
      // Customer submitted a request → pending approval, send request received
      await sendMail({
        email: bookingUser.email,
        subject: "Booking Request Received",
        html: bookingRequestEmail({
          name: bookingUser.name,
          booking: populatedBooking,
        }),
      });
    } else {
      // Admin booked for existing user → send booking confirmed
      await sendMail({
        email: bookingUser.email,
        subject: "Guest House Booking Confirmed",
        html: bookingOnlyEmail({
          name: bookingUser.name,
          booking: populatedBooking,
        }),
      });
    }

    /* -------- NOTIFY OPS ADDRESS (every booking, any requestor) -------- */
    if (process.env.BOOKING_NOTIFY_EMAIL) {
      await sendMail({
        email: process.env.BOOKING_NOTIFY_EMAIL,
        subject: `New Booking Request — ${bookingUser.name}`,
        html: newBookingNotificationEmail({
          requesterName: bookingUser.name,
          requesterEmail: bookingUser.email,
          requesterRole: authUser.role,
          booking: populatedBooking,
        }),
      });
    }

    return successResponse(populatedBooking, 201);
  } catch (err) {
    if (session) {
      if (useTransactions && session.inTransaction()) await session.abortTransaction();
      session.endSession();
    }
    console.error("[Bookings POST]", err);
    return errorResponse(err.message, 409);
  }
}
