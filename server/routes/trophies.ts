import { Router } from 'express'
import { db } from '../db/client'
import { trophies } from '../db/schema'
import { requireAuth } from '../middleware/auth'

export const trophiesRouter = Router()
trophiesRouter.use(requireAuth)

trophiesRouter.get('/', async (_req, res) => {
  res.json(await db.select().from(trophies))
})
