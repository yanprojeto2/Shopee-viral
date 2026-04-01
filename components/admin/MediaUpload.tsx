'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Upload, Image as ImageIcon, Video, Trash2, Download } from 'lucide-react'
import type { Media } from '@/types/database'
import { formatFileSize, formatDownloads } from '@/lib/utils'

interface MediaUploadProps {
  productId: string
  productName: string
  initialMedia: Media[]
}

export default function MediaUpload({ productId, productName, initialMedia }: MediaUploadProps) {
  const [media, setMedia] = useState<Media[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState<'photo' | 'video' | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadFile = async (file: File, type: 'photo' | 'video') => {
    setUploading(true)
    setProgress(20)

    // 1. Upload file to Vercel Blob via our API
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', type === 'photo' ? 'product-photos' : 'product-videos')

    const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    setProgress(70)

    if (!uploadRes.ok) {
      toast({ title: 'Erro no upload', variant: 'destructive' })
      setUploading(false)
      return
    }

    const { url } = await uploadRes.json()

    // 2. Register media record in DB
    const mediaRes = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        type,
        url,
        file_size: formatFileSize(file.size),
      }),
    })

    setProgress(100)
    setUploading(false)

    if (!mediaRes.ok) {
      toast({ title: 'Erro ao registrar mídia', variant: 'destructive' })
      return
    }

    const newMedia = await mediaRes.json()
    setMedia((prev) => [newMedia, ...prev])
    toast({ title: `✅ ${type === 'photo' ? 'Foto' : 'Vídeo'} enviado!`, variant: 'success' })
    setTimeout(() => setProgress(0), 500)
  }

  const handleFiles = async (files: FileList, type: 'photo' | 'video') => {
    for (const file of Array.from(files)) {
      await uploadFile(file, type)
    }
  }

  const handleDelete = async (item: Media) => {
    if (!confirm('Excluir esta mídia?')) return
    const res = await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
      toast({ title: 'Mídia excluída', variant: 'success' })
    }
  }

  const photos = media.filter((m) => m.type === 'photo')
  const videos = media.filter((m) => m.type === 'video')

  return (
    <div className="space-y-8">
      {/* Photos */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-shopee" />
          Fotos ({photos.length})
        </h2>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver === 'photo' ? 'border-shopee bg-shopee-light' : 'border-shopee-border hover:border-shopee hover:bg-shopee-light'}`}
          onClick={() => photoInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver('photo') }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => { e.preventDefault(); setDragOver(null); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files, 'photo') }}
        >
          <Upload className="h-8 w-8 text-shopee mx-auto mb-2" />
          <p className="font-semibold text-gray-700">Arraste fotos aqui ou clique</p>
          <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP — múltiplos arquivos</p>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files, 'photo')} />
        </div>

        {uploading && progress > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Enviando...</span><span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-shopee-border aspect-square bg-gray-100">
                <Image src={photo.url} alt="Foto" fill className="object-cover" sizes="120px" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDelete(photo)} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-1 right-1">
                  <span className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Download className="h-2.5 w-2.5" />{formatDownloads(photo.downloads)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Videos */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-shopee" />
          Vídeos ({videos.length})
        </h2>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver === 'video' ? 'border-shopee bg-shopee-light' : 'border-shopee-border hover:border-shopee hover:bg-shopee-light'}`}
          onClick={() => videoInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver('video') }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => { e.preventDefault(); setDragOver(null); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files, 'video') }}
        >
          <Video className="h-8 w-8 text-shopee mx-auto mb-2" />
          <p className="font-semibold text-gray-700">Arraste vídeos aqui ou clique</p>
          <p className="text-sm text-muted-foreground mt-1">MP4, MOV — um por vez</p>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files, 'video')} />
        </div>

        {videos.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-50 rounded-lg border border-shopee-border overflow-hidden">
                <video
                  src={video.url.startsWith('/') ? video.url : `/api/media/stream/${video.id}`}
                  controls
                  className="w-full max-h-64 bg-black"
                  preload="metadata"
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    {video.file_size && <span className="text-xs text-muted-foreground">{video.file_size}</span>}
                    <Badge variant="secondary" className="text-xs">
                      <Download className="h-2.5 w-2.5 mr-1" />{formatDownloads(video.downloads)} downloads
                    </Badge>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(video)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
