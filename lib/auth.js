import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export function getAuthUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

// Access tokens are short-lived on purpose: getAuthUser() only checks the JWT signature,
// not current DB state, so a demoted/deactivated user keeps whatever this token grants
// until it expires. Keeping that window short (default 15m) plus refresh-time revocation
// (see /api/auth/refresh and the refresh-token revocation in users/[id] PATCH) bounds
// stale-privilege exposure to minutes instead of the old 7-day access-token lifetime.
export function generateAccessToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    },
  )
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex')
}

// Refresh tokens are stored hashed — a DB leak alone can't be replayed as a session.
export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getRefreshTokenExpiryDate() {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '7', 10)
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}
