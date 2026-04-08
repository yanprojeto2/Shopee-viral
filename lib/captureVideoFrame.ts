/**
 * Captures a frame from a video File as a JPEG Blob.
 * Works client-side only (browser canvas API).
 */
export function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl
    let resolved = false

    const cleanup = () => URL.revokeObjectURL(objectUrl)

    const capture = () => {
      if (resolved) return
      resolved = true
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = video.videoWidth  || 320
        canvas.height = video.videoHeight || 568
        const ctx = canvas.getContext('2d')
        if (!ctx) { cleanup(); resolve(null); return }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => { cleanup(); resolve(blob) }, 'image/jpeg', 0.85)
      } catch {
        cleanup()
        resolve(null)
      }
    }

    // Ao ter dados: tenta avançar para 1s (ou 10% se menor) para evitar frame preto
    video.addEventListener('loadeddata', () => {
      const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : null
      const seekTo = dur ? Math.min(1, dur * 0.1) : 1
      // Se já está na posição certa, captura direto
      if (Math.abs(video.currentTime - seekTo) < 0.01) {
        capture()
      } else {
        video.currentTime = seekTo
      }
    })

    video.addEventListener('seeked', capture)
    video.addEventListener('error',  () => { cleanup(); resolve(null) })

    // Timeout de segurança
    setTimeout(() => {
      if (!resolved) { resolved = true; cleanup(); resolve(null) }
    }, 8000)

    video.load()
  })
}
