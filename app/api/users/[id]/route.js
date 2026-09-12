import { connectToDatabase } from '@/lib/mongodb'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { getAuthUser } from '@/lib/auth'
import User from '@/lib/models/User.model'
import mongoose from 'mongoose'

/* -------- GET USER BY ID -------- */
export async function GET(request, { params }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return errorResponse('Unauthorized', 401)

    const { id } = await params

    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role) && authUser._id !== id) {
      return errorResponse('Forbidden', 403)
    }

    await connectToDatabase()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user id', 400)
    }

    const user = await User.findById(id).select('-password').lean()
    if (!user) return errorResponse('User not found', 404)

    return successResponse(user)
  } catch (_err) {
    return errorResponse('Internal server error', 500)
  }
}

/* -------- UPDATE USER / CHANGE ROLE -------- */
export async function PATCH(request, { params }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return errorResponse('Unauthorized', 401)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return errorResponse('Forbidden', 403)
    }

    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user id', 400)
    }

    // Only SUPER_ADMIN can change roles
    if (body.role !== undefined && authUser.role !== 'SUPER_ADMIN') {
      return errorResponse('Only SUPER_ADMIN can change user roles', 403)
    }

    // An ADMIN cannot modify a SUPER_ADMIN's account at all (not just role) — otherwise
    // they could still deactivate one, strip their grade/department, etc.
    if (authUser.role !== 'SUPER_ADMIN') {
      const target = await User.findById(id).select('role')
      if (!target) return errorResponse('User not found', 404)
      if (target.role === 'SUPER_ADMIN') {
        return errorResponse('Only SUPER_ADMIN can modify a Super Admin account', 403)
      }
    }

    const updatePayload = {
      name: body.name,
      department: body.department,
      phone: body.phone,
      grade: body.grade,
      isActive: body.isActive,
    }
    if (body.role !== undefined) updatePayload.role = body.role

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).select('-password')

    if (!updated) return errorResponse('User not found', 404)

    return successResponse(updated)
  } catch (_err) {
    return errorResponse('Internal server error', 500)
  }
}
