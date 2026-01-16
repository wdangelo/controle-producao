'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const createAdmin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup-admin', { method: 'POST' })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult('Erro: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <main className="container py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold">Controle de Produção</h1>
        <p className="text-slate-600 max-w-2xl">
          Sistema para controle de produção de máquinas de fundição. Acesse o dashboard administrativo
          para gerenciar usuários, operadores e serviços, ou utilize a área do operador para registrar a produção.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 bg-primary text-white rounded">Login - Dashboard</Link>
          <Link href="/operador" className="px-4 py-2 border rounded">Área do Operador</Link>
        </div>
        
        {/* TEMPORÁRIO - REMOVER DEPOIS */}
        <div className="mt-8 p-4 border border-yellow-500 rounded bg-yellow-50">
          <p className="text-sm text-yellow-800 mb-2">🔧 Setup Temporário</p>
          <button 
            onClick={createAdmin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Admin (admin@example.com / admin123)'}
          </button>
          {result && (
            <pre className="mt-2 p-2 bg-white border rounded text-left text-xs overflow-auto max-w-md">
              {result}
            </pre>
          )}
        </div>
      </div>
    </main>
  )
}
