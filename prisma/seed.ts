import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Criar usuário admin padrão
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@example.com',
      senha: hashedPassword
    }
  })
  console.log('✅ Admin criado:', admin.email)

  // Criar operadores de exemplo
  const op1 = await prisma.operator.upsert({
    where: { codigo: '1001' },
    update: {},
    create: { nome: 'João Silva', codigo: '1001' }
  })
  const op2 = await prisma.operator.upsert({
    where: { codigo: '1002' },
    update: {},
    create: { nome: 'Maria Santos', codigo: '1002' }
  })
  console.log('✅ Operadores criados:', op1.nome, op2.nome)

  // Criar serviços de exemplo com peças
  const service1 = await prisma.service.upsert({
    where: { id: 'service-001' },
    update: {},
    create: {
      id: 'service-001',
      cliente: 'Indústria Metalúrgica XYZ',
      descricao_servico: 'Fundição de peças em alumínio',
      observacoes: 'Qualidade premium, sem defeitos',
      data_previsao_preparo: new Date('2025-12-20'),
      ativo: true,
      pecas: {
        create: [
          { nome: 'Peça A1', quantidade_prevista: 100, tipo_metal: 'Alumínio', marca_material: 'Alcoa' },
          { nome: 'Peça A2', quantidade_prevista: 50, tipo_metal: 'Alumínio', marca_material: 'Alcan' }
        ]
      }
    },
    include: { pecas: true }
  })

  const service2 = await prisma.service.upsert({
    where: { id: 'service-002' },
    update: {},
    create: {
      id: 'service-002',
      cliente: 'Empresa de Engenharia ABC',
      descricao_servico: 'Fundição de peças em ferro cinzento',
      observacoes: 'Pintura obrigatória após fundição',
      data_previsao_preparo: new Date('2025-12-18'),
      ativo: true,
      pecas: {
        create: [
          { nome: 'Cilindro C1', quantidade_prevista: 200, tipo_metal: 'Ferro Cinzento', marca_material: 'Gerdau' },
          { nome: 'Base B1', quantidade_prevista: 150, tipo_metal: 'Ferro Cinzento', marca_material: 'CSN' }
        ]
      }
    },
    include: { pecas: true }
  })

  console.log('✅ Serviços criados:', service1.id, service2.id)
  console.log('   - Serviço 1:', service1.pecas.length, 'peças')
  console.log('   - Serviço 2:', service2.pecas.length, 'peças')

  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
