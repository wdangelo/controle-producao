"use client";
import { useEffect, useState } from "react";

type User = { id: string; email: string; name: string | null; role: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ email: string; name: string; password: string; role: string }>({ email: "", name: "", password: "", role: "ADMIN" });
  const [editing, setEditing] = useState<User | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ email: "", name: "", password: "", role: "ADMIN" }); load(); }
  };

  const update = async () => {
    if (!editing) return;
    const res = await fetch(`/api/users/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: editing.email, name: editing.name, role: editing.role }) });
    if (res.ok) { setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Usuários</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">Cadastrar</h2>
          <div className="space-y-2">
            <input className="w-full border rounded px-3 py-2" placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} />
            <input className="w-full border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
            <input className="w-full border rounded px-3 py-2" placeholder="Senha" type="password" value={form.password} onChange={e=>setForm(f=>({...f, password: e.target.value}))} />
            <select className="w-full border rounded px-3 py-2" value={form.role} onChange={e=>setForm(f=>({...f, role: e.target.value}))}>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={create}>Salvar</button>
          </div>
        </div>
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">Lista</h2>
          {loading ? <p>Carregando...</p> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b"><th className="py-2">Nome</th><th>Email</th><th>Perfil</th><th></th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td className="space-x-2">
                      <button className="text-blue-600" onClick={()=>setEditing(u)}>Editar</button>
                      <button className="text-red-600" onClick={()=>remove(u.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-6 bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">Editar Usuário</h2>
          <div className="space-y-2">
            <input className="w-full border rounded px-3 py-2" placeholder="Nome" value={editing.name ?? ""} onChange={e=>setEditing(prev=>prev?{...prev, name: e.target.value}:prev)} />
            <input className="w-full border rounded px-3 py-2" placeholder="Email" value={editing.email} onChange={e=>setEditing(prev=>prev?{...prev, email: e.target.value}:prev)} />
            <select className="w-full border rounded px-3 py-2" value={editing.role} onChange={e=>setEditing(prev=>prev?{...prev, role: e.target.value}:prev)}>
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
            <div className="space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={update}>Salvar</button>
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
