import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow these
  const publicPaths = [
    '/login', '/register', '/forgot-password', '/reset-password',
    '/unauthorized', '/scan', '/manifest.json', '/icon-192.png', '/icon-512.png'
  ]
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check for Supabase auth cookie (any of the possible names)
  const cookies = request.cookies
  const hasSession = cookies.getAll().some(c =>
    c.name.includes('auth-token') || c.name.includes('supabase')
  )

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}