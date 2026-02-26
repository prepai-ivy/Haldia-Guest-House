export function createBookingSchema(data) {
  return {
    _id: data._id,
    guestName: data.guestName,
    email: data.email,
    department: data.department,
    guestHouseId: data.guestHouseId,
    roomId: data.roomId,
    roomNumber: data.roomNumber,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    occupancyType: data.occupancyType || 'single',
    purpose: data.purpose || '',
    status: data.status || 'pending',
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || null,
  }
}
