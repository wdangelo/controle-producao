import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

// GET - Buscar matéria-prima por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: params.id },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                cliente: true,
                descricao_servico: true
              }
            }
          }
        }
      }
    });

    if (!rawMaterial) {
      return NextResponse.json({ error: 'Matéria-prima não encontrada' }, { status: 404 });
    }

    return NextResponse.json(rawMaterial);
  } catch (error: any) {
    console.error('Erro ao buscar matéria-prima:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar matéria-prima', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar matéria-prima
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nome, valor } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    if (typeof valor !== 'number' || valor < 0) {
      return NextResponse.json({ error: 'Valor deve ser um número positivo' }, { status: 400 });
    }

    const existingRawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: params.id }
    });

    if (!existingRawMaterial) {
      return NextResponse.json({ error: 'Matéria-prima não encontrada' }, { status: 404 });
    }

    const rawMaterial = await prisma.rawMaterial.update({
      where: { id: params.id },
      data: {
        nome: nome.trim(),
        valor
      }
    });

    await auditLog({
      action: 'UPDATE',
      entity: 'RawMaterial',
      entityId: rawMaterial.id,
      before: existingRawMaterial,
      after: rawMaterial
    });

    return NextResponse.json(rawMaterial);
  } catch (error: any) {
    console.error('Erro ao atualizar matéria-prima:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar matéria-prima', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Excluir matéria-prima
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingRawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: params.id }
    });

    if (!existingRawMaterial) {
      return NextResponse.json({ error: 'Matéria-prima não encontrada' }, { status: 404 });
    }

    await prisma.rawMaterial.delete({
      where: { id: params.id }
    });

    await auditLog({
      action: 'DELETE',
      entity: 'RawMaterial',
      entityId: params.id,
      before: existingRawMaterial
    });

    return NextResponse.json({ message: 'Matéria-prima excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir matéria-prima:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir matéria-prima', details: error.message },
      { status: 500 }
    );
  }
}
