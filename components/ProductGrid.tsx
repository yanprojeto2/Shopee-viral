'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Video, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MediaModal from '@/components/MediaModal'
import type { ProductWithMedia } from '@/types/database'
import { CATEGORIES } from '@/types/database'
import { formatDownloads } from '@/lib/utils'

interface ProductGridProps {
  products: ProductWithMedia[]
  loading?: boolean
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMedia | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('Todos')

  const filtered =
    activeCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === activeCategory)

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-shopee-border overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-9 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            Mais Produtos para Viralizar
          </h2>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide pb-3 mb-6">
            {['Todos', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  activeCategory === cat
                    ? 'bg-shopee text-white border-shopee'
                    : 'bg-white text-gray-600 border-shopee-border hover:border-shopee hover:text-shopee'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">—</p>
              <p>Nenhum produto nessa categoria ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((product) => {
                const firstPhoto = product.media.find((m) => m.type === 'photo')
                const photoCount = product.media.filter((m) => m.type === 'photo').length
                const videoCount = product.media.filter((m) => m.type === 'video').length
                const totalDl = product.media.reduce((s, m) => s + m.downloads, 0)

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-shopee-border shadow-sm overflow-hidden hover:shadow-md hover:border-shopee transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-36 sm:h-44 bg-gray-100">
                      {firstPhoto ? (
                        <Image
                          src={firstPhoto.url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
                        </div>
                      )}
                      {product.is_top10 && product.rank && (
                        <div className="absolute top-2 left-2">
                          <Badge className="text-xs font-bold">#{product.rank}</Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <p className="text-xs text-shopee font-semibold uppercase tracking-wide mb-1">
                        {product.category}
                        {product.price && (
                          <span className="ml-2 text-gray-500 normal-case">
                            R$ {product.price}
                          </span>
                        )}
                      </p>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-2">
                        {product.name}
                      </h3>

                      {/* Media count */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        {photoCount > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {photoCount} foto{photoCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {videoCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            {videoCount} vídeo{videoCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {photoCount === 0 && videoCount === 0 && (
                          <span>Sem mídias</span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full text-xs min-h-[44px]"
                        onClick={() => setSelectedProduct(product)}
                        disabled={photoCount === 0 && videoCount === 0}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver mídias
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <MediaModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}
