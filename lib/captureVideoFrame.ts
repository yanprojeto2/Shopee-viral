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

    const cleanup = () => URL.revokeObjectURL(objectUrl)

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, video.duration * 0.1 || 0)
    })

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { cleanup(); resolve(null); return }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => { cleanup(); resolve(blob) }, 'image/jpeg', 0.8)
      } catch {
        cleanup()
        resolve(null)
      }
    })

    video.addEventListener('error', () => { cleanup(); resolve(null) })

    // Timeout fallback
    setTimeout(() => { cleanup(); resolve(null) }, 10000)
  })
}
