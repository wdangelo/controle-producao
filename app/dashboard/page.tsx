'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    users: 0,
    operators: 0,
    services: 0,
    totalProduced: 0
  })

  useEffect(() => {
    const load = async () => {
      const [users, ops, services] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/operators').then(r => r.json()),
        fetch('/api/services').then(r => r.json())
      ])
      
      setStats({
        users: users.length || 0,
        operators: ops.length || 0,
        services: services.length || 0,
        totalProduced: 0
      })
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">🏭 Controle de Produção</h1>
        <p className="text-slate-600">Sistema de Acompanhamento para Máquinas de Fundição</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-blue-700 font-semibold">Usuários</p>
              <p className="text-3xl font-bold text-blue-900">{stats.users}</p>
            </div>
            <span className="text-2xl">👤</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-green-700 font-semibold">Operadores</p>
              <p className="text-3xl font-bold text-green-900">{stats.operators}</p>
            </div>
            <span className="text-2xl">👷</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-purple-700 font-semibold">Serviços</p>
              <p className="text-3xl font-bold text-purple-900">{stats.services}</p>
            </div>
            <span className="text-2xl">🔧</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-orange-700 font-semibold">Acompanhamento</p>
              <p className="text-3xl font-bold text-orange-900">📊</p>
            </div>
            <span className="text-2xl">📈</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg p-6 border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Link href="/dashboard/users" className="block p-3 border rounded hover:bg-slate-50 transition">
            <p className="font-semibold text-slate-900">👥 Gerenciar Usuários</p>
            <p className="text-sm text-slate-600">Adicionar, editar ou remover usuários do sistema</p>
          </Link>
          
          <Link href="/dashboard/operators" className="block p-3 border rounded hover:bg-slate-50 transition">
            <p className="font-semibold text-slate-900">👷 Gerenciar Operadores</p>
            <p className="text-sm text-slate-600">Controlar operadores disponíveis para produção</p>
          </Link>

          <Link href="/dashboard/services" className="block p-3 border rounded hover:bg-slate-50 transition">
            <p className="font-semibold text-slate-900">🔧 Serviços e Peças</p>
            <p className="text-sm text-slate-600">Cadastrar serviços, peças, materiais e quantidades</p>
          </Link>

          <Link href="/dashboard/metrics" className="block p-3 border rounded hover:bg-slate-50 transition">
            <p className="font-semibold text-slate-900">📊 Acompanhamento</p>
            <p className="text-sm text-slate-600">Visualizar produção em tempo real por operador</p>
          </Link>
        </div>
      </div>

      {/* System Features */}
      <div className="bg-white rounded-lg p-6 border shadow-sm">
        <h2 className="text-lg font-semibold mb-4">✨ Recursos do Sistema</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <p className="font-semibold">Autenticação Segura</p>
              <p className="text-slate-600">JWT com cookies HttpOnly</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="font-semibold">Sincronização em Tempo Real</p>
              <p className="text-slate-600">Polling a cada 1 segundo</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">💾</span>
            <div>
              <p className="font-semibold">Persistência de Sessão</p>
              <p className="text-slate-600">Retomar trabalho do ponto anterior</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-semibold">Relatórios em Tempo Real</p>
              <p className="text-slate-600">Acompanhamento por operador</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🐳</span>
            <div>
              <p className="font-semibold">Containerização</p>
              <p className="text-slate-600">Docker Compose ready</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="font-semibold">Responsivo</p>
              <p className="text-slate-600">Desktop e tablet ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
