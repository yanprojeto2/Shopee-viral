import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import MediaUpload from '@/components/admin/MediaUpload'

export default async function ProductMediaPage({ params }: { params: { id: string } }) {
  const [product] = await sql`SELECT * FROM products WHERE id = ${params.id}`
  if (!product) notFound()

  const media = await sql`SELECT * FROM media WHERE product_id = ${params.id} ORDER BY created_at DESC`

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Gerenciar Mídias</h1>
          <p className="text-muted-foreground text-sm">{(product as any).name}</p>
        </div>
      </div>
      <MediaUpload
        productId={(product as any).id}
        productName={(product as any).name}
        initialMedia={media as any[]}
      />
    </div>
  )
}
