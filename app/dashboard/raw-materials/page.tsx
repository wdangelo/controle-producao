'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RawMaterial {
  id: string;
  nome: string;
  valor: number;
  _count?: {
    services: number;
  };
}

export default function RawMaterialsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    valor: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  async function fetchRawMaterials() {
    try {
      const response = await fetch('/api/raw-materials');
      if (response.ok) {
        const data = await response.json();
        setRawMaterials(data);
      }
    } catch (error) {
      console.error('Erro ao buscar matérias-primas:', error);
      alert('Erro ao buscar matérias-primas');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    const valor = parseFloat(formData.valor);
    if (!formData.valor || isNaN(valor) || valor < 0) {
      newErrors.valor = 'Valor deve ser um número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const url = editingId ? `/api/raw-materials/${editingId}` : '/api/raw-materials';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          valor: parseFloat(formData.valor)
        })
      });

      if (response.ok) {
        alert(editingId ? 'Matéria-prima atualizada com sucesso!' : 'Matéria-prima criada com sucesso!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ nome: '', valor: '' });
        setErrors({});
        fetchRawMaterials();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar matéria-prima');
      }
    } catch (error) {
      console.error('Erro ao salvar matéria-prima:', error);
      alert('Erro ao salvar matéria-prima');
    }
  }

  function handleEdit(rawMaterial: RawMaterial) {
    setEditingId(rawMaterial.id);
    setFormData({
      nome: rawMaterial.nome,
      valor: rawMaterial.valor.toString()
    });
    setShowForm(true);
    setErrors({});
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta matéria-prima?')) {
      return;
    }

    try {
      const response = await fetch(`/api/raw-materials/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Matéria-prima excluída com sucesso!');
        fetchRawMaterials();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir matéria-prima');
      }
    } catch (error) {
      console.error('Erro ao excluir matéria-prima:', error);
      alert('Erro ao excluir matéria-prima');
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: '', valor: '' });
    setErrors({});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Matérias-Primas</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Nova Matéria-Prima
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Chapa de Aço Inox"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
              />
              {errors.valor && (
                <p className="text-red-500 text-sm mt-1">{errors.valor}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold mb-4">Lista de Matérias-Primas</h2>
        {rawMaterials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma matéria-prima cadastrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviços
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {material.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        R$ {material.valor.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {material._count?.services || 0} serviço(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
