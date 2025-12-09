import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="bg-white border-b md:border-r md:border-b-0">
        <div className="p-4 font-semibold border-b">Dashboard</div>
        <nav className="p-2 space-y-1">
          <Link className="block px-4 py-2 hover:bg-slate-100 rounded" href="/dashboard">Visão Geral</Link>
          <Link className="block px-4 py-2 hover:bg-slate-100 rounded" href="/dashboard/users">Usuários</Link>
          <Link className="block px-4 py-2 hover:bg-slate-100 rounded" href="/dashboard/operators">Operadores</Link>
          <Link className="block px-4 py-2 hover:bg-slate-100 rounded" href="/dashboard/services">Serviços</Link>
          <Link className="block px-4 py-2 hover:bg-slate-100 rounded" href="/dashboard/metrics">Acompanhamento</Link>
        </nav>
        <div className="p-2 border-t">
          <a href="/api/auth/logout" className="block px-4 py-2 text-red-600 hover:bg-red-50 rounded">Sair</a>
        </div>
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  )
}
