'use client'
import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function OperadorSessao({ params }: { params: { operatorId: string, serviceId: string } }) {
  const { operatorId, serviceId } = params
  const [service, setService] = useState<any | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [totals, setTotals] = useState<Record<string, number>>({}) // totais agregados (todos operadores)
  const [myTotals, setMyTotals] = useState<Record<string, number>>({}) // totais apenas deste operador
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [productionInProgress, setProductionInProgress] = useState<Record<string, any>>({}) // controla peças em produção
  const [preparoIniciado, setPreparoIniciado] = useState(false)
  const [preparoFinalizado, setPreparoFinalizado] = useState(false)
  const [preparoInfo, setPreparoInfo] = useState<any>(null)
  const [valorRefugo, setValorRefugo] = useState('')
  const [showRefugoForm, setShowRefugoForm] = useState(false)

  const formatDateTime = (date?: string | null) => {
    if (!date) return ''
    return new Date(date).toLocaleString('pt-BR')
  }

  const loadService = async () => {
    const res = await fetch(`/api/services/${serviceId}`)
    const svc = await res.json()
    setService(svc)
    
    // Verifica status do preparo
    setPreparoIniciado(!!svc.data_inicio_preparo)
    setPreparoFinalizado(!!svc.data_fim_preparo)
    
    // Inicializa o valor do refugo se já existir
    if (svc.valor_refugo !== null && svc.valor_refugo !== undefined) {
      setValorRefugo(svc.valor_refugo.toString())
    }
  }

  const loadPreparoStatus = async () => {
    const res = await fetch(`/api/production/preparation?serviceId=${serviceId}`)
    const data = await res.json()
    setPreparoInfo(data)
    setPreparoIniciado(data.preparoIniciado)
    setPreparoFinalizado(data.preparoFinalizado)
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
    loadPreparoStatus()
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

  const iniciarPreparo = async () => {
    const res = await fetch('/api/production/preparation', {
      method: 'POST',
      body: JSON.stringify({ serviceId, action: 'start' }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (res.ok) {
      await loadPreparoStatus()
      await loadService()
    } else {
      const error = await res.json()
      alert(error.error || 'Erro ao iniciar preparo')
    }
  }

  const finalizarPreparo = async () => {
    const res = await fetch('/api/production/preparation', {
      method: 'POST',
      body: JSON.stringify({ serviceId, action: 'finish' }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (res.ok) {
      await loadPreparoStatus()
      await loadService()
    } else {
      const error = await res.json()
      alert(error.error || 'Erro ao finalizar preparo')
    }
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

  const salvarRefugo = async () => {
    const valor = parseFloat(valorRefugo)
    
    if (isNaN(valor) || valor < 0) {
      alert('Por favor, informe um valor válido (número positivo)')
      return
    }

    const res = await fetch(`/api/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_refugo: valor })
    })

    if (res.ok) {
      alert('Valor do refugo salvo com sucesso!')
      setShowRefugoForm(false)
      await loadService()
    } else {
      alert('Erro ao salvar o valor do refugo')
    }
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

      {/* Seção de Preparo */}
      {!preparoFinalizado && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-5 shadow-md">
          <h2 className="text-xl font-bold text-amber-800 mb-3">🔧 Preparo do Serviço</h2>
          <p className="text-sm text-amber-700 mb-4">
            Antes de iniciar a produção, registre o tempo de preparo das máquinas e materiais.
          </p>
          
          {!preparoIniciado ? (
            <Button 
              onClick={iniciarPreparo}
              className="bg-amber-600 hover:bg-amber-700 text-lg py-3 px-6"
            >
              ▶️ Iniciar Preparo
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/60 rounded p-3">
                <p className="text-sm text-amber-800">
                  ⏱️ Preparo iniciado em: <span className="font-bold">{formatDateTime(service?.data_inicio_preparo)}</span>
                </p>
              </div>
              <Button 
                onClick={finalizarPreparo}
                className="bg-green-600 hover:bg-green-700 text-lg py-3 px-6"
              >
                ✅ Finalizar Preparo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Informação de preparo finalizado */}
      {preparoFinalizado && service?.tempo_preparo_segundos && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-green-800">✅ Preparo Concluído</h3>
              <p className="text-sm text-green-700">
                Tempo de preparo: <span className="font-bold">
                  {Math.floor(service.tempo_preparo_segundos / 3600)}h {Math.floor((service.tempo_preparo_segundos % 3600) / 60)}min
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {!running ? (
          <Button 
            onClick={start} 
            disabled={!preparoFinalizado}
            className={!preparoFinalizado ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {preparoFinalizado ? 'Iniciar operação' : '🔒 Finalize o preparo primeiro'}
          </Button>
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

      {/* Seção de Refugo - mostra quando o serviço está concluído OU quando não há sessão ativa */}
      {service && (service.concluido || !running) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-lg p-5 shadow-md">
          <h2 className="text-xl font-bold text-red-800 mb-3">♻️ Registro de Refugo</h2>
          
          {service.valor_refugo !== null && service.valor_refugo !== undefined && !showRefugoForm ? (
            <div className="space-y-3">
              <div className="bg-white/60 rounded p-4">
                <p className="text-lg text-red-800">
                  💰 Valor do Refugo: <span className="font-bold text-2xl">R$ {service.valor_refugo.toFixed(2)}</span>
                </p>
              </div>
              <Button 
                onClick={() => setShowRefugoForm(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                ✏️ Editar Valor do Refugo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-700 mb-3">
                Registre o valor do material refugado/desperdiçado durante a produção.
              </p>
              <div className="bg-white rounded-lg p-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Valor do Refugo (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorRefugo}
                  onChange={(e) => setValorRefugo(e.target.value)}
                  placeholder="0.00"
                  className="text-lg"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={salvarRefugo}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    💾 Salvar Refugo
                  </Button>
                  {showRefugoForm && service.valor_refugo !== null && (
                    <Button 
                      onClick={() => {
                        setShowRefugoForm(false)
                        setValorRefugo(service.valor_refugo?.toString() || '')
                      }}
                      className="bg-gray-500 hover:bg-gray-600"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
