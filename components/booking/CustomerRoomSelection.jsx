import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";

export function CustomerRoomSelection({
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
              <div
                key={gh._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg">{gh.name}</h3>
                  <p className="text-sm text-muted-foreground">{gh.location}</p>
                </div>

                {/* Available Rooms Info */}
                <div className="mb-4 p-2 bg-secondary/50 rounded text-sm">
                  <div className="flex justify-between">
                    <span>Available Rooms</span>
                    <span className="font-semibold">
                      {availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id).length}
                    </span>
                  </div>
                </div>

                {/* Rooms List */}
                <div className="space-y-2 max-h-52 overflow-y-auto border rounded p-3 bg-muted/20">
                  {availableRooms.filter((r) => r.guestHouseId?.toString() === gh._id).length > 0 ? (
                    availableRooms
                      .filter((r) => r.guestHouseId?.toString() === gh._id)
                      .map((room) => (
                        <button
                          key={room._id}
                          onClick={() => onRoomSelect(gh._id, room._id)}
                          className="w-full text-left p-2 rounded hover:bg-primary/10 border hover:border-primary transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">Room {room.roomNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {room.capacity} guests
                              </p>
                            </div>
                            <div className="text-primary text-xs font-semibold">Select</div>
                          </div>
                        </button>
                      ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No rooms available
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}