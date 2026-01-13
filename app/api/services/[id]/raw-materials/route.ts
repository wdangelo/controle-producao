import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';

// GET - Listar matérias-primas de um serviço
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        rawMaterials: {
          include: {
            rawMaterial: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    return NextResponse.json(service.rawMaterials);
  } catch (error: any) {
    console.error('Erro ao buscar matérias-primas do serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar matérias-primas do serviço', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Adicionar matéria-prima a um serviço
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { rawMaterialId, quantidade } = body;

    if (!rawMaterialId) {
      return NextResponse.json({ error: 'ID da matéria-prima é obrigatório' }, { status: 400 });
    }

    if (!quantidade || quantidade < 1) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
    }

    // Verificar se o serviço existe
    const service = await prisma.service.findUnique({
      where: { id: params.id }
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    // Verificar se a matéria-prima existe
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId }
    });

    if (!rawMaterial) {
      return NextResponse.json({ error: 'Matéria-prima não encontrada' }, { status: 404 });
    }

    // Verificar se já existe essa relação
    const existingRelation = await prisma.serviceRawMaterial.findFirst({
      where: {
        serviceId: params.id,
        rawMaterialId
      }
    });

    if (existingRelation) {
      // Atualizar quantidade
      const updated = await prisma.serviceRawMaterial.update({
        where: { id: existingRelation.id },
        data: { quantidade },
        include: {
          rawMaterial: true
        }
      });

      await auditLog({
        action: 'UPDATE',
        entity: 'ServiceRawMaterial',
        entityId: updated.id,
        before: existingRelation,
        after: updated
      });

      return NextResponse.json(updated);
    }

    // Criar nova relação
    const serviceRawMaterial = await prisma.serviceRawMaterial.create({
      data: {
        serviceId: params.id,
        rawMaterialId,
        quantidade
      },
      include: {
        rawMaterial: true
      }
    });

    await auditLog({
      action: 'CREATE',
      entity: 'ServiceRawMaterial',
      entityId: serviceRawMaterial.id,
      after: serviceRawMaterial
    });

    return NextResponse.json(serviceRawMaterial, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao adicionar matéria-prima ao serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar matéria-prima ao serviço', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remover matéria-prima de um serviço
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const rawMaterialId = searchParams.get('rawMaterialId');

    if (!rawMaterialId) {
      return NextResponse.json({ error: 'ID da matéria-prima é obrigatório' }, { status: 400 });
    }

    const relation = await prisma.serviceRawMaterial.findFirst({
      where: {
        serviceId: params.id,
        rawMaterialId
      }
    });

    if (!relation) {
      return NextResponse.json({ error: 'Relação não encontrada' }, { status: 404 });
    }

    await prisma.serviceRawMaterial.delete({
      where: { id: relation.id }
    });

    await auditLog({
      action: 'DELETE',
      entity: 'ServiceRawMaterial',
      entityId: relation.id,
      before: relation
    });

    return NextResponse.json({ message: 'Matéria-prima removida do serviço com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover matéria-prima do serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao remover matéria-prima do serviço', details: error.message },
      { status: 500 }
    );
  }
}
