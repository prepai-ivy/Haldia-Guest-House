import { connectToDatabase } from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-utils';
import GuestHouse from '@/lib/models/GuestHouse.model';
import Room from '@/lib/models/Room.model';
import Booking from '@/lib/models/Booking.model';

export async function GET() {
  try {
    await connectToDatabase();

    /* ---------------- IST DAY BOUNDARY ---------------- */
    const now = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + IST_OFFSET);
    const startOfTodayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
    const endOfTodayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate() + 1);
    const startUTC = new Date(startOfTodayIST.getTime() - IST_OFFSET);
    const endUTC = new Date(endOfTodayIST.getTime() - IST_OFFSET);

    /* ---------------- FETCH GUEST HOUSES ---------------- */
    const guestHouses = await GuestHouse.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const guestHouseIds = guestHouses.map((g) => g._id);

    /* ---------------- ROOMS COUNT ---------------- */
    const roomsAgg = await Room.aggregate([
      { $match: { guestHouseId: { $in: guestHouseIds }, isActive: true } },
      {
        $group: {
          _id: '$guestHouseId',
          totalRooms: { $sum: 1 },
          underMaintenance: {
            $sum: {
              $cond: [{ $eq: ['$status', 'MAINTENANCE'] }, 1, 0],
            },
          },
        },
      },
    ]);

    const roomMap = {};
    roomsAgg.forEach((r) => {
      roomMap[r._id.toString()] = r;
    });

    /* ---------------- CURRENTLY OCCUPIED ---------------- */
    // CHECKED_IN rooms are always occupied (no date filter – physically present)
    // BOOKED rooms are occupied only if their dates overlap today
    const activeBookings = await Booking.find({
      guestHouseId: { $in: guestHouseIds },
      $or: [
        { status: 'CHECKED_IN' },
        {
          status: 'BOOKED',
          checkInDate: { $lt: endUTC },
          checkOutDate: { $gt: startUTC },
        },
      ],
    }).lean();

    const occupiedMap = {};
    activeBookings.forEach((b) => {
      const ghId = b.guestHouseId.toString();
      if (!occupiedMap[ghId]) occupiedMap[ghId] = new Set();
      occupiedMap[ghId].add(b.roomId.toString());
    });

    /* ---------------- FINAL RESPONSE ---------------- */
    const result = guestHouses.map((gh) => {
      const roomStats = roomMap[gh._id.toString()] || {
        totalRooms: 0,
        underMaintenance: 0,
      };

      const occupied = occupiedMap[gh._id.toString()]?.size || 0;

      const available = Math.max(
        roomStats.totalRooms - occupied - roomStats.underMaintenance,
        0
      );

      const utilization =
        roomStats.totalRooms > 0
          ? Math.round((occupied / roomStats.totalRooms) * 100)
          : 0;

      return {
        _id: gh._id,
        name: gh.name,
        location: gh.location,
        category: gh.category,

        totalRooms: roomStats.totalRooms,
        underMaintenance: roomStats.underMaintenance,
        occupied,
        available,
        utilization,
      };
    });

    return successResponse(result);
  } catch (error) {
    console.error('[Guest Houses GET]', error);
    return errorResponse('Internal server error', 500);
  }
}




export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, location, category, address } = body;

    if (!name) {
      return errorResponse('Guest house name is required', 400);
    }

    const guestHouse = await GuestHouse.create({
      name,
      location,
      category,
      address,
      isActive: true,
    });

    return successResponse(guestHouse, 201);
  } catch (error) {
    console.error('[Guest Houses POST]', error);
    return errorResponse('Internal server error', 500);
  }
}
