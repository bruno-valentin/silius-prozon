import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = 'REDACTED' // change si tu veux

export function middleware(request: NextRequest) {
  // Ne pas protéger les assets statiques
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('demo-access')
  if (cookie?.value === PASSWORD) {
    return NextResponse.next()
  }

  // Si c'est le POST du formulaire de login
  if (request.method === 'POST' && pathname === '/api/login') {
    return NextResponse.next()
  }

  // Rediriger vers la page de login
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  if (pathname !== '/login') {
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
