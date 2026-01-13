'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      // Redirect usando caminho relativo
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <main className="container py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center">Login - Dashboard</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        <input 
          className="w-full border rounded px-3 py-2" 
          name="email" 
          type="email" 
          placeholder="Email" 
          required 
          disabled={loading}
        />
        <input 
          className="w-full border rounded px-3 py-2" 
          name="password" 
          type="password" 
          placeholder="Senha" 
          required 
          disabled={loading}
        />
        <button 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
