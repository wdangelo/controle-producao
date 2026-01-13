import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

// GET - Listar matérias-primas
export async function GET(request: NextRequest) {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });

    return NextResponse.json(rawMaterials);
  } catch (error: any) {
    console.error('Erro ao buscar matérias-primas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar matérias-primas', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar matéria-prima
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, valor } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    if (typeof valor !== 'number' || valor < 0) {
      return NextResponse.json({ error: 'Valor deve ser um número positivo' }, { status: 400 });
    }

    const rawMaterial = await prisma.rawMaterial.create({
      data: {
        nome: nome.trim(),
        valor
      }
    });

    await auditLog({
      action: 'CREATE',
      entity: 'RawMaterial',
      entityId: rawMaterial.id,
      after: rawMaterial
    });

    return NextResponse.json(rawMaterial, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar matéria-prima:', error);
    return NextResponse.json(
      { error: 'Erro ao criar matéria-prima', details: error.message },
      { status: 500 }
    );
  }
}
