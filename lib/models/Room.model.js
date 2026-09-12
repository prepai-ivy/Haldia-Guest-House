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
 * But CANNOT exist twice among ACTIVE rooms in the same guest house — the partial filter
 * means a soft-deleted (isActive:false) room no longer permanently blocks that room number
 * from being recreated. NOTE: an index already exists in production without this partial
 * filter — changing this field alone does not rebuild it there; run
 * scripts/fixRoomNumberIndex.mjs once to drop and recreate it safely.
 */
RoomSchema.index(
  { guestHouseId: 1, roomNumber: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
