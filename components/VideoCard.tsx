'use client'

import { useEffect, useRef, useState } from 'react'

interface VideoCardProps {
  videoSrc: string
  thumbnailUrl: string | null
  className?: string
  videoRef: (el: HTMLVideoElement | null) => void
}

export default function VideoCard({ videoSrc, thumbnailUrl, className, videoRef }: VideoCardProps) {
  const [poster, setPoster] = useState<string | undefined>(thumbnailUrl ?? undefined)
  const done = useRef(false)

  useEffect(() => {
    // Já tem thumbnail real — usa direto
    if (thumbnailUrl) { setPoster(thumbnailUrl); return }
    // Já capturou antes
    if (done.current) return

    const vid = document.createElement('video')
    vid.src = videoSrc
    vid.crossOrigin = 'anonymous'
    vid.muted = true
    vid.playsInline = true
    vid.preload = 'auto'

    const onSeeked = () => {
      if (done.current) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = vid.videoWidth  || 320
        canvas.height = vid.videoHeight || 568
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(vid, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        if (dataUrl.length > 4000) {
          setPoster(dataUrl)
          done.current = true
        }
      } catch { /* CORS ainda não disponível — ignora */ }
      vid.src = ''
    }

    vid.addEventListener('loadeddata', () => { vid.currentTime = 0.5 })
    vid.addEventListener('seeked', onSeeked)
    vid.load()

    return () => {
      vid.removeEventListener('seeked', onSeeked)
      vid.src = ''
    }
  }, [videoSrc, thumbnailUrl])

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
      onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0 }}
    />
  )
}
