import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const operatorId = searchParams.get('operatorId') || undefined
  const serviceId = searchParams.get('serviceId') || undefined
  const pieceId = searchParams.get('pieceId') || undefined
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')

  // Determinar intervalo de datas
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (startDateParam || endDateParam) {
    startDate = startDateParam ? new Date(startDateParam) : undefined
    endDate = endDateParam ? new Date(endDateParam) : undefined
    if (endDate) {
      endDate.setHours(23, 59, 59, 999)
    }
  }

  // Buscar todos os registros de produção com tempos registrados
  const productions = await prisma.productionCount.findMany({
    where: {
      tempo_producao_segundos: { not: null },
      ...(operatorId && { operatorId }),
      ...(pieceId && { pieceId }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } })
    },
    include: {
      piece: {
        include: {
          service: true
        }
      },
      operator: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filtrar por serviceId se necessário (através da relação piece -> service)
  let filteredProductions = productions
  if (serviceId) {
    filteredProductions = productions.filter(p => p.piece.service.id === serviceId)
  }

  // Calcular estatísticas agregadas por peça
  const pieceStats: Record<string, {
    pieceId: string
    pieceName: string
    serviceName: string
    serviceId: string
    count: number
    totalSeconds: number
    avgSeconds: number
    minSeconds: number
    maxSeconds: number
    operatorStats: Record<string, {
      operatorId: string
      operatorName: string
      count: number
      avgSeconds: number
    }>
  }> = {}

  for (const prod of filteredProductions) {
    const pieceId = prod.pieceId
    const seconds = prod.tempo_producao_segundos!

    if (!pieceStats[pieceId]) {
      pieceStats[pieceId] = {
        pieceId,
        pieceName: prod.piece.nome,
        serviceName: `${prod.piece.service.cliente} - ${prod.piece.service.descricao_servico}`,
        serviceId: prod.piece.service.id,
        count: 0,
        totalSeconds: 0,
        avgSeconds: 0,
        minSeconds: seconds,
        maxSeconds: seconds,
        operatorStats: {}
      }
    }

    const stat = pieceStats[pieceId]
    stat.count++
    stat.totalSeconds += seconds
    stat.minSeconds = Math.min(stat.minSeconds, seconds)
    stat.maxSeconds = Math.max(stat.maxSeconds, seconds)
    stat.avgSeconds = Math.round(stat.totalSeconds / stat.count)

    // Estatísticas por operador
    const opId = prod.operatorId
    if (!stat.operatorStats[opId]) {
      stat.operatorStats[opId] = {
        operatorId: opId,
        operatorName: prod.operator.nome,
        count: 0,
        avgSeconds: 0
      }
    }
    const opStat = stat.operatorStats[opId]
    const prevTotal = opStat.avgSeconds * opStat.count
    opStat.count++
    opStat.avgSeconds = Math.round((prevTotal + seconds) / opStat.count)
  }

  // Converter para array e adicionar formatação
  const report = Object.values(pieceStats).map(stat => ({
    ...stat,
    avgFormatted: formatSeconds(stat.avgSeconds),
    minFormatted: formatSeconds(stat.minSeconds),
    maxFormatted: formatSeconds(stat.maxSeconds),
    operators: Object.values(stat.operatorStats).map(op => ({
      ...op,
      avgFormatted: formatSeconds(op.avgSeconds)
    }))
  }))

  // Registros individuais detalhados
  const detailedRecords = filteredProductions.map(prod => ({
    id: prod.id,
    pieceName: prod.piece.nome,
    operatorName: prod.operator.nome,
    serviceName: `${prod.piece.service.cliente} - ${prod.piece.service.descricao_servico}`,
    startTime: prod.inicio_producao,
    endTime: prod.fim_producao,
    seconds: prod.tempo_producao_segundos,
    formatted: formatSeconds(prod.tempo_producao_segundos!),
    date: prod.createdAt
  }))

  return NextResponse.json({
    summary: report,
    detailed: detailedRecords,
    totalRecords: filteredProductions.length
  })
}

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
