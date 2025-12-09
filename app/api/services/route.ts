import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serviceSchema } from '@/lib/validations'
import { auditLog } from '@/lib/audit'

export async function GET() {
  const data = await prisma.service.findMany({ include: { pecas: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = serviceSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const s = parsed.data
  const created = await prisma.service.create({
    data: {
      cliente: s.cliente,
      descricao_servico: s.descricao_servico,
      observacoes: s.observacoes || null,
      data_previsao_preparo: new Date(s.data_previsao_preparo),
      pecas: { create: s.pecas.map(p => ({ nome: p.nome, quantidade_prevista: p.quantidade_prevista, tipo_metal: p.tipo_metal, marca_material: p.marca_material })) }
    },
    include: { pecas: true }
  })
  await auditLog({ action: 'CREATE', entity: 'Service', entityId: created.id, after: created })
  return NextResponse.json(created, { status: 201 })
}
