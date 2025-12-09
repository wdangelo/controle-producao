import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { operatorSchema } from '@/lib/validations'
import { auditLog } from '@/lib/audit'

export async function GET() {
  const data = await prisma.operator.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = operatorSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const op = await prisma.operator.create({ data: { nome: parsed.data.nome, codigo: parsed.data.codigo_operador } })
  await auditLog({ action: 'CREATE', entity: 'Operator', entityId: op.id, after: op })
  return NextResponse.json(op, { status: 201 })
}
