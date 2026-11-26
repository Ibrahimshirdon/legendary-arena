const MAX_FILE_SIZE = 15 * 1024 * 1024

/**
 * Resizes an image in the browser and returns it as a base64 data URL —
 * stored directly in a text column (avatarUrl / bannerUrl), no file storage
 * service needed. Kept compact on purpose: these are embedded directly in
 * rows that get polled repeatedly, so size directly affects bandwidth.
 */
async function resizeToDataUrl(file: File, maxDimension: number, quality: number): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('That image is too large. Please choose a photo under 15MB.')
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

export async function uploadAvatar(_ownerId: string, file: File): Promise<string> {
  return resizeToDataUrl(file, 128, 0.7)
}

/** Wider than an avatar (rooms show this as a banner), but still compressed —
 * polled every few seconds via /api/rooms for every connected client. */
export async function uploadRoomImage(file: File): Promise<string> {
  return resizeToDataUrl(file, 480, 0.6)
}

/** Chat messages poll every 3s and the endpoint returns the last 200 of them,
 * images included — kept small and compressed so that stays affordable. */
export async function uploadChatImage(file: File): Promise<string> {
  return resizeToDataUrl(file, 560, 0.45)
}

export function dicebearAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=14191f`
}
