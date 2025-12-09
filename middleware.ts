import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth')?.value
    // Atenção: Middleware roda em Edge Runtime, evitar libs Node.
    // Aqui validamos apenas a presença do cookie para liberar acesso.
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
