import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// ROTA TEMPORÁRIA - DELETE APÓS CRIAR O ADMIN
export async function POST() {
  try {
    // Verificar se já existe admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin já existe!',
        email: 'admin@example.com' 
      })
    }

    // Criar admin
    const hashedPassword = await hashPassword('admin123')
    const admin = await prisma.user.create({
      data: {
        nome: 'Administrador',
        email: 'admin@example.com',
        senha: hashedPassword
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Admin criado com sucesso!',
      email: admin.email,
      warning: 'DELETE esta rota após usar: app/api/setup-admin/route.ts'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao criar admin',
      details: error.message 
    }, { status: 500 })
  }
}
