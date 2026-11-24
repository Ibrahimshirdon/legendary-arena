import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!raw) {
  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Copy server/.env.example to server/.env and paste your service account JSON.',
  )
}

const serviceAccount = JSON.parse(raw)

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) })
}

export const adminAuth = getAuth()
