import mongoose from 'mongoose';

const GradeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    allowedOccupancies: {
      type: [String],
      enum: ['SINGLE', 'DOUBLE'],
      default: ['DOUBLE'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one occupancy type must be allowed',
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
