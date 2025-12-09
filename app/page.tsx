import Link from 'next/link'

export default function HomePage() {
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
      </div>
    </main>
  )
}
