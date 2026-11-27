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
  if (!publicKey || !privateKey) {
    console.warn('[push] Skipped: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set')
    return
  }

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  if (subs.length === 0) {
    console.log(`[push] No subscriptions for user ${userId} — nothing to send`)
    return
  }

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        console.log(`[push] Sent to ${userId} (${sub.endpoint.slice(0, 60)}...)`)
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        console.error(`[push] Failed for ${userId} (status ${status ?? 'n/a'}):`, (err as Error).message ?? err)
        // 404/410 means the browser revoked this subscription — stop trying it.
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint))
        }
      }
    }),
  )
}
