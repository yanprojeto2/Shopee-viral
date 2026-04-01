'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import type { Product } from '@/types/database'
import { CATEGORIES } from '@/types/database'
import { Save, ArrowLeft, Upload, X, Link2 } from 'lucide-react'
import Link from 'next/link'
import { formatFileSize } from '@/lib/utils'
import { captureVideoFrame } from '@/lib/captureVideoFrame'

interface ProductFormProps {
  product?: Product
  initialThumb?: string | null
}

export default function ProductForm({ product, initialThumb }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!product
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product?.price || '',
    shopee_link: product?.shopee_link || '',
    affiliate_link: product?.affiliate_link || '',
    is_top10: product?.is_top10 || false,
    rank: product?.rank?.toString() || '',
    is_active: product?.is_active ?? true,
  })

  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialThumb || null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleMediaSelect = (file: File) => {
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const clearMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.category) {
      toast({ title: 'Preencha nome e categoria', variant: 'destructive' })
      return
    }

    setSaving(true)

    // 1. Salvar produto
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price: form.price.trim() || null,
      shopee_link: form.shopee_link.trim() || null,
      affiliate_link: form.affiliate_link.trim() || null,
      is_top10: form.is_top10,
      rank: form.is_top10 && form.rank ? parseInt(form.rank) : null,
      is_active: form.is_active,
    }

    const url = isEditing ? `/api/admin/products/${product.id}` : '/api/admin/products'
    const method = isEditing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      toast({ title: 'Erro ao salvar produto', variant: 'destructive' })
      setSaving(false)
      return
    }

    const savedProduct = await res.json()

    // 2. Upload da mídia se selecionada
    if (mediaFile) {
      setUploadProgress(20)

      const isVideo = form.is_top10
      const formData = new FormData()
      formData.append('file', mediaFile)
      formData.append('folder', isVideo ? 'product-videos' : 'product-photos')

      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      setUploadProgress(70)

      if (uploadRes.ok) {
        const { url: mediaUrl } = await uploadRes.json()

        let thumbnail_url: string | null = null
        if (isVideo) {
          const thumbBlob = await captureVideoFrame(mediaFile)
          if (thumbBlob) {
            const thumbForm = new FormData()
            thumbForm.append('file', new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' }))
            thumbForm.append('folder', 'product-thumbnails')
            const thumbRes = await fetch('/api/admin/upload', { method: 'POST', body: thumbForm })
            if (thumbRes.ok) {
              const { url: tUrl } = await thumbRes.json()
              thumbnail_url = tUrl
            }
          }
        }

        await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: savedProduct.id,
            type: isVideo ? 'video' : 'photo',
            url: mediaUrl,
            thumbnail_url,
            file_size: formatFileSize(mediaFile.size),
          }),
        })
        setUploadProgress(100)
      }
    }

    setSaving(false)
    toast({ title: `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, variant: 'success' })
    router.push('/admin/products')
    router.refresh()
  }

  const isTop10 = form.is_top10

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
        <h1 className="text-2xl font-extrabold text-gray-800">
          {isEditing ? 'Editar produto' : 'Novo produto'}
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* Top 10 — primeiro para definir o tipo de upload */}
        <div className="flex items-center gap-3 py-1 pb-3 border-b border-gray-100">
          <Switch
            id="is_top10"
            checked={form.is_top10}
            onCheckedChange={(v) => {
              setForm({ ...form, is_top10: v, rank: v ? form.rank : '' })
              clearMedia()
            }}
          />
          <Label htmlFor="is_top10" className="cursor-pointer font-semibold">🔥 É Top 10?</Label>
        </div>

        {form.is_top10 && (
          <div className="space-y-1.5">
            <Label htmlFor="rank">Posição no ranking (1-10)</Label>
            <Input
              id="rank"
              type="number"
              min={1}
              max={10}
              value={form.rank}
              onChange={(e) => setForm({ ...form, rank: e.target.value })}
              placeholder="1"
            />
          </div>
        )}

        {/* Media upload — vídeo para Top 10, foto para os demais */}
        <div className="space-y-1.5">
          <Label>{isTop10 ? 'Vídeo do produto (Top 10)' : 'Foto do produto'}</Label>
          <div
            className="border-2 border-dashed border-shopee-border rounded-xl overflow-hidden cursor-pointer hover:border-shopee transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (!file) return
              if (isTop10 && file.type.startsWith('video/')) handleMediaSelect(file)
              if (!isTop10 && file.type.startsWith('image/')) handleMediaSelect(file)
            }}
          >
            {mediaPreview ? (
              <div className="relative">
                <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
                  {isTop10 ? (
                    <video
                      src={mediaPreview}
                      className="h-full w-full object-contain"
                      controls
                      muted
                    />
                  ) : (
                    <Image src={mediaPreview} alt="Preview" fill className="object-contain" sizes="672px" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearMedia() }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-gray-200 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-center text-muted-foreground py-2">
                  Clique para trocar {isTop10 ? 'o vídeo' : 'a foto'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Upload className="h-8 w-8 text-shopee mb-2" />
                <p className="font-semibold text-gray-700">
                  Arraste ou clique para adicionar {isTop10 ? 'vídeo' : 'foto'}
                </p>
                <p className="text-xs mt-1">{isTop10 ? 'MP4, MOV, WEBM' : 'JPG, PNG, WEBP'}</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={isTop10 ? 'video/mp4,video/quicktime,video/webm' : 'image/jpeg,image/png,image/webp'}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaSelect(f) }}
          />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome do produto *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Fone de Ouvido Bluetooth Pro"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Descreva o produto..."
          />
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Ex: 59,90"
          />
        </div>

        {/* Links */}
        <div className="space-y-1.5">
          <Label htmlFor="shopee_link" className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Link Shopee
          </Label>
          <Input
            id="shopee_link"
            type="url"
            value={form.shopee_link}
            onChange={(e) => setForm({ ...form, shopee_link: e.target.value })}
            placeholder="https://shopee.com.br/produto..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="affiliate_link" className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Link de Afiliado
          </Label>
          <Input
            id="affiliate_link"
            type="url"
            value={form.affiliate_link}
            onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })}
            placeholder="https://s.shopee.com.br/afiliado..."
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Categoria *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Active */}
        <div className="flex items-center gap-3 py-2 border-t border-gray-100 pt-4">
          <Switch
            id="is_active"
            checked={form.is_active}
            onCheckedChange={(v) => setForm({ ...form, is_active: v })}
          />
          <Label htmlFor="is_active" className="cursor-pointer">Produto ativo (visível no site)</Label>
        </div>
      </div>

      {/* Upload progress */}
      {saving && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Enviando mídia...</span><span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      <Button type="submit" disabled={saving} className="min-h-[44px] px-8">
        <Save className="h-4 w-4" />
        {saving ? 'Salvando...' : 'Salvar produto'}
      </Button>
    </form>
  )
}
