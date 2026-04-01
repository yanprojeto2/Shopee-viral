export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { sql } from '@/lib/db'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ProductsTableClient from '@/components/admin/ProductsTableClient'

async function getProducts() {
  return sql`
    SELECT p.*,
      COUNT(CASE WHEN m.type = 'photo' THEN 1 END)::int AS photo_count,
      COUNT(CASE WHEN m.type = 'video' THEN 1 END)::int AS video_count,
      COALESCE(SUM(m.downloads), 0)::int AS total_downloads,
      (SELECT url FROM media WHERE product_id = p.id AND type = 'photo' ORDER BY created_at LIMIT 1) AS thumb_url
    FROM products p
    LEFT JOIN media m ON m.product_id = p.id
    GROUP BY p.id
    ORDER BY p.rank ASC NULLS LAST, p.created_at DESC
  `
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Produtos</h1>
          <p className="text-muted-foreground mt-1">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" />Novo produto</Link>
        </Button>
      </div>

      <Card className="overflow-hidden p-4">
        <ProductsTableClient products={products as any[]} />
      </Card>
    </div>
  )
}
