import DashboardLayout from "@/components/layout/DashboardLayout";
import { DateSelectionCard } from "./DateSelectionCard";

export function CustomerDateSelection({
  range,
  onSelect,
  checkInTime,
  checkOutTime,
  onCheckInTimeChange,
  onCheckOutTimeChange,
  onReset,
  onViewRooms,
  disabledDates,
  isDatesReady
}) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Book a Room</h1>
          <p className="text-muted-foreground">Select dates to check availability</p>
        </div>

        <DateSelectionCard
          range={range}
          onSelect={onSelect}
          checkInTime={checkInTime}
          checkOutTime={checkOutTime}
          onCheckInTimeChange={onCheckInTimeChange}
          onCheckOutTimeChange={onCheckOutTimeChange}
          onReset={onReset}
          onAction={onViewRooms}
          disabledDates={disabledDates}
          title="Select Dates"
          actionButtonText="View Rooms"
        />
      </div>
    </DashboardLayout>
  );
}