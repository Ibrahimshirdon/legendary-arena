import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

export const app = initializeApp(
  firebaseConfigured
    ? firebaseConfig
    : {
        apiKey: 'demo-api-key',
        authDomain: 'demo.firebaseapp.com',
        projectId: 'demo-project',
        storageBucket: 'demo-project.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:0000000000000000000000',
      },
)

// Firebase here is Authentication only. Every other piece of data — including
// avatar images, stored as compact data URLs — lives in Neon Postgres via the
// API in src/lib/api.ts. See server/.
export const auth = getAuth(app)
