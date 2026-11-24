import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: 'server/.env' })

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
