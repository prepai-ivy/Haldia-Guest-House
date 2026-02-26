import mongoose from 'mongoose';

const GuestHouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: String,
    category: {
      type: String,
      enum: ['STANDARD', 'EXECUTIVE', 'PREMIUM']
    },
    address: String,
    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.models.GuestHouse ||
  mongoose.model('GuestHouse', GuestHouseSchema);
