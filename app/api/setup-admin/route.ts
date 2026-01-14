import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// ROTA TEMPORÁRIA - DELETE APÓS CRIAR O ADMIN
async function createAdmin() {
  try {
    // Verificar se já existe admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin já existe!',
        email: 'admin@example.com',
        password: 'admin123'
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
      password: 'admin123',
      warning: 'DELETE esta rota após usar: app/api/setup-admin/route.ts'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro ao criar admin',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return createAdmin()
}

export async function POST() {
  return createAdmin()
}
