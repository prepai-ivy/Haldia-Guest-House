import BedNightHold from "@/lib/models/BedNightHold.model";

// Discretizes [checkIn, checkOut) into one key per calendar day (UTC date components —
// bookings in this app are day-granularity, so this is stable regardless of exact
// time-of-day on the stored Date). Two bookings whose date ranges overlap always share
// at least one of these keys.
export function getNightKeys(checkIn, checkOut) {
  const keys = [];
  const cursor = new Date(
    Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate()),
  );
  while (cursor < end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

// Throws (with statusCode 409) if any night is already held by another booking — callers
// running inside a transaction should let this abort the transaction.
export async function claimBedNights(bedId, checkIn, checkOut, bookingId, session) {
  const nightKeys = getNightKeys(checkIn, checkOut);
  if (nightKeys.length === 0) return;

  const expiresAt = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);

  try {
    await BedNightHold.insertMany(
      nightKeys.map((date) => ({ bedId, date, bookingId, expiresAt })),
      { session, ordered: true },
    );
  } catch (e) {
    if (e.code === 11000) {
      const conflictErr = new Error(
        "This bed was just booked by another request for the selected dates — please choose a different bed or dates",
      );
      conflictErr.statusCode = 409;
      throw conflictErr;
    }
    throw e;
  }
}

export async function releaseBedNights(bookingId, session) {
  await BedNightHold.deleteMany({ bookingId }, session ? { session } : {});
}
