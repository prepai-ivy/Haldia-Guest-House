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
  },
  { timestamps: true }
)

maintenanceSchema.index({
  roomId: 1,
  startDate: 1,
  endDate: 1,
})

export default mongoose.models.RoomMaintenance ||
  mongoose.model("RoomMaintenance", maintenanceSchema)
