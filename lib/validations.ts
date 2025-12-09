import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const userSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6)
})

export const operatorSchema = z.object({
  nome: z.string().min(2),
  codigo_operador: z.string().regex(/^\d{4}$/)
})

export const pieceSchema = z.object({
  nome: z.string().min(1),
  quantidade_prevista: z.number().int().nonnegative(),
  tipo_metal: z.string().min(1),
  marca_material: z.string().min(1)
})

export const serviceSchema = z.object({
  cliente: z.string().min(1),
  descricao_servico: z.string().min(1),
  observacoes: z.string().optional().nullable(),
  data_previsao_preparo: z.string(),
  pecas: z.array(pieceSchema).default([])
})
