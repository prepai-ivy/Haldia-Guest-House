import mongoose from "mongoose";

const BedSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    bedNumber: {
      type: Number,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

BedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });

export default mongoose.models.Bed || mongoose.model("Bed", BedSchema);
