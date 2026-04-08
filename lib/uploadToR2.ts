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

  // 2. Upload each part directly to R2 via presigned URL
  const totalParts = Math.ceil(file.size / PART_SIZE)
  const parts: { partNumber: number; etag: string }[] = []

  for (let i = 0; i < totalParts; i++) {
    const start = i * PART_SIZE
    const end = Math.min(start + PART_SIZE, file.size)
    const chunk = file.slice(start, end)
    const partNumber = i + 1

    // Get presigned URL for this part
    const urlRes = await fetch('/api/admin/upload/part-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId, partNumber }),
    })
    if (!urlRes.ok) {
      const body = await urlRes.json().catch(() => ({}))
      throw new Error(body.error || `Falha ao obter URL da parte ${partNumber}`)
    }
    const { signedUrl } = await urlRes.json()

    // PUT chunk directly to R2
    const etag = await uploadPartXHR(signedUrl, chunk)
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

function uploadPartXHR(signedUrl: string, chunk: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.timeout = 300000 // 5 min

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // R2 returns ETag in response header
        const etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag') || ''
        resolve(etag)
      } else {
        reject(new Error(`Parte falhou com status ${xhr.status}: ${xhr.responseText}`))
      }
    }
    xhr.onerror = () => reject(new Error('Falha na conexão ao enviar parte'))
    xhr.ontimeout = () => reject(new Error('Timeout ao enviar parte'))

    xhr.send(chunk)
  })
}
