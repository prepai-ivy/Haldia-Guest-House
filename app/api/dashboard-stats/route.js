import { connectToDatabase } from '@/lib/mongodb'
import Room from '@/lib/models/Room.model'
import Booking from '@/lib/models/Booking.model'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { getAuthUser } from '@/lib/auth'

export async function GET(request) {
  try {
    await connectToDatabase()

    const authUser = getAuthUser(request)
    if (!authUser) return errorResponse('Unauthorized', 401)

    /* ---------- IST DAY BOUNDARY ---------- */

    const now = new Date()
    const IST_OFFSET = 5.5 * 60 * 60 * 1000

    const nowIST = new Date(now.getTime() + IST_OFFSET)

    const startOfTodayIST = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate()
    )

    const endOfTodayIST = new Date(
      nowIST.getFullYear(),
      nowIST.getMonth(),
      nowIST.getDate() + 1
    )

    const startUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET)
    const endUTC = new Date(endOfTodayIST.getTime() - IST_OFFSET)

    /* ---------- FETCH DATA ---------- */

    const rooms = await Room.find({ isActive: true }).lean()

    const bookingsToday = await Booking.find({
      $or: [
        { status: 'CHECKED_IN' },
        {
          status: 'BOOKED',
          checkInDate: { $lt: endUTC },
          checkOutDate: { $gt: startUTC },
        },
      ],
    }).lean()
    console.log('Bookings Today:', bookingsToday.length)

    const occupiedRoomIds = new Set(
      bookingsToday.map(b => b.roomId.toString())
    )

    const totalRooms = rooms.length

    console.log('Total Rooms:', totalRooms)

    const underMaintenance = rooms.filter(
      r => r.status === 'MAINTENANCE'
    ).length

    const occupiedToday = occupiedRoomIds.size

    const availableToday =
      totalRooms - occupiedToday - underMaintenance

    /* ---------- CUSTOMER VIEW ---------- */

    if (authUser.role === 'CUSTOMER') {
      const myBookingsCount = await Booking.countDocuments({
        userId: authUser._id,
      })

      return successResponse({
        totalRooms,
        occupiedToday,
        availableToday: Math.max(availableToday, 0),
        myBookings: myBookingsCount,
      })
    }

    /* ---------- ADMIN / SUPER_ADMIN VIEW ---------- */

    return successResponse({
      totalRooms,
      occupiedToday,
      availableToday: Math.max(availableToday, 0),
      underMaintenance,
      todayActiveBookings: bookingsToday.length,
    })

  } catch (err) {
    console.error('[Dashboard Stats]', err)
    return errorResponse('Internal server error', 500)
  }
}
