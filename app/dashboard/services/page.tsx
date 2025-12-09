'use client'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ServicesPage() {
  const [items, setItems] = useState<any[]>([])
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [form, setForm] = useState({
    cliente: '', descricao_servico: '', observacoes: '', data_previsao_preparo: new Date().toISOString().split('T')[0],
    pecas: [{ nome: '', quantidade_prevista: 0, tipo_metal: '', marca_material: '' }]
  })

  const load = async () => {
    const res = await fetch('/api/services')
    setItems(await res.json())
  }
  useEffect(() => { load() }, [])

  const addPeca = () => setForm({ ...form, pecas: [...form.pecas, { nome: '', quantidade_prevista: 0, tipo_metal: '', marca_material: '' }] })
  const updatePeca = (i: number, field: string, value: any) => {
    const copy = [...form.pecas]
    ;(copy[i] as any)[field] = field === 'quantidade_prevista' ? Number(value) : value
    setForm({ ...form, pecas: copy })
  }
  const removePeca = (i: number) => setForm({ ...form, pecas: form.pecas.filter((_, idx) => idx !== i) })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/services', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } })
    setForm({ cliente: '', descricao_servico: '', observacoes: '', data_previsao_preparo: new Date().toISOString().split('T')[0], pecas: [{ nome: '', quantidade_prevista: 0, tipo_metal: '', marca_material: '' }] })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    await load()
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
            <div key={i} className="grid md:grid-cols-5 gap-2 items-center">
              <Input placeholder="Nome da peça" value={p.nome} onChange={e => updatePeca(i, 'nome', e.target.value)} />
              <Input placeholder="Qtd prevista" type="number" value={p.quantidade_prevista} onChange={e => updatePeca(i, 'quantidade_prevista', e.target.value)} />
              <Input placeholder="Tipo do metal" value={p.tipo_metal} onChange={e => updatePeca(i, 'tipo_metal', e.target.value)} />
              <Input placeholder="Marca do material" value={p.marca_material} onChange={e => updatePeca(i, 'marca_material', e.target.value)} />
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
              <tr key={s.id} className="border-b align-top">
                <td className="p-2">{s.cliente}</td>
                <td className="p-2">{s.descricao_servico}</td>
                <td className="p-2">{new Date(s.data_previsao_preparo).toLocaleDateString('pt-BR')}</td>
                <td className="p-2">
                  <button className="text-blue-600 hover:underline" onClick={() => setExpandedService(expandedService === s.id ? null : s.id)}>
                    {s.pecas?.length} peça(s)
                  </button>
                </td>
                <td className="p-2"><Button className="bg-red-600" onClick={() => remove(s.id)}>Excluir</Button></td>
              </tr>
              
            ))}
            {items.map((s:any) => 
              expandedService === s.id && (
                <tr key={`${s.id}-detail`} className="bg-slate-50 border-b">
                  <td colSpan={5} className="p-3">
                    <h3 className="font-semibold mb-2">Detalhes das Peças</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left border-b"><th className="p-1">Nome</th><th className="p-1">Qtd</th><th className="p-1">Tipo Metal</th><th className="p-1">Marca Material</th></tr>
                        </thead>
                        <tbody>
                          {s.pecas?.map((pc:any) => (
                            <tr key={pc.id} className="border-b">
                              <td className="p-1">{pc.nome}</td>
                              <td className="p-1">{pc.quantidade_prevista}</td>
                              <td className="p-1">{pc.tipo_metal}</td>
                              <td className="p-1">{pc.marca_material}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
