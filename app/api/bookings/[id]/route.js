import { connectToDatabase, useTransactions } from "@/lib/mongodb";
import Booking from "@/lib/models/Booking.model";
import User from "@/lib/models/User.model";
import Bed from "@/lib/models/Bed.model";
import RoomMaintenance from "@/lib/models/RoomMaintainence.modal";
import { successResponse, errorResponse } from "@/lib/api-utils";
import mongoose from "mongoose";
import { getAuthUser } from "@/lib/auth";
import { claimBedNights, releaseBedNights } from "@/lib/bedHolds";
import "@/lib/models/GuestHouse.model"; // register schema for populate
import Room from "@/lib/models/Room.model";
import sendMail from "@/lib/mail";
import { bookingOnlyEmail, maintenanceImpactEmail } from "@/lib/emailTemplates";

// Lets any validation failure inside the transactional section below abort the transaction
// and still map to the right HTTP status/message, instead of every check needing its own
// inline session-cleanup before returning.
class ApiRouteError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function PATCH(request, { params }) {
  let session = null;

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
    const { status: action, reason, maintenanceReason, ...editFields } = body;

    session = await mongoose.startSession();
    if (useTransactions) session.startTransaction();

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      throw new ApiRouteError("Booking not found", 404);
    }

    /* ---------- EDIT MODE (no action provided) ---------- */
    if (!action) {
      if (!["PENDING", "BOOKED"].includes(booking.status)) {
        throw new ApiRouteError("Only PENDING or BOOKED bookings can be edited", 400);
      }

      const { guestName, department, purpose, paymentMode, checkInDate, checkOutDate, roomId, bedId, guestHouseId } = editFields;

      const nextPaymentMode = paymentMode !== undefined ? paymentMode : booking.paymentMode;
      if (nextPaymentMode === "COMPANY_SPONSORED" && !booking.attachmentBlobPath) {
        throw new ApiRouteError(
          "Company-sponsored bookings require a supporting document attachment",
          400,
        );
      }

      const nextCheckIn = checkInDate ? new Date(checkInDate) : booking.checkInDate;
      const nextCheckOut = checkOutDate ? new Date(checkOutDate) : booking.checkOutDate;
      if (checkInDate && checkOutDate && nextCheckIn >= nextCheckOut) {
        throw new ApiRouteError("Invalid date range", 400);
      }

      const nextRoomId = roomId ? new mongoose.Types.ObjectId(roomId) : booking.roomId;
      const roomChanging = roomId && roomId !== booking.roomId.toString();
      const datesChanging = !!(checkInDate && checkOutDate);
      // booking.bedId can be null on a legacy booking that predates bed-level booking
      // (created before this feature shipped, or before the migration backfilled it).
      const currentBedIdStr = booking.bedId ? booking.bedId.toString() : null;
      let nextBedId = booking.bedId;
      let bedResolved = false;
      let holdsNeedRefresh = false;
      let occupancyChanged = null; // { from, to } — set if a room reassignment changes occupancy type

      // Bed/room/date changes all affect which bed this booking occupies — re-check availability
      // whenever any of them change (fixes: previously this only ran on a date change, so
      // reassigning just the room/bed — the override workflow — skipped the check entirely).
      if (roomChanging || datesChanging || bedId) {
        holdsNeedRefresh = true;

        // Also check maintenance — booking creation already blocks this, edit previously didn't,
        // so an admin could reassign a booking straight into a room under scheduled maintenance.
        const maintenanceConflict = await RoomMaintenance.findOne({
          roomId: nextRoomId,
          status: "ACTIVE",
          startDate: { $lt: nextCheckOut },
          endDate: { $gt: nextCheckIn },
        }).session(session);
        if (maintenanceConflict) {
          throw new ApiRouteError("Room is under maintenance during the selected dates", 409);
        }

        // A room reassignment can land a booking in a room of a different type — e.g. moving
        // a DOUBLE-occupancy guest into a SINGLE room because that's all that's free during
        // maintenance. That's allowed (an admin may have no other choice), but it's flagged
        // rather than silent: requestedOccupancy is deliberately left as the original request
        // (not overwritten) so the existing "Overridden" badge/approval-confirmation on
        // BookingCard — already used for grade-override bookings — picks it up here too, and
        // the reassignment email below calls it out explicitly.
        if (roomChanging) {
          const targetRoom = await Room.findById(nextRoomId).session(session);
          if (!targetRoom) throw new ApiRouteError("Target room not found", 404);
          if (booking.requestedOccupancy && targetRoom.type !== booking.requestedOccupancy) {
            occupancyChanged = { from: booking.requestedOccupancy, to: targetRoom.type };
          }
        }

        const beds = await Bed.find({ roomId: nextRoomId, isActive: true }).sort({ bedNumber: 1 }).session(session);
        if (beds.length === 0) throw new ApiRouteError("Room has no beds configured", 400);

        const occupiedBedIds = await Booking.distinct("bedId", {
          _id: { $ne: booking._id },
          roomId: nextRoomId,
          status: { $in: ["PENDING", "BOOKED", "CHECKED_IN"] },
          checkInDate: { $lt: nextCheckOut },
          checkOutDate: { $gt: nextCheckIn },
        }).session(session);
        const occupiedSet = new Set(occupiedBedIds.filter(Boolean).map((bId) => bId.toString()));

        if (bedId) {
          const bed = beds.find((b) => b._id.toString() === bedId);
          if (!bed) throw new ApiRouteError("Selected bed not found in that room", 400);
          if (occupiedSet.has(bed._id.toString())) {
            throw new ApiRouteError("That bed is already booked for those dates", 409);
          }
          nextBedId = bed._id;
          bedResolved = true;
        } else if (roomChanging || !currentBedIdStr) {
          // Room changed, or this legacy booking has no bed yet — assign a free one.
          const free = beds.find((b) => !occupiedSet.has(b._id.toString()));
          if (!free) throw new ApiRouteError("No free bed available in that room for those dates", 409);
          nextBedId = free._id;
          bedResolved = true;
        } else if (occupiedSet.has(currentBedIdStr)) {
          throw new ApiRouteError("This bed is already booked for those dates", 409);
        }
      }

      if (datesChanging) {
        booking.checkInDate = nextCheckIn;
        booking.checkOutDate = nextCheckOut;
      }
      if (roomId) booking.roomId = nextRoomId;
      if (bedResolved) booking.bedId = nextBedId;
      if (department !== undefined) booking.department = department;
      if (purpose !== undefined) booking.purpose = purpose;
      if (paymentMode !== undefined) booking.paymentMode = paymentMode;
      if (guestHouseId) booking.guestHouseId = new mongoose.Types.ObjectId(guestHouseId);

      if (guestName) {
        await User.findByIdAndUpdate(booking.userId, { name: guestName }, { session });
      }

      await booking.save({ session, validateModifiedOnly: true });

      // Bed/dates may have changed — the DB-enforced guard against a concurrent conflicting
      // claim (see lib/bedHolds.js) needs to match whatever this booking now actually holds.
      if (holdsNeedRefresh && booking.bedId) {
        await releaseBedNights(booking._id, session);
        await claimBedNights(booking.bedId, booking.checkInDate, booking.checkOutDate, booking._id, session);
      }

      if (useTransactions) await session.commitTransaction();
      session.endSession();
      session = null;

      const updated = await Booking.findById(id)
        .populate("guestHouseId", "name location category")
        .populate("roomId", "roomNumber type")
        .populate("bedId", "bedNumber")
        .populate("userId", "name email department");

      if (reason === "MAINTENANCE" && (roomChanging || bedId)) {
        try {
          const bookingUser = await User.findById(updated.userId);
          if (bookingUser) {
            await sendMail({
              email: bookingUser.email,
              subject: "Your Booking Has Been Reassigned",
              html: maintenanceImpactEmail({
                name: bookingUser.name,
                action: "REASSIGNED",
                booking: updated,
                maintenanceReason,
                occupancyChanged,
              }),
            });
          }
        } catch (mailErr) {
          console.error("[MAINTENANCE reassign email error]", mailErr);
        }
      }

      return successResponse(updated);
    }

    /* ---------- ACTION MODE (state machine) ---------- */
    const allowedActions = ["APPROVE", "REJECT", "CHECK_IN", "CHECK_OUT", "CANCEL"];
    if (!allowedActions.includes(action)) {
      throw new ApiRouteError("Invalid action", 400);
    }

    const now = new Date();

    if (action === "APPROVE") {
      if (booking.status !== "PENDING") {
        throw new ApiRouteError("Only pending bookings can be approved", 400);
      }

      // Defensive re-check: the bed this booking holds should already be exclusively
      // its own (PENDING blocks other requests from taking the same bed, and the
      // BedNightHold claimed at creation time is the actual DB-enforced guard), but
      // verify before committing rather than silently approving into a double-booking.
      if (booking.bedId) {
        const bedConflict = await Booking.findOne({
          _id: { $ne: booking._id },
          bedId: booking.bedId,
          status: { $in: ["BOOKED", "CHECKED_IN"] },
          checkInDate: { $lt: booking.checkOutDate },
          checkOutDate: { $gt: booking.checkInDate },
        }).session(session);
        if (bedConflict) {
          throw new ApiRouteError(
            "This bed was already booked for these dates by another approved booking — reassign this request to a different room/bed before approving",
            409,
          );
        }
      }

      booking.status = "BOOKED";
    }

    if (action === "REJECT") {
      if (booking.status !== "PENDING") {
        throw new ApiRouteError("Only pending bookings can be rejected", 400);
      }
      booking.status = "REJECTED";
    }

    if (action === "CHECK_IN") {
      if (booking.status !== "BOOKED") {
        throw new ApiRouteError("Only BOOKED bookings can be checked in", 400);
      }
      booking.status = "CHECKED_IN";
      booking.actualCheckIn = now;
    }

    if (action === "CHECK_OUT") {
      if (booking.status !== "CHECKED_IN") {
        throw new ApiRouteError("Only CHECKED_IN bookings can be checked out", 400);
      }
      booking.status = "CHECKED_OUT";
      booking.actualCheckOut = now;
    }

    if (action === "CANCEL") {
      if (booking.status !== "BOOKED") {
        throw new ApiRouteError("Only BOOKED bookings can be cancelled", 400);
      }
      booking.status = "CANCELLED";
    }

    // validateModifiedOnly: this only touches status/actualCheckIn/actualCheckOut — a legacy
    // booking missing a field added after it was created (e.g. bedId, requestedOccupancy)
    // must still be approvable/cancellable/etc. without tripping unrelated validation.
    await booking.save({ session, validateModifiedOnly: true });

    // These transitions free up the bed — release its holds so someone else can claim it.
    if (["REJECT", "CANCEL", "CHECK_OUT"].includes(action)) {
      await releaseBedNights(booking._id, session);
    }

    if (useTransactions) await session.commitTransaction();
    session.endSession();
    session = null;

    const updated = await Booking.findById(id)
      .populate("guestHouseId", "name location category")
      .populate("roomId", "roomNumber type")
      .populate("bedId", "bedNumber")
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

    // Send maintenance-impact email when this cancel/reject was triggered by scheduled
    // maintenance (CANCEL for a BOOKED conflict, REJECT for a still-PENDING one) — these
    // get distinct wording/subject since a REJECT means the request never existed as a
    // confirmed booking in the first place.
    if ((action === "CANCEL" || action === "REJECT") && reason === "MAINTENANCE") {
      try {
        const bookingUser = await User.findById(booking.userId);
        if (bookingUser) {
          const impactAction = action === "REJECT" ? "REJECTED" : "CANCELLED";
          await sendMail({
            email: bookingUser.email,
            subject: impactAction === "REJECTED"
              ? "Your Booking Request Has Been Rejected"
              : "Your Booking Has Been Cancelled",
            html: maintenanceImpactEmail({
              name: bookingUser.name,
              action: impactAction,
              booking: updated,
              maintenanceReason,
            }),
          });
        }
      } catch (mailErr) {
        console.error("[MAINTENANCE cancel/reject email error]", mailErr);
      }
    }

    return successResponse(updated);
  } catch (err) {
    if (session) {
      if (useTransactions && session.inTransaction()) await session.abortTransaction();
      session.endSession();
    }

    if (err.statusCode) {
      return errorResponse(err.message, err.statusCode);
    }

    console.error("[BOOKING PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}
