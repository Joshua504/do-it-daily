import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt'
import { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

export interface AuthRequest extends Request {
  userId?: string
  token?: string
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Middleware to verify JWT token
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.userId = decoded.userId
  req.token = token
  next()
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  const crypto = require('crypto')
  return `pk_${crypto.randomBytes(32).toString('hex')}`
}

/**
 * Hash API key for storage
 */
export async function hashApiKey(key: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(key, salt)
}

/**
 * Compare API key
 */
export async function compareApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}
