import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function OperatorServices({ params }: { params: { operatorId: string } }) {
  const operator = await prisma.operator.findUnique({ where: { id: params.operatorId } })
  const services = await prisma.service.findMany({ where: { ativo: true }, include: { pecas: true }, orderBy: { createdAt: 'desc' } })
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo, {operator?.nome}</h1>
            <p className="text-slate-600">Toque em um serviço para iniciar a produção.</p>
          </div>
          <Link href="/operador" className="px-4 py-2 border rounded hover:bg-slate-100 active:scale-95 transition">← Voltar</Link>
        </div>

        {services.length === 0 ? (
          <p className="text-slate-600">Nenhum serviço ativo.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/operador/${params.operatorId}/${s.id}`}
                className="block p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg active:scale-95 transition duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <h2 className="font-bold text-xl text-slate-900">{s.cliente}</h2>
                    <p className="text-slate-700 text-sm">{s.descricao_servico}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">{s.pecas?.length} peça(s)</span>
                </div>

                {s.observacoes && (
                  <p className="text-sm text-slate-600 mb-3">📝 {s.observacoes}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="bg-slate-100 px-2 py-1 rounded">📅 Previsão: {s.data_previsao_entrega ? new Date(s.data_previsao_entrega).toLocaleDateString('pt-BR') : '—'}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded">⚙️ Status: Ativo</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
