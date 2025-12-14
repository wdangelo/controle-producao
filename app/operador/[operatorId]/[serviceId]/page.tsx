'use client'
import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'

export default function OperadorSessao({ params }: { params: { operatorId: string, serviceId: string } }) {
  const { operatorId, serviceId } = params
  const [service, setService] = useState<any | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [totals, setTotals] = useState<Record<string, number>>({}) // totais agregados (todos operadores)
  const [myTotals, setMyTotals] = useState<Record<string, number>>({}) // totais apenas deste operador
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [productionInProgress, setProductionInProgress] = useState<Record<string, any>>({}) // controla peças em produção

  const formatDateTime = (date?: string | null) => {
    if (!date) return ''
    return new Date(date).toLocaleString('pt-BR')
  }

  const loadService = async () => {
    const res = await fetch(`/api/services/${serviceId}`)
    setService(await res.json())
  }

  const loadSession = async () => {
    const res = await fetch(`/api/production/sessions?operatorId=${operatorId}&serviceId=${serviceId}`)
    const sess = await res.json()
    setSession(sess)
    if (sess) {
      setRunning(!sess.data_fim)
      setPaused(!!sess.data_inicio_almoco && !sess.data_fim_almoco)
    }
  }

  const loadTotals = async () => {
    // Busca totais agregados (todos operadores) e totais do operador atual em paralelo
    const [allRes, myRes] = await Promise.all([
      fetch(`/api/production/totals?serviceId=${serviceId}`),
      fetch(`/api/production/totals?serviceId=${serviceId}&operatorId=${operatorId}`)
    ])

    const [allData, myData] = await Promise.all([allRes.json(), myRes.json()])

    // Agregar totais de todos os operadores para cada peça
    const aggregated: Record<string, number> = {}
    for (const item of allData) {
      if (!aggregated[item.pieceId]) aggregated[item.pieceId] = 0
      aggregated[item.pieceId] += item.totalProduced
    }

    // TotaIs apenas do operador corrente
    const mine: Record<string, number> = {}
    for (const item of myData) {
      mine[item.pieceId] = item.totalProduced
    }

    setTotals(aggregated)
    setMyTotals(mine)
  }

  const checkProductionStatus = async () => {
    // Verifica se há produções em andamento para cada peça
    if (!service?.pecas) return
    
    const statusMap: Record<string, any> = {}
    await Promise.all(
      service.pecas.map(async (pc: any) => {
        const res = await fetch(`/api/production/counts?pieceId=${pc.id}&operatorId=${operatorId}`)
        const data = await res.json()
        if (data) {
          statusMap[pc.id] = data
        }
      })
    )
    setProductionInProgress(statusMap)
  }

  useEffect(() => {
    loadService()
    loadSession()
    loadTotals()
  }, [])

  // Verifica status de produção quando o serviço é carregado
  useEffect(() => {
    if (service?.pecas) {
      checkProductionStatus()
    }
  }, [service])

  // Sincronização em tempo real: polling a cada 1 segundo
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      loadTotals()
      checkProductionStatus()
    }, 1000)
    return () => clearInterval(interval)
  }, [running, service])

  const start = async () => {
    const res = await fetch('/api/production/sessions', {
      method: 'POST',
      body: JSON.stringify({ operatorId, serviceId, action: 'start' }),
      headers: { 'Content-Type': 'application/json' }
    })
    const sess = await res.json()
    setSession(sess)
    setRunning(true)
  }

  const pause = async () => {
    await fetch('/api/production/sessions', {
      method: 'POST',
      body: JSON.stringify({ operatorId, serviceId, action: 'pause' }),
      headers: { 'Content-Type': 'application/json' }
    })
    setPaused(true)
  }

  const resume = async () => {
    await fetch('/api/production/sessions', {
      method: 'POST',
      body: JSON.stringify({ operatorId, serviceId, action: 'resume' }),
      headers: { 'Content-Type': 'application/json' }
    })
    setPaused(false)
  }

  const end = async () => {
    await fetch('/api/production/sessions', {
      method: 'POST',
      body: JSON.stringify({ operatorId, serviceId, action: 'end' }),
      headers: { 'Content-Type': 'application/json' }
    })
    setRunning(false)
    await loadSession()
  }

  const handleProductionClick = async (pieceId: string) => {
    const inProgress = productionInProgress[pieceId]

    if (!inProgress) {
      // Inicia a produção
      await fetch('/api/production/counts', {
        method: 'POST',
        body: JSON.stringify({ pieceId, operatorId, action: 'start' }),
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      // Finaliza a produção
      await fetch('/api/production/counts', {
        method: 'POST',
        body: JSON.stringify({ pieceId, operatorId, action: 'finish' }),
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Atualiza status e totais
    await checkProductionStatus()
    await loadTotals()
  }

  const formatElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    const seconds = Math.floor((now - start) / 1000)
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const saldo = useMemo(() => {
    const map: Record<string, { previsto: number, produzido: number }> = {}
    for (const p of service?.pecas || []) {
      map[p.id] = { previsto: p.quantidade_prevista, produzido: totals[p.id] || 0 }
    }
    return map
  }, [service, totals])

  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-2xl font-bold">📊 Produção</h1>
      {service?.cliente && (
        <p className="text-lg font-semibold text-slate-800">Cliente: {service.cliente}</p>
      )}
      {session && (
        <div className="text-sm text-slate-700 space-y-1">
          <p>Sessão iniciada: <span className="font-semibold">{formatDateTime(session.data_inicio)}</span></p>
          {session.data_inicio_almoco && (
            <p>Início almoço: <span className="font-semibold">{formatDateTime(session.data_inicio_almoco)}</span></p>
          )}
          {session.data_fim_almoco && (
            <p>Fim almoço: <span className="font-semibold">{formatDateTime(session.data_fim_almoco)}</span></p>
          )}
          {session.data_fim && (
            <p>Finalizada: <span className="font-semibold">{formatDateTime(session.data_fim)}</span></p>
          )}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {!running ? (
          <Button onClick={start}>Iniciar operação</Button>
        ) : (
          <>
            {!paused && <Button onClick={pause}>Iniciar pausa para almoço</Button>}
            {paused && <Button onClick={resume}>Finalizar pausa</Button>}
            <Button className="bg-red-600" onClick={end}>Finalizar operação</Button>
          </>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">📦 Peças da Produção</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {service?.pecas?.map((pc: any) => {
            const inProgress = productionInProgress[pc.id]
            const isProducing = !!inProgress
            
            return (
              <div 
                key={pc.id} 
                className={`border-2 rounded-lg p-5 flex flex-col items-center justify-between shadow-md hover:shadow-lg transition-all ${
                  isProducing 
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 animate-pulse' 
                    : 'border-blue-400 bg-gradient-to-br from-blue-50 to-white'
                }`}
              >
                <div className="text-center w-full mb-4">
                  <div className="text-3xl font-bold text-gray-800 mb-2">{pc.nome}</div>
                  
                  {isProducing && (
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-full mb-3 font-bold text-lg">
                      ⏱️ EM PRODUÇÃO: {formatElapsedTime(inProgress.inicio_producao)}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-2xl">
                      <span className="font-bold text-green-600">Previsto: {pc.quantidade_prevista}</span>
                    </div>
                    <div className="text-2xl">
                      <span className="font-bold text-blue-600">Produzido: {totals[pc.id] || 0}</span>
                    </div>
                    <div className="text-xl">
                      <span className="font-semibold text-indigo-600">Produzido Operador: {myTotals[pc.id] || 0}</span>
                    </div>
                    <div className="text-2xl">
                      <span className="font-bold text-red-600">Saldo: {(pc.quantidade_prevista || 0) - (totals[pc.id] || 0)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mt-3">
                    Metal: {pc.tipo_metal} | Marca: {pc.marca_material}
                  </div>
                </div>
                <Button
                  className={`text-2xl py-4 px-8 font-bold ${
                    isProducing 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={() => handleProductionClick(pc.id)}
                  disabled={!running || paused}
                >
                  {isProducing ? '✓ Finalizar' : '▶ Iniciar'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
