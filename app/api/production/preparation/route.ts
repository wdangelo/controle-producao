// app/api/production/preparation/route.ts
// API para gerenciar tempo de preparo do serviço

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST - Iniciar ou finalizar preparo
 * Body: { serviceId: string, action: 'start' | 'finish' }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { serviceId, action } = body

    if (!serviceId || !action) {
      return NextResponse.json(
        { error: 'serviceId e action são obrigatórios' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    }) as any

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    if (action === 'start') {
      // Iniciar preparo
      if (service.data_inicio_preparo) {
        return NextResponse.json(
          { error: 'Preparo já foi iniciado' },
          { status: 400 }
        )
      }

      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: { data_inicio_preparo: new Date() }
      })

      return NextResponse.json({
        message: 'Preparo iniciado',
        service: updated
      })
    }

    if (action === 'finish') {
      // Finalizar preparo
      if (!service.data_inicio_preparo) {
        return NextResponse.json(
          { error: 'Preparo não foi iniciado ainda' },
          { status: 400 }
        )
      }

      if (service.data_fim_preparo) {
        return NextResponse.json(
          { error: 'Preparo já foi finalizado' },
          { status: 400 }
        )
      }

      const dataFim = new Date()
      const tempoSegundos = Math.floor(
        (dataFim.getTime() - service.data_inicio_preparo.getTime()) / 1000
      )

      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: {
          data_fim_preparo: dataFim,
          tempo_preparo_segundos: tempoSegundos
        }
      })

      return NextResponse.json({
        message: 'Preparo finalizado',
        service: updated,
        tempoSegundos
      })
    }

    return NextResponse.json(
      { error: 'Action inválida. Use "start" ou "finish"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao gerenciar preparo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar status do preparo
 * Query: ?serviceId=xxx
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const serviceId = searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId é obrigatório' },
        { status: 400 }
      )
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        cliente: true,
        data_inicio_preparo: true,
        data_fim_preparo: true,
        tempo_preparo_segundos: true
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      serviceId: service.id,
      cliente: service.cliente,
      preparoIniciado: !!service.data_inicio_preparo,
      preparoFinalizado: !!service.data_fim_preparo,
      dataInicioPreparo: service.data_inicio_preparo,
      dataFimPreparo: service.data_fim_preparo,
      tempoPreparoSegundos: service.tempo_preparo_segundos
    })
  } catch (error) {
    console.error('Erro ao buscar preparo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
