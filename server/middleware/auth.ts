import type { NextFunction, Request, Response } from 'express'
import { adminAuth } from '../firebaseAdmin'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      uid?: string
      emailVerified?: boolean
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }
  const token = header.slice('Bearer '.length)
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    req.uid = decoded.uid
    req.emailVerified = Boolean(decoded.email_verified)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
