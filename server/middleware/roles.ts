import { eq } from 'drizzle-orm'
import type { NextFunction, Request, Response } from 'express'
import { db } from '../db/client'
import { users } from '../db/schema'

declare global {
  namespace Express {
    interface Request {
      profile?: typeof users.$inferSelect
    }
  }
}

export async function attachProfile(req: Request, res: Response, next: NextFunction) {
  if (!req.uid) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  const [profile] = await db.select().from(users).where(eq(users.id, req.uid)).limit(1)
  req.profile = profile
  next()
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  if (!req.profile || req.profile.status !== 'approved') {
    res.status(403).json({ error: 'Account not approved' })
    return
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.profile || req.profile.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' })
    return
  }
  next()
}
