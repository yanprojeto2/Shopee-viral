import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  let product
  if ('is_new_video' in body) {
    ;[product] = await sql`
      UPDATE products SET is_new_video = ${body.is_new_video} WHERE id = ${params.id} RETURNING *
    `
  } else {
    ;[product] = await sql`
      UPDATE products SET is_active = ${body.is_active} WHERE id = ${params.id} RETURNING *
    `
  }
  return NextResponse.json(product)
}
