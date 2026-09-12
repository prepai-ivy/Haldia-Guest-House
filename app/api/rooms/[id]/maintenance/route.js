import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getAuthUser } from "@/lib/auth";
import Room from "@/lib/models/Room.model";
import RoomMaintenance from "@/lib/models/RoomMaintainence.modal";
import Booking from "@/lib/models/Booking.model";
import "@/lib/models/GuestHouse.model"; // register schema for populate
import "@/lib/models/Bed.model";        // register schema for populate
import mongoose from "mongoose";

/* -------------------- GET: list maintenance windows for a room -------------------- */
export async function GET(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse("Unauthorized", 401);

    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid room id", 400);
    }

    const windows = await RoomMaintenance.find({ roomId: id })
      .sort({ startDate: -1 })
      .lean();

    return successResponse(windows);
  } catch (error) {
    console.error("[Room Maintenance GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

/* -------------------- POST: schedule a maintenance window -------------------- */
export async function POST(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || !["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return errorResponse("Forbidden", 403);
    }

    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid room id", 400);
    }

    const room = await Room.findOne({ _id: id, isActive: true });
    if (!room) return errorResponse("Room not found", 404);

    const body = await request.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return errorResponse("startDate and endDate are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return errorResponse("Invalid date range", 400);
    }

    /* -------- CONFLICT CHECK --------
       PENDING and BOOKED reservations block scheduling — a CHECKED_IN guest doesn't need
       to be displaced, maintenance can be scheduled around them without any action. */
    const conflicts = await Booking.find({
      roomId: id,
      status: { $in: ["PENDING", "BOOKED"] },
      checkInDate: { $lt: end },
      checkOutDate: { $gt: start },
    })
      .populate("guestHouseId", "name")
      .populate("roomId", "roomNumber type")
      .populate("bedId", "bedNumber")
      .populate("userId", "name email department")
      .lean();

    if (conflicts.length > 0) {
      return successResponse({ created: false, conflicts }, 200);
    }

    const maintenance = await RoomMaintenance.create({
      roomId: id,
      startDate: start,
      endDate: end,
      reason,
      createdBy: authUser._id,
    });

    return successResponse({ created: true, maintenance }, 201);
  } catch (error) {
    console.error("[Room Maintenance POST]", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
