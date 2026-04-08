import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product] = await sql`SELECT * FROM products WHERE id = ${params.id}`
  if (!product) notFound()

  const mediaType = product.is_top10 ? 'video' : 'photo'
  const [thumb] = await sql`
    SELECT id, url FROM media WHERE product_id = ${params.id} AND type = ${mediaType} ORDER BY created_at LIMIT 1
  `

  const initialThumb = thumb
    ? thumb.url.startsWith('/') ? thumb.url : `/api/media/stream/${thumb.id}`
    : null

  return <ProductForm product={product as any} initialThumb={initialThumb} />
}
