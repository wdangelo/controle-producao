'use client'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ServicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [serviceRawMaterials, setServiceRawMaterials] = useState<{ [key: string]: any[] }>({})
  const [showAddMaterial, setShowAddMaterial] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [materialQuantity, setMaterialQuantity] = useState('1')
  const [form, setForm] = useState({
    cliente: '', descricao_servico: '', observacoes: '', data_previsao_preparo: new Date().toISOString().split('T')[0],
    pecas: [{ nome: '', quantidade_prevista: 0, tipo_metal: '', marca_material: '', valor_materia_prima: '' }]
  })

  const load = async () => {
    const res = await fetch('/api/services')
    setItems(await res.json())
  }

  const loadRawMaterials = async () => {
    const res = await fetch('/api/raw-materials')
    if (res.ok) {
      setRawMaterials(await res.json())
    }
  }

  const loadServiceRawMaterials = async (serviceId: string) => {
    const res = await fetch(`/api/services/${serviceId}/raw-materials`)
    if (res.ok) {
      const data = await res.json()
      setServiceRawMaterials(prev => ({ ...prev, [serviceId]: data }))
    }
  }

  useEffect(() => { 
    load()
    loadRawMaterials()
  }, [])

  const addPeca = () => setForm({ ...form, pecas: [...form.pecas, { nome: '', quantidade_prevista: 0, tipo_metal: '', marca_material: '', valor_materia_prima: '' }] })
  const updatePeca = (i: number, field: string, value: any) => {
    const copy = [...form.pecas]
    ;(copy[i] as any)[field] = (field === 'quantidade_prevista' || field === 'valor_materia_prima') ? Number(value) || 0 : value
    setForm({ ...form, pecas: copy })
  }
  const removePeca = (i: number) => setForm({ ...form, pecas: form.pecas.filter((_, idx) => idx !== i) })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/services', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } })
    setForm({ cliente: '', descricao_servico: '', observacoes: '', data_previsao_preparo: new Date().toISOString().split('T')[0], pecas: [{ nome: '', quantidade_prevista: 0, tipo_metal: '', marca_material: '', valor_materia_prima: '' }] })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    await load()
  }

  const addMaterialToService = async (serviceId: string) => {
    if (!selectedMaterial || !materialQuantity) {
      alert('Selecione uma matéria-prima e informe a quantidade')
      return
    }

    const res = await fetch(`/api/services/${serviceId}/raw-materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawMaterialId: selectedMaterial,
        quantidade: Number(materialQuantity)
      })
    })

    if (res.ok) {
      alert('Matéria-prima adicionada com sucesso!')
      setShowAddMaterial(null)
      setSelectedMaterial('')
      setMaterialQuantity('1')
      loadServiceRawMaterials(serviceId)
    } else {
      const error = await res.json()
      alert(error.error || 'Erro ao adicionar matéria-prima')
    }
  }

  const removeMaterialFromService = async (serviceId: string, rawMaterialId: string) => {
    if (!confirm('Deseja remover esta matéria-prima do serviço?')) return

    const res = await fetch(`/api/services/${serviceId}/raw-materials?rawMaterialId=${rawMaterialId}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      alert('Matéria-prima removida com sucesso!')
      loadServiceRawMaterials(serviceId)
    } else {
      const error = await res.json()
      alert(error.error || 'Erro ao remover matéria-prima')
    }
  }

  const toggleExpanded = (serviceId: string) => {
    const newExpanded = expandedService === serviceId ? null : serviceId
    setExpandedService(newExpanded)
    if (newExpanded) {
      loadServiceRawMaterials(serviceId)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Serviços</h1>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Cliente" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} />
          <Input placeholder="Descrição" value={form.descricao_servico} onChange={e => setForm({ ...form, descricao_servico: e.target.value })} />
          <Input placeholder="Observações" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          <Input type="date" value={form.data_previsao_preparo} onChange={e => setForm({ ...form, data_previsao_preparo: e.target.value })} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Peças</h2>
            <Button type="button" onClick={addPeca}>Adicionar peça</Button>
          </div>
          {form.pecas.map((p, i) => (
            <div key={i} className="grid md:grid-cols-6 gap-2 items-center">
              <Input placeholder="Nome da peça" value={p.nome} onChange={e => updatePeca(i, 'nome', e.target.value)} />
              <Input placeholder="Qtd prevista" type="number" value={p.quantidade_prevista} onChange={e => updatePeca(i, 'quantidade_prevista', e.target.value)} />
              <Input placeholder="Tipo do metal" value={p.tipo_metal} onChange={e => updatePeca(i, 'tipo_metal', e.target.value)} />
              <Input placeholder="Marca do material" value={p.marca_material} onChange={e => updatePeca(i, 'marca_material', e.target.value)} />
              <Input placeholder="Valor (R$)" type="number" step="0.01" min="0" value={p.valor_materia_prima} onChange={e => updatePeca(i, 'valor_materia_prima', e.target.value)} />
              <div className="flex justify-center">
                <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold" onClick={() => removePeca(i)}>×</button>
              </div>
            </div>
          ))}
        </div>
        <Button type="submit">Criar serviço</Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b"><th className="p-2">Cliente</th><th className="p-2">Descrição</th><th className="p-2">Previsão</th><th className="p-2">Peças</th><th className="p-2">Ações</th></tr>
          </thead>
          <tbody>
            {items.map((s:any) => (
              <tr key={s.id} className={`border-b align-top ${s.concluido ? 'bg-green-50' : ''}`}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {s.concluido && <span className="text-green-600 font-bold">✅</span>}
                    {s.cliente}
                  </div>
                </td>
                <td className="p-2">{s.descricao_servico}</td>
                <td className="p-2">
                  {new Date(s.data_previsao_preparo).toLocaleDateString('pt-BR')}
                  {s.concluido && s.data_conclusao && (
                    <div className="text-xs text-green-600 font-semibold mt-1">
                      Concluído: {new Date(s.data_conclusao).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <button className="text-blue-600 hover:underline" onClick={() => toggleExpanded(s.id)}>
                    {s.pecas?.length} peça(s)
                  </button>
                  {s.concluido && (
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      {s.tempo_preparo_segundos > 0 && (
                        <div>🔧 Preparo: {Math.floor(s.tempo_preparo_segundos / 3600)}h {Math.floor((s.tempo_preparo_segundos % 3600) / 60)}min</div>
                      )}
                      {s.tempo_total_producao_segundos && (
                        <div>⏱️ Produção: {Math.floor(s.tempo_total_producao_segundos / 3600)}h {Math.floor((s.tempo_total_producao_segundos % 3600) / 60)}min</div>
                      )}
                      {s.valor_refugo !== null && s.valor_refugo !== undefined && (
                        <div className="text-red-600 font-semibold">♻️ Refugo: R$ {s.valor_refugo.toFixed(2)}</div>
                      )}
                      {(s.tempo_preparo_segundos || s.tempo_total_producao_segundos) && (
                        <div className="font-semibold text-green-700">
                          📊 Total: {Math.floor((s.tempo_preparo_segundos + s.tempo_total_producao_segundos) / 3600)}h {Math.floor(((s.tempo_preparo_segundos + s.tempo_total_producao_segundos) % 3600) / 60)}min
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-2"><Button className="bg-red-600" onClick={() => remove(s.id)}>Excluir</Button></td>
              </tr>
              
            ))}
            {items.map((s:any) => 
              expandedService === s.id && (
                <tr key={`${s.id}-detail`} className="bg-slate-50 border-b">
                  <td colSpan={5} className="p-3">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Detalhes das Peças</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left border-b"><th className="p-1">Nome</th><th className="p-1">Qtd</th><th className="p-1">Tipo Metal</th><th className="p-1">Marca Material</th><th className="p-1">Valor Matéria-Prima</th></tr>
                            </thead>
                            <tbody>
                              {s.pecas?.map((pc:any) => (
                                <tr key={pc.id} className="border-b">
                                  <td className="p-1">{pc.nome}</td>
                                  <td className="p-1">{pc.quantidade_prevista}</td>
                                  <td className="p-1">{pc.tipo_metal}</td>
                                  <td className="p-1">{pc.marca_material}</td>
                                  <td className="p-1">{pc.valor_materia_prima ? `R$ ${pc.valor_materia_prima.toFixed(2)}` : '-'}</td>
                                </tr>
                              ))}
                              {s.pecas?.some((pc:any) => pc.valor_materia_prima) && (
                                <tr className="font-bold bg-blue-50">
                                  <td colSpan={4} className="p-1 text-right">Total das Peças:</td>
                                  <td className="p-1">
                                    R$ {s.pecas
                                      .reduce((sum:number, pc:any) => sum + (pc.valor_materia_prima || 0), 0)
                                      .toFixed(2)}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Matérias-Primas</h3>
                          <Button 
                            type="button" 
                            onClick={() => setShowAddMaterial(showAddMaterial === s.id ? null : s.id)}
                            className="text-xs py-1 px-2"
                          >
                            {showAddMaterial === s.id ? 'Cancelar' : '+ Adicionar'}
                          </Button>
                        </div>

                        {showAddMaterial === s.id && (
                          <div className="mb-3 p-3 bg-white rounded border">
                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={selectedMaterial}
                                onChange={(e) => setSelectedMaterial(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              >
                                <option value="">Selecione...</option>
                                {rawMaterials.map((rm) => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.nome} - R$ {rm.valor.toFixed(2)}
                                  </option>
                                ))}
                              </select>
                              <Input
                                type="number"
                                min="1"
                                value={materialQuantity}
                                onChange={(e) => setMaterialQuantity(e.target.value)}
                                placeholder="Quantidade"
                                className="text-sm"
                              />
                              <Button
                                type="button"
                                onClick={() => addMaterialToService(s.id)}
                                className="text-xs"
                              >
                                Adicionar
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="overflow-x-auto">
                          {serviceRawMaterials[s.id]?.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="p-1">Nome</th>
                                  <th className="p-1">Valor Unit.</th>
                                  <th className="p-1">Qtd</th>
                                  <th className="p-1">Total</th>
                                  <th className="p-1">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {serviceRawMaterials[s.id].map((srm:any) => (
                                  <tr key={srm.id} className="border-b">
                                    <td className="p-1">{srm.rawMaterial.nome}</td>
                                    <td className="p-1">R$ {srm.rawMaterial.valor.toFixed(2)}</td>
                                    <td className="p-1">{srm.quantidade}</td>
                                    <td className="p-1 font-semibold">R$ {(srm.rawMaterial.valor * srm.quantidade).toFixed(2)}</td>
                                    <td className="p-1">
                                      <button
                                        onClick={() => removeMaterialFromService(s.id, srm.rawMaterialId)}
                                        className="text-red-600 hover:underline"
                                      >
                                        Remover
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-bold bg-slate-100">
                                  <td colSpan={3} className="p-1 text-right">Total:</td>
                                  <td className="p-1">
                                    R$ {serviceRawMaterials[s.id]
                                      .reduce((sum:number, srm:any) => sum + (srm.rawMaterial.valor * srm.quantidade), 0)
                                      .toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-gray-500 py-2">Nenhuma matéria-prima vinculada</p>
                          )}
                        </div>
                      </div>

                      {/* Seção de Refugo */}
                      {s.valor_refugo !== null && s.valor_refugo !== undefined && (
                        <div>
                          <h3 className="font-semibold mb-2 text-red-700">♻️ Refugo</h3>
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-lg font-bold text-red-800">
                              Valor do Refugo: R$ {s.valor_refugo.toFixed(2)}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Material desperdiçado/refugado durante a produção
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
