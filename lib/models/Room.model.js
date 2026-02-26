import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    guestHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GuestHouse',
      required: true,
      index: true,
    },

    roomNumber: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["SINGLE", "DOUBLE"],
      required: true,
    },

    capacity: {
      type: Number,
      default: 1,
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "MAINTENANCE"],
      default: "ACTIVE",
      index: true,
    },

    amenities: {
      type: [String],
      default: [],
    },

    floor: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * Compound Unique Index
 * Same roomNumber CAN exist in different guest houses
 * But CANNOT exist twice in the same guest house
 */
RoomSchema.index(
  { guestHouseId: 1, roomNumber: 1 },
  { unique: true }
);

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
