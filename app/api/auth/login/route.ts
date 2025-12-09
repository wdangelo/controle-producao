import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signJwt } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(req: Request) {
  let payload: any = null
  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    payload = await req.json()
  } else {
    const form = await req.formData()
    payload = { email: String(form.get('email') || ''), password: String(form.get('password') || '') }
  }
  const parsed = loginSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }
  const ok = await comparePassword(password, user.senha)
  if (!ok) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }
  const token = signJwt({ sub: user.id, isAdmin: true })
  const redirectUrl = new URL('/dashboard', req.url)
  const res = NextResponse.redirect(redirectUrl)
  res.cookies.set('auth', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}
