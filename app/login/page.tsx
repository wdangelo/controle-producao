export default function LoginPage() {
  return (
    <main className="container py-10 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center">Login - Dashboard</h1>
      {/* Formulário nativo para garantir que o cookie HttpOnly seja persistido e o redirect seja seguido pelo navegador */}
      <form method="POST" action="/api/auth/login" className="space-y-4">
        <input className="w-full border rounded px-3 py-2" name="email" type="email" placeholder="Email" required />
        <input className="w-full border rounded px-3 py-2" name="password" type="password" placeholder="Senha" required />
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded" type="submit">Entrar</button>
      </form>
    </main>
  )
}
