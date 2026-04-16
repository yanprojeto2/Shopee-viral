export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  // Vercel cron secret protection
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch top 20 active products ordered by current rank
  const products = await sql`
    SELECT id, rank
    FROM products
    WHERE is_active = true AND is_top10 = true
    ORDER BY rank ASC NULLS LAST
    LIMIT 20
  ` as { id: string; rank: number | null }[]

  if (products.length < 2) {
    return NextResponse.json({ ok: true, message: 'Not enough products to rotate' })
  }

  // Fisher-Yates shuffle on the ranks
  const ids = products.map((p) => p.id)
  const ranks = products.map((p, i) => p.rank ?? i + 1)

  for (let i = ranks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ranks[i], ranks[j]] = [ranks[j], ranks[i]]
  }

  // Update each product with its new rank
  await Promise.all(
    ids.map((id, i) =>
      sql`UPDATE products SET rank = ${ranks[i]} WHERE id = ${id}`
    )
  )

  return NextResponse.json({ ok: true, rotated: ids.length })
}
