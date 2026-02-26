import { connectToDatabase } from '@/lib/mongodb'
import { successResponse, errorResponse } from '@/lib/api-utils'
import User from '@/lib/models/User.model'
import mongoose from 'mongoose'

/* -------- GET USER BY ID -------- */
export async function GET(request, { params }) {
  try {
    await connectToDatabase()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user id', 400)
    }

    const user = await User.findById(id).select('-password').lean()
    if (!user) return errorResponse('User not found', 404)

    return successResponse(user)
  } catch (err) {
    return errorResponse('Internal server error', 500)
  }
}

/* -------- UPDATE USER / CHANGE ROLE -------- */
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user id', 400)
    }

    const updated = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          department: body.department,
          phone: body.phone,
          role: body.role,
          active: body.active,
        },
      },
      { new: true }
    ).select('-password')

    if (!updated) return errorResponse('User not found', 404)

    return successResponse(updated)
  } catch (err) {
    return errorResponse('Internal server error', 500)
  }
}
