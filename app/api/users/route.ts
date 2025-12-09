import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'
import { auditLog } from '@/lib/audit'

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = userSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { nome, email, senha } = parsed.data
  const senhaHash = await hashPassword(senha)
  const user = await prisma.user.create({ data: { nome, email, senha: senhaHash } })
  await auditLog({ action: 'CREATE', entity: 'User', entityId: user.id, after: user })
  return NextResponse.json(user, { status: 201 })
}
