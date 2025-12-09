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

  useEffect(() => {
    loadService()
    loadSession()
    loadTotals()
  }, [])

  // Sincronização em tempo real: polling a cada 1 segundo
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      loadTotals()
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

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

  const addOne = async (pieceId: string) => {
    await fetch('/api/production/counts', {
      method: 'POST',
      body: JSON.stringify({ pieceId, operatorId, quantity: 1 }),
      headers: { 'Content-Type': 'application/json' }
    })
    // Carrega totais imediatamente para feedback
    await loadTotals()
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
          {service?.pecas?.map((pc: any) => (
            <div key={pc.id} className="border-2 border-blue-400 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-between shadow-md hover:shadow-lg transition-shadow">
              <div className="text-center w-full mb-4">
                <div className="text-3xl font-bold text-gray-800 mb-2">{pc.nome}</div>
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
                className="text-2xl py-4 px-8 font-bold"
                onClick={() => addOne(pc.id)}
                disabled={!running || paused}
              >
                + 1
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
