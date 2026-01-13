'use client'
import { useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'

export default function OperatorsPage() {
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ nome: '', codigo_operador: '' })

  const load = async () => {
    const res = await fetch('/api/operators')
    setItems(await res.json())
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/operators', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } })
    setForm({ nome: '', codigo_operador: '' })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/operators/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Operadores</h1>
      <form onSubmit={submit} className="grid md:grid-cols-3 gap-3">
        <Input placeholder="Nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
        <Input placeholder="Código (4 dígitos)" value={form.codigo_operador} onChange={e => setForm({ ...form, codigo_operador: e.target.value })} />
        <Button type="submit">Adicionar</Button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b"><th className="p-2">Nome</th><th className="p-2">Código</th><th className="p-2">Ações</th></tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u.id} className="border-b">
                <td className="p-2">{u.nome}</td>
                <td className="p-2">{u.codigo}</td>
                <td className="p-2"><Button className="bg-red-600" onClick={() => remove(u.id)}>Excluir</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
