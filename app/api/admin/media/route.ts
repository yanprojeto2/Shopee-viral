import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('product_id')
  if (!productId) return NextResponse.json([])

  const media = await sql`
    SELECT * FROM media WHERE product_id = ${productId} ORDER BY created_at DESC
  `
  return NextResponse.json(media)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { product_id, type, url, thumbnail_url, file_size, duration } = body

  const [media] = await sql`
    INSERT INTO media (product_id, type, url, thumbnail_url, original_source, file_size, duration)
    VALUES (${product_id}, ${type}, ${url}, ${thumbnail_url}, 'manual', ${file_size}, ${duration})
    RETURNING *
  `
  return NextResponse.json(media, { status: 201 })
}
