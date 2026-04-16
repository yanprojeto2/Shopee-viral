'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Video, TrendingUp, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { ProductWithMedia } from '@/types/database'
import { getRankBadgeColor, formatDownloads } from '@/lib/utils'
import VideoCard from '@/components/VideoCard'

interface ProductCarouselProps {
  products: ProductWithMedia[]
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleMouseEnter = (productId: string) => setHoveredId(productId)
  const handleMouseLeave = () => setHoveredId(null)

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

      // Garante que o blob sai como MP4 independente do MIME retornado pelo servidor
      const mp4Blob = new Blob([blob], { type: 'video/mp4' })
      const mp4Filename = filename.replace(/\.[^.]+$/, '') + '.mp4'
      const mp4File = new File([mp4Blob], mp4Filename, { type: 'video/mp4' })

      // Mobile: Web Share API → salva na galeria
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && navigator.canShare?.({ files: [mp4File] })) {
        try {
          await navigator.share({ files: [mp4File], title: mp4Filename })
          toast({ title: '✅ Vídeo pronto para salvar!', variant: 'success' })
          return
        } catch {
          // cancelado ou não suportado — cai no <a download>
        }
      }

      // Desktop / fallback
      const url = URL.createObjectURL(mp4Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mp4Filename
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

  const top10Products = products.slice(0, 10)
  const extraProducts = products.slice(10)

  const renderCard = (product: ProductWithMedia) => {
    const firstVideo = product.media.find((m) => m.type === 'video' && m.thumbnail_url)
      ?? product.media.find((m) => m.type === 'video')
    const firstPhoto = product.media.find((m) => m.type === 'photo')
    const totalDownloads = product.media.reduce((s, m) => s + m.downloads, 0)
    const isHovered = hoveredId === product.id

    return (
      <div
        key={product.id}
        className="flex-none w-52 sm:w-56 snap-center bg-white rounded-xl border border-shopee-border shadow-sm overflow-hidden flex flex-col"
        onMouseEnter={() => handleMouseEnter(product.id)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video */}
        <div className="relative aspect-[9/16] bg-gray-900">
          {firstVideo ? (
            <VideoCard
              videoSrc={firstVideo.url.startsWith('/') ? firstVideo.url : `/api/media/stream/${firstVideo.id}`}
              thumbnailUrl={firstVideo.thumbnail_url ? `/api/media/stream/${firstVideo.id}?thumb=1` : null}
              className="w-full h-full object-cover"
              videoRef={() => {}}
              isPlaying={isHovered}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
              <Video className="h-10 w-10 text-gray-400" />
              <p className="text-xs">Sem vídeo</p>
            </div>
          )}
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
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Download className="h-3 w-3" />
            {formatDownloads(totalDownloads)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-shopee font-semibold uppercase tracking-wide mb-1">
            {product.category}
          </p>
          <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-3">
            {product.name}
          </h3>

          <div className="flex flex-col gap-2 mt-auto">
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
  }

  return (
    <>
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-shopee" />
            Top 20 Produtos Virais
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

        {/* Top 10 — carrossel */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-4 scroll-px-4"
        >
          {top10Products.map(renderCard)}
        </div>

        {/* Mobile scroll hint */}
        <p className="text-center text-xs text-muted-foreground mt-2 sm:hidden">
          ← Deslize para ver mais →
        </p>

        {/* Rank 11+ — coluna abaixo */}
        {extraProducts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Mais Produtos Virais</h3>
            {/* Mobile: carrossel · Desktop: grid */}
            <div className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-4 scroll-px-4 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5">
              {extraProducts.map(renderCard)}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2 md:hidden">
              ← Deslize para ver mais →
            </p>
          </div>
        )}
      </div>
    </section>

  </>
  )
}
