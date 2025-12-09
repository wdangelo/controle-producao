import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function OperadorIndex() {
  const operadores = await prisma.operator.findMany({ orderBy: { nome: 'asc' } })
  return (
    <div className="container py-6">
      <h1 className="text-xl font-semibold mb-4">Selecione o Operador</h1>
      {operadores.length === 0 ? (
        <p className="text-slate-600">Nenhum operador cadastrado ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {operadores.map((op) => (
            <li key={op.id}>
              <Link className="block p-3 border rounded hover:bg-slate-50 text-center" href={`/operador/${op.id}`}>
                <div className="font-medium">{op.nome}</div>
                <div className="text-sm text-slate-500">{op.codigo}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
