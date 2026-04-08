const SINGLE_LIMIT = 3 * 1024 * 1024   // 3 MB — via Vercel API route
const PART_SIZE   = 6 * 1024 * 1024   // 6 MB per part — direct to R2 (min 5 MB required)

export async function uploadToR2(file: File, folder: string): Promise<string> {
  if (file.size <= SINGLE_LIMIT) {
    return uploadSingle(file, folder)
  }
  return uploadMultipart(file, folder)
}

// Small files: POST through our Vercel API route
async function uploadSingle(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.url
}

// Large files: multipart upload — parts go directly from browser to R2
async function uploadMultipart(file: File, folder: string): Promise<string> {
  // 1. Init
  const initRes = await fetch('/api/admin/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  })
  if (!initRes.ok) {
    const body = await initRes.json().catch(() => ({}))
    throw new Error(body.error || `Falha ao iniciar upload (HTTP ${initRes.status})`)
  }
  const { uploadId, key } = await initRes.json()

  // 2. Upload each part via server proxy (avoids CORS/AccessDenied on direct R2 PUT)
  const totalParts = Math.ceil(file.size / PART_SIZE)
  const parts: { partNumber: number; etag: string }[] = []

  for (let i = 0; i < totalParts; i++) {
    const start = i * PART_SIZE
    const end = Math.min(start + PART_SIZE, file.size)
    const chunk = file.slice(start, end)
    const partNumber = i + 1

    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('key', key)
    formData.append('uploadId', uploadId)
    formData.append('partNumber', String(partNumber))

    const partRes = await fetch('/api/admin/upload/part', { method: 'POST', body: formData })
    if (!partRes.ok) {
      const body = await partRes.json().catch(() => ({}))
      throw new Error(body.error || `Falha ao enviar parte ${partNumber}`)
    }
    const { etag } = await partRes.json()
    parts.push({ partNumber, etag })
  }

  // 3. Complete
  const completeRes = await fetch('/api/admin/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, parts }),
  })
  if (!completeRes.ok) {
    const body = await completeRes.json().catch(() => ({}))
    throw new Error(body.error || `Falha ao finalizar upload (HTTP ${completeRes.status})`)
  }
  const { url } = await completeRes.json()
  return url
}

