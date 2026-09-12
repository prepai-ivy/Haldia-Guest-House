// models/RoomMaintenance.js
import mongoose from "mongoose"

const maintenanceSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    reason: String,

    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
)

maintenanceSchema.pre("validate", function () {
  if (this.endDate <= this.startDate) {
    throw new Error("endDate must be after startDate");
  }
});

maintenanceSchema.index({
  roomId: 1,
  startDate: 1,
  endDate: 1,
})

export default mongoose.models.RoomMaintenance ||
  mongoose.model("RoomMaintenance", maintenanceSchema)
