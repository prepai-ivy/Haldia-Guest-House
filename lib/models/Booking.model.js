import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    guestHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuestHouse",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    // NOT required at the schema level on purpose: this field was added after bookings
    // already existed in production. Every booking created through POST /api/bookings
    // always sets it — the app enforces it there — but leaving it optional here means a
    // legacy document that predates this field (or predates the migration backfilling it)
    // never fails validation on an unrelated .save() (approve/reject/check-in/out/cancel).
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },
    // Set only by the one-time bed-booking migration, on synthetic records created to
    // preserve whole-room exclusivity for legacy bookings that predate bed-level booking.
    isLegacyRoomHold: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },

    // Same reasoning as bedId above: not schema-required, so bookings that predate this
    // field can still be saved (approved, cancelled, etc.) without a validation error.
    // POST /api/bookings always sets it for anything created going forward.
    requestedOccupancy: {
      type: String,
      enum: ["SINGLE", "DOUBLE"],
      default: null,
    },

    purpose: String,
    department: String,

    paymentMode: {
      type: String,
      enum: ["SELF_PAY", "SALARY_DEDUCTION", "COMPANY_SPONSORED"],
      default: "COMPANY_SPONSORED",
    },

    attachmentBlobPath: { type: String, default: null },
    attachmentFileName: { type: String, default: null },

    actualCheckIn: {
      type: Date,
      default: null,
      index: true,
    },

    actualCheckOut: {
      type: Date,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "REJECTED",
        "BOOKED",
        "CHECKED_IN",
        "CHECKED_OUT",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByRole: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "CUSTOMER"],
      required: true,
    },
  },
  { timestamps: true },
);

BookingSchema.index({
  roomId: 1,
  checkInDate: 1,
  checkOutDate: 1,
  status: 1,
});

BookingSchema.index({
  bedId: 1,
  checkInDate: 1,
  checkOutDate: 1,
  status: 1,
});

BookingSchema.pre("validate", function () {
  if (this.checkOutDate <= this.checkInDate) {
    throw new Error("checkOutDate must be after checkInDate");
  }
});

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
