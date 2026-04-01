import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const [product] = await sql`SELECT * FROM products WHERE id = ${params.id}`
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { name, description, category, price, shopee_link, affiliate_link, is_top10, rank, is_active } = body

  const [product] = await sql`
    UPDATE products SET
      name = ${name},
      description = ${description},
      category = ${category},
      price = ${price},
      shopee_link = ${shopee_link},
      affiliate_link = ${affiliate_link},
      is_top10 = ${is_top10},
      rank = ${rank},
      is_active = ${is_active}
    WHERE id = ${params.id}
    RETURNING *
  `
  return NextResponse.json(product)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await sql`DELETE FROM products WHERE id = ${params.id}`
  return NextResponse.json({ ok: true })
}
