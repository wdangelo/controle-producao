'use client'
import { useEffect, useState } from 'react'

interface ProducaoItem {
  serviceId: string
  serviceName: string
  operatorId: string
  operatorName: string
  totalProduzido: number
  piecesDetail: { pieceName: string; qty: number }[]
}

interface TimeReportSummary {
  pieceId: string
  pieceName: string
  serviceName: string
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

export default function MetricsPage() {
  const [data, setData] = useState<ProducaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [operators, setOperators] = useState<any[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [operatorFilter, setOperatorFilter] = useState<string>('')
  const [timeReport, setTimeReport] = useState<TimeReportSummary[]>([])
  const [loadingTime, setLoadingTime] = useState(true)

  const loadTimeReport = async () => {
    setLoadingTime(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (operatorFilter) params.append('operatorId', operatorFilter)

      const res = await fetch(`/api/production/time-report?${params.toString()}`)
      const data = await res.json()
      setTimeReport(data.summary || [])
    } catch (err) {
      console.error('Erro ao carregar relatório de tempos:', err)
    }
    setLoadingTime(false)
  }

  const [completedServices, setCompletedServices] = useState<any[]>([])

  const load = async () => {
    setLoading(true)
    try {
      // Buscar serviços
      const servRes = await fetch('/api/services')
      const services = await servRes.json()

      // Filtrar serviços concluídos
      const completed = services.filter((s: any) => s.concluido)
      setCompletedServices(completed)

      // Buscar operadores
      const opRes = await fetch('/api/operators')
      const opData = await opRes.json()
      setOperators(opData)

      // Montar query de filtros
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (operatorFilter) params.append('operatorId', operatorFilter)

      // Para cada serviço, buscar totais
      const report: ProducaoItem[] = []
      for (const service of services) {
        const totalsRes = await fetch(`/api/production/totals?serviceId=${service.id}`)
        const totals = await totalsRes.json()

        // Agrupar por operador
        const byOp: Record<string, any> = {}
        for (const total of totals) {
          if (!byOp[total.operatorId]) {
            byOp[total.operatorId] = []
          }
          byOp[total.operatorId].push(total)
        }

        // Encontrar peças para montar detalhes
        const pieces = service.pecas || []

        for (const [opId, opTotals] of Object.entries(byOp)) {
          const operator = opData.find((o: any) => o.id === opId)
          const piecesDetail = (opTotals as any[]).map(t => {
            const piece = pieces.find((p: any) => p.id === t.pieceId)
            return { pieceName: piece?.nome || `Peça ${t.pieceId.substring(0, 4)}`, qty: t.totalProduced }
          })
          
          report.push({
            serviceId: service.id,
            serviceName: `${service.cliente} - ${service.descricao_servico}`,
            operatorId: opId,
            operatorName: operator?.nome || opId,
            totalProduzido: piecesDetail.reduce((s, p) => s + p.qty, 0),
            piecesDetail
          })
        }
      }

      setData(report.sort((a, b) => b.totalProduzido - a.totalProduzido))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { 
    load()
    loadTimeReport()
  }, [startDate, endDate, operatorFilter])

  const totalGeral = data.reduce((s, i) => s + i.totalProduzido, 0)
  const mediaOperador = data.length > 0 ? (totalGeral / [...new Set(data.map(d => d.operatorId))].length).toFixed(1) : 0

  const buildRows = () => {
    const rows: { servico: string; operador: string; peca: string; produzido: number }[] = []
    data.forEach(item => {
      item.piecesDetail.forEach(piece => {
        rows.push({
          servico: item.serviceName,
          operador: item.operatorName,
          peca: piece.pieceName,
          produzido: piece.qty
        })
      })
    })
    return rows
  }

  const handleExportCsv = () => {
    const rows = buildRows()
    const header = ['Serviço', 'Operador', 'Peça', 'Produzido']
    const csv = [header, ...rows.map(r => [r.servico, r.operador, r.peca, r.produzido])]
      .map(line => line.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const suffix = `${startDate || 'desde-origem'}_${endDate || 'hoje'}`
    a.href = url
    a.download = `relatorio-producao_${suffix}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportXlsx = async () => {
    const rows = buildRows()
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produção')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const suffix = `${startDate || 'desde-origem'}_${endDate || 'hoje'}`
    a.href = url
    a.download = `relatorio-producao_${suffix}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">📈 Acompanhamento de Produção</h1>
        <p className="text-slate-600">Filtre por intervalo de datas e por operador para gerar o relatório.</p>
        <div className="flex flex-wrap gap-2 items-end">
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
          <button
            onClick={load}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Aplicar filtros'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
              disabled={loading || data.length === 0}
            >
              Exportar CSV
            </button>
            <button
              onClick={handleExportXlsx}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              disabled={loading || data.length === 0}
            >
              Exportar XLSX
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700 font-semibold">Total Produzido</p>
          <p className="text-3xl font-bold text-blue-900">{totalGeral}</p>
          <p className="text-xs text-blue-600 mt-1">Todas as peças e operadores</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700 font-semibold">Operadores Ativos</p>
          <p className="text-3xl font-bold text-green-900">{new Set(data.map(d => d.operatorId)).size}</p>
          <p className="text-xs text-green-600 mt-1">Com produção registrada</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-700 font-semibold">Média por Operador</p>
          <p className="text-3xl font-bold text-purple-900">{mediaOperador}</p>
          <p className="text-xs text-purple-600 mt-1">Peças produzidas</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <p className="text-sm text-amber-700 font-semibold">Serviços Concluídos</p>
          <p className="text-3xl font-bold text-amber-900">{completedServices.length}</p>
          <p className="text-xs text-amber-600 mt-1">100% das peças produzidas</p>
        </div>
      </div>

      {/* Serviços Concluídos */}
      {completedServices.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">✅ Serviços Concluídos</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {completedServices.map((service) => {
              const tempoTotal = service.tempo_total_producao_segundos || 0
              const tempoPreparo = service.tempo_preparo_segundos || 0
              const tempoTotalComPreparo = tempoTotal + tempoPreparo
              
              const formatTempo = (seconds: number) => {
                const hours = Math.floor(seconds / 3600)
                const minutes = Math.floor((seconds % 3600) / 60)
                return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`
              }
              
              const dataConclusao = service.data_conclusao 
                ? new Date(service.data_conclusao).toLocaleDateString('pt-BR')
                : '-'

              return (
                <div key={service.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5 shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 text-lg">{service.cliente}</h3>
                      <p className="text-sm text-green-700">{service.descricao_servico}</p>
                    </div>
                    <span className="text-3xl">✅</span>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    {tempoPreparo > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">🔧 Tempo Preparo:</span>
                        <span className="font-semibold text-amber-700">{formatTempo(tempoPreparo)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">⏱️ Tempo Produção:</span>
                      <span className="font-semibold text-blue-700">{formatTempo(tempoTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm text-slate-700 font-bold">⏱️ Tempo Total:</span>
                      <span className="font-bold text-green-700 text-lg">{formatTempo(tempoTotalComPreparo)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">📅 Concluído em:</span>
                      <span className="font-semibold text-slate-700">{dataConclusao}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">📦 Peças:</span>
                      <span className="font-semibold text-slate-700">{service.pecas?.length || 0} tipos</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tempos de Produção */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">⏱️ Tempos de Produção por Peça</h2>
        {loadingTime ? (
          <div className="p-8 text-center text-slate-600">Carregando dados de tempo...</div>
        ) : timeReport.length === 0 ? (
          <div className="p-8 text-center text-slate-600 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700">Nenhum registro de tempo de produção encontrado.</p>
            <p className="text-sm text-amber-600 mt-2">Os tempos são registrados quando o operador inicia e finaliza a produção de cada peça.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeReport.map((item) => (
              <div key={item.pieceId} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="mb-3">
                  <h3 className="font-bold text-slate-900 text-lg">{item.pieceName}</h3>
                  <p className="text-xs text-slate-500 truncate">{item.serviceName}</p>
                  <p className="text-sm text-blue-600 mt-1">{item.count} produções registradas</p>
                </div>
                <div className="space-y-2 bg-slate-50 rounded p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">⏱️ Tempo Médio:</span>
                    <span className="font-bold text-green-600">{item.avgFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">⚡ Mais Rápido:</span>
                    <span className="font-semibold text-blue-600">{item.minFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">🐢 Mais Lento:</span>
                    <span className="font-semibold text-orange-600">{item.maxFormatted}</span>
                  </div>
                </div>
                {item.operators.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Por Operador:</p>
                    <div className="space-y-1">
                      {item.operators.slice(0, 3).map((op) => (
                        <div key={op.operatorId} className="flex justify-between text-xs">
                          <span className="text-slate-700 truncate flex-1">{op.operatorName}</span>
                          <span className="font-semibold text-slate-900 ml-2">{op.avgFormatted}</span>
                        </div>
                      ))}
                      {item.operators.length > 3 && (
                        <p className="text-xs text-slate-500 italic">+{item.operators.length - 3} operadores</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de Detalhes */}
      {loading ? (
        <div className="p-8 text-center text-slate-600">Carregando dados...</div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center text-slate-600">Nenhuma produção registrada ainda.</div>
      ) : (
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div key={`${item.serviceId}-${item.operatorId}`} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.serviceName}</h3>
                    <p className="text-sm text-slate-600">Operador: <span className="font-semibold text-slate-800">{item.operatorName}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{item.totalProduzido}</p>
                    <p className="text-xs text-slate-600">peças produzidas</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {item.piecesDetail.map((piece, pidx) => (
                    <div key={pidx} className="bg-blue-50 rounded px-3 py-2 text-center border border-blue-100">
                      <p className="text-xs text-slate-600 truncate">{piece.pieceName}</p>
                      <p className="text-lg font-bold text-blue-600">{piece.qty}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={load} 
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-400"
      >
        {loading ? 'Atualizando...' : 'Atualizar Dados'}
      </button>
    </div>
  )
}
