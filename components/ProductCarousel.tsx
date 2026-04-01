'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Video, TrendingUp, Play, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { ProductWithMedia } from '@/types/database'
import { getRankBadgeColor, formatDownloads } from '@/lib/utils'

interface ProductCarouselProps {
  products: ProductWithMedia[]
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const { toast } = useToast()

  const handleMouseEnter = (productId: string) => {
    setHoveredId(productId)
    const video = videoRefs.current[productId]
    if (video) {
      video.currentTime = 0
      video.play().catch(() => {})
    }
  }

  const handleMouseLeave = (productId: string) => {
    setHoveredId(null)
    const video = videoRefs.current[productId]
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.offsetWidth * 0.8
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const handleDownload = async (mediaId: string, filename: string) => {
    setIsDownloading(mediaId)
    try {
      const res = await fetch(`/api/download/${mediaId}`)
      if (!res.ok) throw new Error('Falha no download')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: '✅ Download iniciado!', variant: 'success' })
    } catch {
      toast({ title: 'Erro no download', variant: 'destructive' })
    } finally {
      setIsDownloading(null)
    }
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return 'bronze'
    return 'default'
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-shopee" />
            Top 10 Produtos Virais
          </h2>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white border border-shopee-border hover:bg-shopee-light text-shopee transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white border border-shopee-border hover:bg-shopee-light text-shopee transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-4"
        >
          {products.map((product) => {
            const firstVideo = product.media.find((m) => m.type === 'video')
            const totalDownloads = product.media.reduce((s, m) => s + m.downloads, 0)
            const isHovered = hoveredId === product.id

            return (
              <div
                key={product.id}
                className="flex-none w-52 sm:w-64 md:w-72 snap-start bg-white rounded-xl border border-shopee-border shadow-sm overflow-hidden"
                onMouseEnter={() => handleMouseEnter(product.id)}
                onMouseLeave={() => handleMouseLeave(product.id)}
              >
                {/* Video */}
                <div className="relative h-40 sm:h-48 md:h-52 bg-gray-900">
                  {firstVideo ? (
                    <>
                      <video
                        ref={(el) => { videoRefs.current[product.id] = el }}
                        src={firstVideo.url.startsWith('/') ? firstVideo.url : `/api/media/stream/${firstVideo.id}`}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                      {/* Play icon overlay quando não está em hover */}
                      {!isHovered && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <div className="bg-white/80 rounded-full p-3">
                            <Play className="h-6 w-6 text-shopee fill-shopee" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                      <Video className="h-10 w-10 text-gray-400" />
                      <p className="text-xs">Sem vídeo</p>
                    </div>
                  )}
                  {/* Rank badge */}
                  {product.rank && (
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant={getRankBadgeVariant(product.rank) as 'gold' | 'silver' | 'bronze' | 'default'}
                        className="text-sm font-bold px-2 py-1"
                      >
                        #{product.rank}
                      </Badge>
                    </div>
                  )}
                  {/* Downloads badge */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {formatDownloads(totalDownloads)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-shopee font-semibold uppercase tracking-wide mb-1">
                    {product.category}
                  </p>
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-3">
                    {product.name}
                  </h3>

                  <div className="flex flex-col gap-2">
                    {firstVideo ? (
                      <Button
                        size="sm"
                        className="w-full text-xs min-h-[44px]"
                        disabled={isDownloading === firstVideo.id}
                        onClick={() =>
                          handleDownload(firstVideo.id, `${product.name}-video.mp4`)
                        }
                      >
                        <Video className="h-3.5 w-3.5" />
                        {isDownloading === firstVideo.id ? 'Baixando...' : 'Baixar Vídeo'}
                      </Button>
                    ) : (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        Sem vídeo disponível
                      </p>
                    )}
                    {(product.affiliate_link || product.shopee_link) && (
                      <a
                        href={product.affiliate_link || product.shopee_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs min-h-[44px] border-shopee text-shopee hover:bg-shopee hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Acessar produto
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile scroll hint */}
        <p className="text-center text-xs text-muted-foreground mt-2 sm:hidden">
          ← Deslize para ver mais →
        </p>
      </div>
    </section>
  )
}
