// Despite the name, this deliberately does NOT convert to IST — it only ever receives
// Date objects straight out of the Calendar date-picker (see grep: both call sites pass
// `selectedRange.from`/`.to`), which react-day-picker constructs as local midnight on
// whatever day the user clicked, in the browser's own local timezone. Reading it back with
// local getters correctly recovers that same clicked day regardless of what timezone the
// browser is in. Actually shifting by +5:30 here (like the server-side IST-boundary helpers
// do for real UTC timestamps) would be wrong for this input shape — it would double-apply
// an offset and could push the date across a day boundary. Keep this simple unless a call
// site starts passing a genuine UTC timestamp instead of a calendar-picker Date.
export function formatDateIST(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
