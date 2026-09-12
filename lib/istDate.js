// Shared "start/end of today in IST, as UTC instants" helper — used by every stats
// endpoint (and a couple of client pages) that needs to bucket bookings into "today".
//
// The IST_OFFSET-arithmetic version duplicated across those files only produces correct
// boundaries when the runtime's local timezone happens to be UTC (true on most cloud
// hosts, but not guaranteed — e.g. local dev with TZ=Asia/Kolkata would double-apply the
// offset). Using Intl.DateTimeFormat with an explicit IANA zone sidesteps that: it reads
// today's IST calendar date correctly regardless of what timezone the process itself is
// running in. Works in both Node and the browser — Intl is available in both.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getISTDayBoundsUTC(referenceDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);

  // Midnight IST for that calendar day, expressed as the equivalent UTC instant.
  const startUTC = new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

  return { startUTC, endUTC };
}
