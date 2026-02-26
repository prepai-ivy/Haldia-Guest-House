export function createGuestHouseSchema(data) {
  const totalRooms = data.totalRooms || 0
  const occupied = data.occupied || 0
  const available = data.available ?? Math.max(totalRooms - occupied, 0)

  return {
    _id: data._id,
    name: data.name,
    location: data.location,
    category: data.category, // Standard | Executive | Premium
    totalRooms,
    capacity: data.capacity || 0,
    occupied,
    available,
    underMaintenance: data.underMaintenance || 0,
    utilization:
      totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
    createdAt: data.createdAt || new Date(),
  }
}
