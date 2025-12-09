import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const operatorId = searchParams.get('operatorId') || undefined
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')
  const period = searchParams.get('period') || 'day' // fallback

  // Determinar intervalo de datas: se start/end enviados, usar; senão usar period
  let startDate: Date
  let endDate: Date

  if (startDateParam || endDateParam) {
    startDate = startDateParam ? new Date(startDateParam) : new Date('1970-01-01')
    endDate = endDateParam ? new Date(endDateParam) : new Date()
    // incluir fim do dia
    endDate.setHours(23, 59, 59, 999)
  } else {
    const now = new Date()
    endDate = new Date(now)
    startDate = new Date(now)
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate.setDate(now.getDate() - 1)
    }
  }

  const counts = await prisma.productionCount.groupBy({
    by: ['operatorId'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(operatorId && { operatorId })
    },
    _sum: { quantity: true }
  })

  const operators = await prisma.operator.findMany({})
  const ranking = counts
    .map((c) => ({
      operatorId: c.operatorId,
      total: c._sum.quantity || 0,
      nome: operators.find(o => o.id === c.operatorId)?.nome || 'N/A'
    }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ ranking, startDate, endDate })
}
