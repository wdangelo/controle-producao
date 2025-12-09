import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json()
  // body: { pieceId, operatorId, quantity? }
  const { pieceId, operatorId, quantity } = body || {}
  if (!pieceId || !operatorId) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const count = await prisma.productionCount.create({ data: { pieceId, operatorId, quantity: quantity ?? 1 } })
  return NextResponse.json(count, { status: 201 })
}
