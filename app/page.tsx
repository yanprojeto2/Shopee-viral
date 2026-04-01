export const dynamic = 'force-dynamic'

import { sql } from '@/lib/db'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCarousel from '@/components/ProductCarousel'
import ProductGrid from '@/components/ProductGrid'
import type { ProductWithMedia } from '@/types/database'

async function getProducts() {
  const rows = await sql`
    SELECT p.*,
      COALESCE(
        json_agg(m ORDER BY m.created_at DESC) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) AS media
    FROM products p
    LEFT JOIN media m ON m.product_id = p.id
    WHERE p.is_active = true
    GROUP BY p.id
    ORDER BY p.rank ASC NULLS LAST, p.created_at DESC
  `

  const enriched: ProductWithMedia[] = (rows as any[]).map((p) => ({
    ...p,
    media: p.media || [],
    photo_count: (p.media || []).filter((m: any) => m.type === 'photo').length,
    video_count: (p.media || []).filter((m: any) => m.type === 'video').length,
    total_downloads: (p.media || []).reduce((s: number, m: any) => s + (m.downloads || 0), 0),
  }))

  return {
    top10: enriched.filter((p) => p.is_top10).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
    others: enriched.filter((p) => !p.is_top10),
  }
}

export default async function HomePage() {
  const { top10, others } = await getProducts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="bg-gradient-to-r from-shopee to-shopee-dark text-white py-8 sm:py-10 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3">
            Shopee Viral Studio
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-xl mx-auto font-semibold">
            Baixe fotos e vídeos dos produtos mais virais e aumente suas comissões de afiliado!
          </p>
        </div>
      </div>

      <main className="flex-1">
        {top10.length > 0 && (
          <div className="bg-shopee-light">
            <ProductCarousel products={top10} />
          </div>
        )}
        <div className="bg-white">
          <ProductGrid products={others} />
        </div>
        {top10.length === 0 && others.length === 0 && (
          <div className="text-center py-16 sm:py-24 text-muted-foreground">
            <p className="text-3xl sm:text-5xl mb-4">—</p>
            <p className="text-base sm:text-lg font-semibold">Nenhum produto disponível ainda.</p>
            <p className="text-sm mt-1">Adicione produtos no painel admin.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
