'use client';

export default function AdminGuestHouseCard({
  guestHouse,
  checkIn,
  checkOut,
  availableRooms,
  onRoomSelect,
}) {
  const available = guestHouse.totalRooms - guestHouse.bookedRooms;
  const availableCount = checkIn && checkOut ? availableRooms.length : available;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-lg">{guestHouse.name}</h3>
        <p className="text-sm text-muted-foreground">{guestHouse.location}</p>
      </div>

      {/* Available Rooms Info */}
      <div className="mb-4 p-2 bg-secondary/50 rounded text-sm">
        <div className="flex justify-between">
          <span>Available Rooms</span>
          <span className="font-semibold">{availableCount}</span>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-y-2 max-h-52 overflow-y-auto border rounded p-3 bg-muted/20">
        {availableRooms.length > 0 ? (
          availableRooms.map((room) => (
            <button
              key={room._id}
              onClick={() => onRoomSelect(guestHouse._id, room._id)}
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
            No rooms available for selected dates
          </p>
        )}
      </div>
    </div>
  );
}
