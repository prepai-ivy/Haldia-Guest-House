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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },

    purpose: String,
    department: String,

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

BookingSchema.pre("validate", function () {
  if (this.checkOutDate <= this.checkInDate) {
    throw new Error("checkOutDate must be after checkInDate");
  }
});

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
