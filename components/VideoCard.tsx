'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'

interface VideoCardProps {
  videoSrc: string
  thumbnailUrl: string | null
  className?: string
  videoRef: (el: HTMLVideoElement | null) => void
  isPlaying?: boolean
}

export default function VideoCard({ videoSrc, thumbnailUrl, className, videoRef, isPlaying }: VideoCardProps) {
  const [poster, setPoster] = useState<string | undefined>(thumbnailUrl ?? undefined)
  const [playing, setPlaying] = useState(false)
  const internalRef = useRef<HTMLVideoElement | null>(null)
  const done = useRef(false)

  // Thumbnail via canvas se não houver thumbnail_url
  useEffect(() => {
    if (thumbnailUrl) { setPoster(thumbnailUrl); return }
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
        canvas.width = vid.videoWidth || 320
        canvas.height = vid.videoHeight || 568
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(vid, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        if (dataUrl.length > 4000) { setPoster(dataUrl); done.current = true }
      } catch { /* ignora */ }
      vid.src = ''
    }
    vid.addEventListener('loadeddata', () => { vid.currentTime = 0.5 })
    vid.addEventListener('seeked', onSeeked)
    vid.load()
    return () => { vid.removeEventListener('seeked', onSeeked); vid.src = '' }
  }, [videoSrc, thumbnailUrl])

  // Autoplay no desktop via hover
  useEffect(() => {
    const video = internalRef.current
    if (!video) return
    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isPlaying])

  const handlePlay = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.preventDefault()
    const video = internalRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Ícone de play — apenas visual */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/50 rounded-full p-4">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
      )}

      <video
        ref={(el) => { internalRef.current = el; videoRef(el) }}
        src={videoSrc}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        className={`${className} cursor-pointer`}
        onClick={handlePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0 }}
        style={{ touchAction: 'manipulation' }}
      />
    </div>
  )
}
