'use client'
import { useEffect, useState } from 'react'

interface DetailedRecord {
  id: string
  pieceName: string
  operatorName: string
  serviceName: string
  startTime: string
  endTime: string
  seconds: number
  formatted: string
  date: string
}

interface TimeReportSummary {
  pieceId: string
  pieceName: string
  serviceName: string
  serviceId: string
  count: number
  avgSeconds: number
  minSeconds: number
  maxSeconds: number
  avgFormatted: string
  minFormatted: string
  maxFormatted: string
  operators: {
    operatorId: string
    operatorName: string
    count: number
    avgSeconds: number
    avgFormatted: string
  }[]
}

export default function ProductionTimesPage() {
  const [summary, setSummary] = useState<TimeReportSummary[]>([])
  const [detailed, setDetailed] = useState<DetailedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [operators, setOperators] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [operatorFilter, setOperatorFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [showDetailed, setShowDetailed] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar operadores e serviços
      const [opRes, servRes] = await Promise.all([
        fetch('/api/operators'),
        fetch('/api/services')
      ])
      
      const [opData, servData] = await Promise.all([
        opRes.json(),
        servRes.json()
      ])
      
      setOperators(opData)
      setServices(servData)

      // Carregar relatório de tempos
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (operatorFilter) params.append('operatorId', operatorFilter)
      if (serviceFilter) params.append('serviceId', serviceFilter)

      const timeRes = await fetch(`/api/production/time-report?${params.toString()}`)
      const timeData = await timeRes.json()
      
      setSummary(timeData.summary || [])
      setDetailed(timeData.detailed || [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [startDate, endDate, operatorFilter, serviceFilter])

  const handleExportCsv = () => {
    const rows = detailed.map(r => ({
      'Data': new Date(r.date).toLocaleString('pt-BR'),
      'Serviço': r.serviceName,
      'Peça': r.pieceName,
      'Operador': r.operatorName,
      'Início': new Date(r.startTime).toLocaleString('pt-BR'),
      'Fim': new Date(r.endTime).toLocaleString('pt-BR'),
      'Tempo': r.formatted,
      'Segundos': r.seconds
    }))

    const header = Object.keys(rows[0] || {})
    const csv = [header, ...rows.map(r => Object.values(r))]
      .map(line => line.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const suffix = `${startDate || 'desde-origem'}_${endDate || 'hoje'}`
    a.href = url
    a.download = `relatorio-tempos-producao_${suffix}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalProductions = detailed.length
  const avgTime = summary.length > 0 
    ? Math.round(summary.reduce((acc, s) => acc + s.avgSeconds, 0) / summary.length)
    : 0
  const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">⏱️ Relatório de Tempos de Produção</h1>
        <p className="text-slate-600">Análise detalhada dos tempos de produção de cada peça.</p>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-end mt-4">
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">Data início</label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">Data fim</label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">Operador</label>
            <select
              className="border rounded px-2 py-1 text-sm min-w-[180px]"
              value={operatorFilter}
              onChange={e => setOperatorFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {operators.map((op: any) => (
                <option key={op.id} value={op.id}>{op.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-slate-600">Serviço</label>
            <select
              className="border rounded px-2 py-1 text-sm min-w-[200px]"
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>{s.cliente} - {s.descricao_servico}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Aplicar filtros'}
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
            disabled={loading || detailed.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700 font-semibold">Total de Produções</p>
          <p className="text-3xl font-bold text-blue-900">{totalProductions}</p>
          <p className="text-xs text-blue-600 mt-1">Com tempo registrado</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700 font-semibold">Tempo Médio Geral</p>
          <p className="text-3xl font-bold text-green-900">{formatSeconds(avgTime)}</p>
          <p className="text-xs text-green-600 mt-1">Média de todas as peças</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-700 font-semibold">Peças Monitoradas</p>
          <p className="text-3xl font-bold text-purple-900">{summary.length}</p>
          <p className="text-xs text-purple-600 mt-1">Com tempos registrados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setShowDetailed(false)}
          className={`px-4 py-2 font-semibold transition ${
            !showDetailed
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          📊 Resumo por Peça
        </button>
        <button
          onClick={() => setShowDetailed(true)}
          className={`px-4 py-2 font-semibold transition ${
            showDetailed
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          📋 Registros Detalhados
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="p-8 text-center text-slate-600">Carregando dados...</div>
      ) : (
        <>
          {!showDetailed ? (
            /* Resumo por Peça */
            summary.length === 0 ? (
              <div className="p-8 text-center text-slate-600 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700">Nenhum registro de tempo encontrado.</p>
                <p className="text-sm text-amber-600 mt-2">
                  Os tempos são registrados quando o operador inicia e finaliza a produção de cada peça.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.map((item) => (
                  <div key={item.pieceId} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{item.pieceName}</h3>
                          <p className="text-sm text-slate-600">{item.serviceName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{item.count}</p>
                          <p className="text-xs text-slate-600">produções</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-green-50 rounded p-3 border border-green-200">
                          <p className="text-xs text-green-700 font-semibold">⏱️ Tempo Médio</p>
                          <p className="text-2xl font-bold text-green-600">{item.avgFormatted}</p>
                        </div>
                        <div className="bg-blue-50 rounded p-3 border border-blue-200">
                          <p className="text-xs text-blue-700 font-semibold">⚡ Mais Rápido</p>
                          <p className="text-2xl font-bold text-blue-600">{item.minFormatted}</p>
                        </div>
                        <div className="bg-orange-50 rounded p-3 border border-orange-200">
                          <p className="text-xs text-orange-700 font-semibold">🐢 Mais Lento</p>
                          <p className="text-2xl font-bold text-orange-600">{item.maxFormatted}</p>
                        </div>
                      </div>
                      {item.operators.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Desempenho por Operador:</p>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {item.operators.map((op) => (
                              <div key={op.operatorId} className="bg-slate-50 rounded px-3 py-2 flex justify-between items-center">
                                <span className="text-sm text-slate-700">{op.operatorName}</span>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-slate-900">{op.avgFormatted}</p>
                                  <p className="text-xs text-slate-500">{op.count} peças</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Registros Detalhados */
            detailed.length === 0 ? (
              <div className="p-8 text-center text-slate-600">Nenhum registro detalhado encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white border rounded-lg">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Data/Hora</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Serviço</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Peça</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Operador</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Início</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fim</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailed.map((record) => (
                      <tr key={record.id} className="border-t hover:bg-slate-50 transition">
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                          <br />
                          <span className="text-xs text-slate-500">
                            {new Date(record.date).toLocaleTimeString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{record.serviceName}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{record.pieceName}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{record.operatorName}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {new Date(record.startTime).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {new Date(record.endTime).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-blue-600">{record.formatted}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
