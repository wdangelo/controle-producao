import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('serviceId')
  const operatorId = searchParams.get('operatorId')

  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId requerido' }, { status: 400 })
  }

  // Se operatorId específico, retorna totais apenas desse operador
  // Senão, retorna totais agregados por peça
  const counts = await prisma.productionCount.groupBy({
    by: ['pieceId', 'operatorId'],
    where: {
      piece: { serviceId },
      ...(operatorId && { operatorId })
    },
    _sum: { quantity: true }
  })

  const result = counts.map(c => ({
    pieceId: c.pieceId,
    operatorId: c.operatorId,
    totalProduced: c._sum.quantity || 0
  }))

  return NextResponse.json(result)
}
