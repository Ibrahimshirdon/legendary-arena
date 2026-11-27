import { eq } from 'drizzle-orm'
// v4 of web-push is ESM-only with named exports — no default export.
import { sendNotification, setVapidDetails } from 'web-push'
import { db } from './db/client'
import { pushSubscriptions } from './db/schema'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@legendary-arena.app'

if (publicKey && privateKey) {
  setVapidDetails(subject, publicKey, privateKey)
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!publicKey || !privateKey) return

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  if (subs.length === 0) return

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      } catch (err) {
        // 404/410 means the browser revoked this subscription — stop trying it.
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint))
        }
      }
    }),
  )
}
