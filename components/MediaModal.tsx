'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Image as ImageIcon, Video, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { ProductWithMedia, Media } from '@/types/database'
import { formatDownloads, slugify } from '@/lib/utils'

interface MediaModalProps {
  product: ProductWithMedia | null
  open: boolean
  onClose: () => void
}

export default function MediaModal({ product, open, onClose }: MediaModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const { toast } = useToast()

  if (!product) return null

  const photos = product.media.filter((m) => m.type === 'photo')
  const videos = product.media.filter((m) => m.type === 'video')

  const handleDownload = async (media: Media) => {
    setDownloading(media.id)
    try {
      const res = await fetch(`/api/download/${media.id}`)
      if (!res.ok) throw new Error('Erro')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = media.type === 'video' ? 'mp4' : 'jpg'
      a.download = `${slugify(product.name)}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: '✅ Download iniciado!', variant: 'success' })
    } catch {
      toast({ title: 'Erro no download. Tente novamente.', variant: 'destructive' })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-gray-800">{product.name}</DialogTitle>
          <p className="text-sm text-shopee font-semibold">{product.category}</p>
        </DialogHeader>

        <Tabs defaultValue="photos">
          <TabsList className="w-full">
            <TabsTrigger value="photos" className="flex-1">
              <ImageIcon className="h-4 w-4 mr-1.5" />
              Fotos ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-1">
              <Video className="h-4 w-4 mr-1.5" />
              Vídeos ({videos.length})
            </TabsTrigger>
          </TabsList>

          {/* Photos tab */}
          <TabsContent value="photos">
            {photos.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma foto disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-lg overflow-hidden border border-shopee-border bg-gray-50"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={photo.url.startsWith('/') ? photo.url : `/api/media/stream/${photo.id}`}
                        alt="Foto do produto"
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {photo.file_size || '—'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          <Download className="h-2.5 w-2.5 mr-1" />
                          {formatDownloads(photo.downloads)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs min-h-[44px]"
                        disabled={downloading === photo.id}
                        onClick={() => handleDownload(photo)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {downloading === photo.id ? 'Baixando...' : '⬇ Baixar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos tab */}
          <TabsContent value="videos">
            {videos.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Video className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum vídeo disponível</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="rounded-lg border border-shopee-border bg-gray-50 overflow-hidden"
                  >
                    {/* Video player */}
                    <video
                      src={video.url.startsWith('/') ? video.url : `/api/media/stream/${video.id}`}
                      controls
                      className="w-full max-h-56 bg-black"
                      preload="metadata"
                    />
                    {/* Info + download */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {video.file_size && (
                          <span className="text-xs text-muted-foreground">📁 {video.file_size}</span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          <Download className="h-2.5 w-2.5 mr-1" />
                          {formatDownloads(video.downloads)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="flex-none min-h-[44px]"
                        disabled={downloading === video.id}
                        onClick={() => handleDownload(video)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {downloading === video.id ? '...' : 'Baixar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
