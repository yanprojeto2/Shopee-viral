import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'shopee-admin-token'
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!)

export async function middleware(request: NextRequest) {
  const isAdminRoute =
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api/admin')

  if (!isAdminRoute) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  try {
    await jwtVerify(token, secret())
    return NextResponse.next()
  } catch {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
