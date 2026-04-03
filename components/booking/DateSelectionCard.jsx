import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";

export function DateSelectionCard({
  range,
  onSelect,
  checkInTime,
  checkOutTime,
  onCheckInTimeChange,
  onCheckOutTimeChange,
  onReset,
  disabledDates,
  title = "Select Dates",
  description,
  actionButtonText = "Continue",
  onAction,
  showTimes = true,
  showActionButton = true
}) {
  const isDatesReady = !!(range.from && range.to);

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={18} />
        <h2 className="font-semibold">{title}</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {description || (
          <>
            {!range.from && "Select your check-in date"}
            {range.from && !range.to && "Now select your check-out date"}
            {range.from && range.to && "Dates selected — proceed to next step"}
          </>
        )}
      </p>

      <div className="bg-muted/30 p-4 rounded-lg border mb-4">
        <Calendar
          mode="range"
          selected={range}
          onSelect={onSelect}
          disabled={disabledDates}
          modifiers={{ today: new Date(), checkin: range.from }}
          modifiersClassNames={{
            today: "bg-primary/30 text-black font-semibold",
            checkin: "bg-primary text-white font-bold",
          }}
          className="rounded-md"
        />
      </div>

      {isDatesReady && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium">Check-in</p>
              <p className="text-sm font-semibold">
                {new Date(range.from).toLocaleDateString("en-IN", {
                  weekday: "short", month: "short", day: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium">Check-out</p>
              <p className="text-sm font-semibold">
                {new Date(range.to).toLocaleDateString("en-IN", {
                  weekday: "short", month: "short", day: "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
          </div>

          {showTimes && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => onCheckInTimeChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => onCheckOutTimeChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="flex-1"
            >
              Reset
            </Button>
            {showActionButton && (
              <Button
                type="button"
                onClick={onAction}
                className="flex-1"
              >
                {actionButtonText}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}