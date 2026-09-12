import { connectToDatabase } from '@/lib/mongodb'
import Room from '@/lib/models/Room.model'
import Bed from '@/lib/models/Bed.model'
import Booking from '@/lib/models/Booking.model'
import RoomMaintenance from '@/lib/models/RoomMaintainence.modal'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { getAuthUser } from '@/lib/auth'
import { getISTDayBoundsUTC } from '@/lib/istDate'

export async function GET(request) {
  try {
    await connectToDatabase()

    const authUser = getAuthUser(request)
    if (!authUser) return errorResponse('Unauthorized', 401)

    /* ---------- IST DAY BOUNDARY ---------- */
    const { startUTC, endUTC } = getISTDayBoundsUTC()

    /* ---------- FETCH DATA ---------- */

    const rooms = await Room.find({ isActive: true }).lean()
    const roomIds = rooms.map(r => r._id)

    const bookingsToday = await Booking.find({
      roomId: { $in: roomIds },
      $or: [
        { status: 'CHECKED_IN' },
        {
          status: 'BOOKED',
          checkInDate: { $lt: endUTC },
          checkOutDate: { $gt: startUTC },
        },
      ],
    }).lean()

    const totalBedsAgg = await Bed.aggregate([
      { $match: { roomId: { $in: roomIds }, isActive: true } },
      { $group: { _id: '$roomId', total: { $sum: 1 } } },
    ])
    const totalBedsMap = {}
    totalBedsAgg.forEach(r => { totalBedsMap[r._id.toString()] = r.total })

    const occupiedBedsMap = {} // roomId -> Set(bedId)
    bookingsToday.forEach(b => {
      if (!b.bedId) return // legacy booking predating bed-level booking — not attributable to a bed
      const rid = b.roomId.toString()
      if (!occupiedBedsMap[rid]) occupiedBedsMap[rid] = new Set()
      occupiedBedsMap[rid].add(b.bedId.toString())
    })

    const maintenanceRoomIds = await RoomMaintenance.distinct('roomId', {
      roomId: { $in: roomIds },
      status: 'ACTIVE',
      startDate: { $lt: endUTC },
      endDate: { $gt: startUTC },
    })
    const maintenanceSet = new Set(maintenanceRoomIds.map(id => id.toString()))

    const totalRooms = rooms.length

    // A room counts as "occupied" once every one of its beds is taken today;
    // maintenance takes precedence over occupancy in the bucket a room falls into.
    let underMaintenance = 0
    let occupiedToday = 0
    rooms.forEach(r => {
      const idStr = r._id.toString()
      if (maintenanceSet.has(idStr)) {
        underMaintenance++
        return
      }
      const total = totalBedsMap[idStr] || 0
      const occupiedBeds = occupiedBedsMap[idStr]?.size || 0
      if (total > 0 && occupiedBeds >= total) occupiedToday++
    })

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
