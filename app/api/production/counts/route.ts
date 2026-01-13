import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateTotalServiceTime } from '@/lib/time-calculations'

// Função auxiliar para verificar e marcar conclusão do serviço
async function checkAndCompleteService(serviceId: string) {
  // Buscar todas as peças do serviço
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      pecas: true,
      sessions: true
    }
  })

  if (!service || service.concluido) return

  // Calcular total previsto e produzido
  let totalPrevisto = 0
  let totalProduzido = 0

  for (const piece of service.pecas) {
    totalPrevisto += piece.quantidade_prevista

    // Somar quantidade produzida desta peça
    const produced = await prisma.productionCount.aggregate({
      where: { pieceId: piece.id },
      _sum: { quantity: true }
    })

    totalProduzido += produced._sum.quantity || 0
  }

  // Se todas as peças foram produzidas, marcar como concluído
  if (totalProduzido >= totalPrevisto) {
    // Calcular tempo total de produção
    const totalSeconds = calculateTotalServiceTime(service.sessions)

    // Atualizar serviço como concluído
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        concluido: true,
        data_conclusao: new Date(),
        tempo_total_producao_segundos: totalSeconds
      }
    })

    console.log(`✅ Serviço ${service.cliente} concluído! Tempo total: ${totalSeconds}s`)
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  // body: { pieceId, operatorId, quantity?, action?: 'start' | 'finish' }
  const { pieceId, operatorId, quantity, action } = body || {}
  if (!pieceId || !operatorId) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  // Se action = 'start', cria um registro com inicio_producao
  if (action === 'start') {
    const count = await prisma.productionCount.create({ 
      data: { 
        pieceId, 
        operatorId, 
        quantity: 0, // Ainda não finalizou
        inicio_producao: new Date()
      } 
    })
    return NextResponse.json(count, { status: 201 })
  }

  // Se action = 'finish', busca o registro em aberto e finaliza
  if (action === 'finish') {
    // Busca o registro mais recente deste operador/peça que ainda não finalizou
    const openCount = await prisma.productionCount.findFirst({
      where: {
        pieceId,
        operatorId,
        inicio_producao: { not: null },
        fim_producao: null
      },
      orderBy: { inicio_producao: 'desc' }
    })

    if (!openCount) {
      return NextResponse.json({ error: 'Nenhuma produção em andamento encontrada' }, { status: 404 })
    }

    const fimProducao = new Date()
    const inicioProducao = openCount.inicio_producao!
    const tempoSegundos = Math.floor((fimProducao.getTime() - inicioProducao.getTime()) / 1000)

    const count = await prisma.productionCount.update({
      where: { id: openCount.id },
      data: {
        fim_producao: fimProducao,
        tempo_producao_segundos: tempoSegundos,
        quantity: 1 // Finaliza com 1 peça produzida
      }
    })

    // Buscar serviceId da peça e verificar conclusão
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      select: { serviceId: true }
    })

    if (piece?.serviceId) {
      await checkAndCompleteService(piece.serviceId)
    }

    return NextResponse.json(count, { status: 200 })
  }

  // Comportamento legado (sem action) - mantém compatibilidade
  const count = await prisma.productionCount.create({ 
    data: { pieceId, operatorId, quantity: quantity ?? 1 } 
  })

  // Buscar serviceId da peça e verificar conclusão
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: { serviceId: true }
  })

  if (piece?.serviceId) {
    await checkAndCompleteService(piece.serviceId)
  }

  return NextResponse.json(count, { status: 201 })
}

// GET - Busca registros em aberto
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const pieceId = searchParams.get('pieceId')
  const operatorId = searchParams.get('operatorId')

  if (!pieceId || !operatorId) {
    return NextResponse.json({ error: 'pieceId e operatorId são obrigatórios' }, { status: 400 })
  }

  // Busca produção em andamento
  const openCount = await prisma.productionCount.findFirst({
    where: {
      pieceId,
      operatorId,
      inicio_producao: { not: null },
      fim_producao: null
    },
    orderBy: { inicio_producao: 'desc' }
  })

  return NextResponse.json(openCount || null)
}
