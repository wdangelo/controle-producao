import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth')?.value
    // Atenção: Middleware roda em Edge Runtime, evitar libs Node.
    // Aqui validamos apenas a presença do cookie para liberar acesso.
    if (!token) {
      // Força usar o host do request original para o redirect
      const url = new URL('/', req.url)
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
