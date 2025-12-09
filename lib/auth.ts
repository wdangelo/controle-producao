import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signJwt(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload as any, JWT_SECRET, { expiresIn: '12h', ...(options || {}) })
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}
