import mongoose from "mongoose";

// One document per (bed, night) a booking occupies. A plain "read who's occupied, then
// insert a Booking" check has nothing stopping two near-simultaneous requests from both
// reading "free" and both committing — they write different Booking documents, so
// MongoDB's per-document conflict detection never fires between them. Requiring every
// booking to also claim one uniquely-indexed hold row per night it covers gives concurrent
// requests for the same bed/date something that MUST collide: the second insert fails with
// a duplicate-key error, so only one of the two can ever win. See lib/bedHolds.js.
const BedNightHoldSchema = new mongoose.Schema({
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bed",
    required: true,
  },
  date: { type: String, required: true }, // calendar day this hold covers, "YYYY-MM-DD"
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    index: true,
  },
  // Safety net only (normal lifecycle is explicit claim/release alongside the booking's
  // own state changes) — self-cleans a hold left behind by a crash mid-request.
  expiresAt: { type: Date, required: true },
});

BedNightHoldSchema.index({ bedId: 1, date: 1 }, { unique: true });
BedNightHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BedNightHold ||
  mongoose.model("BedNightHold", BedNightHoldSchema);
