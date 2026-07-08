import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = ['/login', '/register', '/scan', '/forgot-password', '/unauthorized']
  if (publicRoutes.some(r => pathname.startsWith(r))) return supabaseResponse

  // Not logged in → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Get role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Role-based routing
  if (pathname.startsWith('/coach') && !['admin', 'coach'].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  if (pathname.startsWith('/parent') && role !== 'parent') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  if (pathname.startsWith('/player') && role !== 'player') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}