import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.operator.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const current = await prisma.operator.findUnique({ where: { id: params.id } })
  if (!current) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  const json = await req.json()
  const updated = await prisma.operator.update({ where: { id: params.id }, data: json })
  await auditLog({ action: 'UPDATE', entity: 'Operator', entityId: params.id, before: current, after: updated })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const current = await prisma.operator.findUnique({ where: { id: params.id } })
  if (!current) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  await prisma.operator.delete({ where: { id: params.id } })
  await auditLog({ action: 'DELETE', entity: 'Operator', entityId: params.id, before: current })
  return NextResponse.json({ ok: true })
}
