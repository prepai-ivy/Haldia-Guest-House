import { connectToDatabase } from '@/lib/mongodb'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { getAuthUser } from '@/lib/auth'
import User from '@/lib/models/User.model'
import RefreshToken from '@/lib/models/RefreshToken.model'
import mongoose from 'mongoose'

const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER']

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

    // findByIdAndUpdate below skips schema validators, so an invalid role would otherwise
    // persist as a literal string and lock the user out of every role check in the app.
    if (body.role !== undefined && !VALID_ROLES.includes(body.role)) {
      return errorResponse('Invalid role', 400)
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

    // A role change or deactivation shouldn't wait out the old access token's lifetime —
    // revoking their refresh tokens means the next refresh attempt (at most one access-
    // token lifetime away) re-reads their new role/isActive from the DB and fails/updates
    // accordingly, instead of silently keeping old privileges until natural expiry.
    if (body.role !== undefined || body.isActive === false) {
      await RefreshToken.updateMany(
        { userId: id, revoked: false },
        { $set: { revoked: true } },
      )
    }

    return successResponse(updated)
  } catch (_err) {
    return errorResponse('Internal server error', 500)
  }
}
