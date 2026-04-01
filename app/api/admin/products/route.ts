import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const products = await sql`
    SELECT p.*,
      COUNT(CASE WHEN m.type = 'photo' THEN 1 END)::int AS photo_count,
      COUNT(CASE WHEN m.type = 'video' THEN 1 END)::int AS video_count,
      COALESCE(SUM(m.downloads), 0)::int AS total_downloads
    FROM products p
    LEFT JOIN media m ON m.product_id = p.id
    GROUP BY p.id
    ORDER BY p.rank ASC NULLS LAST, p.created_at DESC
  `
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, description, category, price, shopee_link, affiliate_link, is_top10, rank, is_active } = body

  const [product] = await sql`
    INSERT INTO products (name, description, category, price, shopee_link, affiliate_link, is_top10, rank, is_active)
    VALUES (${name}, ${description}, ${category}, ${price}, ${shopee_link}, ${affiliate_link}, ${is_top10}, ${rank}, ${is_active})
    RETURNING *
  `
  return NextResponse.json(product, { status: 201 })
}
