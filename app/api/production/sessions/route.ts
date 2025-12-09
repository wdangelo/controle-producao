import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()
  // body: { operatorId, serviceId, action: 'start'|'pause'|'resume'|'end' }
  const { operatorId, serviceId, action } = body || {}
  if (!operatorId || !serviceId || !action) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  if (action === 'start') {
    const session = await prisma.operationSession.create({
      data: { operatorId, serviceId, data_inicio: new Date() }
    })
    return NextResponse.json(session, { status: 201 })
  }

  const session = await prisma.operationSession.findFirst({
    where: { operatorId, serviceId, data_fim: null },
    orderBy: { data_inicio: 'desc' }
  })
  if (!session) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

  if (action === 'pause') {
    const updated = await prisma.operationSession.update({
      where: { id: session.id },
      data: { data_inicio_almoco: new Date(), data_fim_almoco: null }
    })
    return NextResponse.json(updated)
  }

  if (action === 'resume') {
    const updated = await prisma.operationSession.update({
      where: { id: session.id },
      data: { data_fim_almoco: new Date() }
    })
    return NextResponse.json(updated)
  }

  if (action === 'end') {
    const updated = await prisma.operationSession.update({
      where: { id: session.id },
      data: { data_fim: new Date() }
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const operatorId = searchParams.get('operatorId')
  const serviceId = searchParams.get('serviceId')

  if (!operatorId || !serviceId) {
    return NextResponse.json({ error: 'operatorId e serviceId requeridos' }, { status: 400 })
  }

  // Busca sessão ativa (não finalizada) ou a última ativa
  const session = await prisma.operationSession.findFirst({
    where: { operatorId, serviceId },
    orderBy: { data_inicio: 'desc' }
  })

  return NextResponse.json(session || null)
}
