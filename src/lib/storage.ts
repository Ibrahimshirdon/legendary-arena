// Kept small on purpose: avatars are embedded as data URLs in every user row,
// and the players list is polled repeatedly, so size directly affects bandwidth.
const MAX_DIMENSION = 128
const JPEG_QUALITY = 0.7

/**
 * Resizes an image in the browser and returns it as a small base64 data URL,
 * stored directly in the `avatarUrl` text column — no file storage service needed.
 */
export async function uploadAvatar(_ownerId: string, file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('That image is too large. Please choose a photo under 15MB.')
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export function dicebearAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=14191f`
}
