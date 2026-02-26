import { NextResponse } from 'next/server'

export function middleware(req) {
  const res = NextResponse.next()

  res.headers.set('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers: res.headers })
  }

  return res
}

export const config = {
  matcher: '/api/:path*',
}
