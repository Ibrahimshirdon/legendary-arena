import { config } from 'dotenv'

// Imported first (and only) for its side effect, so every other module's
// top-level `process.env.X` reads see these values already loaded.
config({ path: 'server/.env' })
