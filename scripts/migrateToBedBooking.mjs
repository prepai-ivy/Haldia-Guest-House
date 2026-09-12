// One-time migration: creates Bed documents for every Room (1..capacity), and backfills
// bedId on every existing Booking. Safe to re-run (skips work already done).
//
// For rooms with capacity > 1 that have a still-live legacy booking (BOOKED/CHECKED_IN),
// the other bed(s) get a synthetic "legacy room hold" booking so the whole room stays
// blocked, matching the old whole-room booking model, until that booking is resolved.
//
// Usage: node scripts/migrateToBedBooking.mjs

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import Room from "../lib/models/Room.model.js";
import Bed from "../lib/models/Bed.model.js";
import Booking from "../lib/models/Booking.model.js";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function ensureBedsForRoom(room) {
  const existingBeds = await Bed.find({ roomId: room._id }).sort({ bedNumber: 1 });
  const existingNumbers = new Set(existingBeds.map((b) => b.bedNumber));
  const created = [];

  for (let n = 1; n <= (room.capacity || 1); n++) {
    if (!existingNumbers.has(n)) {
      const bed = await Bed.create({ roomId: room._id, bedNumber: n });
      created.push(bed);
    }
  }

  const allBeds = await Bed.find({ roomId: room._id }).sort({ bedNumber: 1 });
  return { allBeds, createdCount: created.length };
}

async function main() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set (checked process.env and .env.local)");
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log("[db] Connected via Mongoose.");

  const rooms = await Room.find({});
  console.log(`[rooms] Found ${rooms.length} room(s).`);

  const bedsByRoom = new Map(); // roomId string -> [Bed]
  let totalBedsCreated = 0;

  for (const room of rooms) {
    const { allBeds, createdCount } = await ensureBedsForRoom(room);
    bedsByRoom.set(room._id.toString(), allBeds);
    totalBedsCreated += createdCount;
  }
  console.log(`[beds] Created ${totalBedsCreated} new bed document(s). All rooms now have beds.`);

  const bookingsMissingBed = await Booking.find({
    $or: [{ bedId: { $exists: false } }, { bedId: null }],
  });
  console.log(`[bookings] Found ${bookingsMissingBed.length} booking(s) without a bedId.`);

  const LIVE_STATUSES = ["BOOKED", "CHECKED_IN"];
  let backfilled = 0;
  let syntheticHolds = 0;
  let skippedNoBeds = 0;

  for (const booking of bookingsMissingBed) {
    const beds = bedsByRoom.get(booking.roomId?.toString());
    if (!beds || beds.length === 0) {
      console.warn(`[warn] Booking ${booking._id} has no beds for room ${booking.roomId} — skipped.`);
      skippedNoBeds++;
      continue;
    }

    const primaryBed = beds[0];
    booking.bedId = primaryBed._id;
    await booking.save({ validateModifiedOnly: true });
    backfilled++;

    if (beds.length > 1 && LIVE_STATUSES.includes(booking.status)) {
      for (const otherBed of beds.slice(1)) {
        const alreadyHeld = await Booking.findOne({
          bedId: otherBed._id,
          status: { $in: LIVE_STATUSES },
          checkInDate: { $lt: booking.checkOutDate },
          checkOutDate: { $gt: booking.checkInDate },
        });
        if (alreadyHeld) continue; // already covered (e.g. re-run, or a real bed-level booking exists)

        await Booking.create({
          guestHouseId: booking.guestHouseId,
          roomId: booking.roomId,
          bedId: otherBed._id,
          userId: booking.userId,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          requestedOccupancy: booking.requestedOccupancy,
          purpose: booking.purpose,
          department: booking.department,
          paymentMode: booking.paymentMode,
          status: booking.status,
          createdBy: booking.createdBy,
          createdByRole: booking.createdByRole,
          isLegacyRoomHold: true,
        });
        syntheticHolds++;
      }
    }
  }

  console.log(`[bookings] Backfilled bedId on ${backfilled} booking(s).`);
  console.log(`[bookings] Created ${syntheticHolds} synthetic legacy-room-hold booking(s) to preserve whole-room exclusivity.`);
  if (skippedNoBeds > 0) {
    console.warn(`[bookings] Skipped ${skippedNoBeds} booking(s) whose room had no beds (orphaned roomId?).`);
  }

  await mongoose.disconnect();
  console.log("[db] Disconnected. Migration complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrateToBedBooking] Failed:", err);
    process.exit(1);
  });
