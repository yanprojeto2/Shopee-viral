import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
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
  } catch (err) {
    console.error('GET /api/admin/products error:', err)
    return NextResponse.json({ error: 'Erro ao buscar produtos', detail: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, price, shopee_link, affiliate_link, is_top10, rank, is_active } = body

    const [product] = await sql`
      INSERT INTO products (name, description, category, price, shopee_link, affiliate_link, is_top10, rank, is_active)
      VALUES (${name}, ${description}, ${category}, ${price}, ${shopee_link}, ${affiliate_link}, ${is_top10}, ${rank}, ${is_active})
      RETURNING *
    `
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/products error:', err)
    return NextResponse.json({ error: 'Erro ao criar produto', detail: String(err) }, { status: 500 })
  }
}
