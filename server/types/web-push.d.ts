// web-push v4 ships no .d.ts and @types/web-push targets the old v3 API,
// so this declares just the bits of the real v4 (named-exports-only) API we use.
declare module 'web-push' {
  interface PushSubscriptionLike {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  export class WebPushError extends Error {
    statusCode: number
    headers: Record<string, string>
    body: string
    endpoint: string
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  export function sendNotification(
    subscription: PushSubscriptionLike,
    payload?: string | Buffer,
    options?: Record<string, unknown>,
  ): Promise<unknown>
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string }
}
