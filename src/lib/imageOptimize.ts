const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82
const JPEG_QUALITY = 0.85

const ACCEPTED = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

export function isAcceptedImageType(type: string): boolean {
  return ACCEPTED.has(type.toLowerCase())
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  preferWebp: boolean,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tryWebp = preferWebp ? 'image/webp' : 'image/jpeg'
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression failed'))
          return
        }
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      },
      tryWebp,
      preferWebp ? WEBP_QUALITY : JPEG_QUALITY,
    )
  })
}

/** Resize and compress screenshot evidence for local storage. */
export async function optimizeImageFile(file: File): Promise<string> {
  if (!isAcceptedImageType(file.type)) {
    throw new Error('Unsupported image type')
  }
  const raw = await readFileAsDataUrl(file)
  const img = await loadImage(raw)

  let { width, height } = img
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, width, height)

  const supportsWebp =
    canvas.toDataURL('image/webp').startsWith('data:image/webp')
  try {
    return await canvasToDataUrl(canvas, supportsWebp)
  } catch {
    return await canvasToDataUrl(canvas, false)
  }
}

export async function optimizeImageFiles(files: File[]): Promise<string[]> {
  const results: string[] = []
  for (const file of files) {
    if (!isAcceptedImageType(file.type)) continue
    results.push(await optimizeImageFile(file))
  }
  return results
}
