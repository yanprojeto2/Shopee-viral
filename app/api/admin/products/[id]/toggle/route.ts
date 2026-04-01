import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { is_active } = await request.json()
  const [product] = await sql`
    UPDATE products SET is_active = ${is_active} WHERE id = ${params.id} RETURNING *
  `
  return NextResponse.json(product)
}
