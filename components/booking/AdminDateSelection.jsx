import { DateSelectionCard } from "./DateSelectionCard";

export function AdminDateSelection({
  range,
  onSelect,
  checkInTime,
  checkOutTime,
  onCheckInTimeChange,
  onCheckOutTimeChange,
  onReset,
  onSearchRooms,
  disabledDates,
  isDatesReady,
  checkIn,
  checkOut
}) {
  return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Allocate Room</h1>
          <p className="text-muted-foreground">
            {!checkIn || !checkOut ? "Select dates to check availability" : `Available rooms for ${new Date(checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })} - ${new Date(checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}`}
          </p>
        </div>

        <DateSelectionCard
          range={range}
          onSelect={onSelect}
          checkInTime={checkInTime}
          checkOutTime={checkOutTime}
          onCheckInTimeChange={onCheckInTimeChange}
          onCheckOutTimeChange={onCheckOutTimeChange}
          onReset={onReset}
          onAction={onSearchRooms}
          disabledDates={disabledDates}
          title="Select Dates"
          actionButtonText="Search Rooms"
        />
      </div>
  );
}