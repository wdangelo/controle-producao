import { prisma } from './prisma'

export async function auditLog(params: {
  actorUserId?: string | null
  action: string
  entity: string
  entityId?: string | null
  before?: any
  after?: any
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        before: params.before ? JSON.stringify(params.before) : null,
        after: params.after ? JSON.stringify(params.after) : null,
      }
    })
  } catch (e) {
    console.error('auditLog error', e)
  }
}
