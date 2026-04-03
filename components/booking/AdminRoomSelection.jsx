import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminGuestHouseCard from "@/components/cards/AdminGuestHouseCard";

export function AdminRoomSelection({
  availableGuestHouses,
  availableRooms,
  loadingRooms,
  checkIn,
  checkOut,
  onChangeDates,
  onRoomSelect
}) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Available Rooms</h1>
            <p className="text-muted-foreground">
              {new Date(checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - {new Date(checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onChangeDates}
            className="flex items-center gap-2"
          >
            <CalendarDays size={16} />
            Change Date
          </Button>
        </div>

        {loadingRooms && (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mx-auto mb-2" />
            Checking availability…
          </div>
        )}

        {!loadingRooms && availableGuestHouses.length === 0 && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-sm text-destructive">
            No guest houses have available rooms for the selected dates. Please choose different dates.
          </div>
        )}

        {!loadingRooms && availableGuestHouses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableGuestHouses.map((gh) => (
              <AdminGuestHouseCard
                key={gh._id}
                guestHouse={gh}
                checkIn={checkIn}
                checkOut={checkOut}
                availableRooms={availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id)}
                onRoomSelect={onRoomSelect}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}