export function createRoomSchema(data) {
  return {
    _id: data._id,
    guestHouseId: data.guestHouseId,
    roomNumber: data.roomNumber,
    type: data.type, // Single | Double
    capacity: data.capacity || 1,
    status: data.status || 'available', // available | occupied | maintenance
    amenities: data.amenities || [],
    floor: data.floor || 1,
    createdAt: data.createdAt || new Date(),
  }
}
