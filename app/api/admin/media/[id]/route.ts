import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { del } from '@vercel/blob'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const [media] = await sql`SELECT * FROM media WHERE id = ${params.id}`
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete from Vercel Blob if token is configured
  if (process.env.BLOB_READ_WRITE_TOKEN && media.url) {
    try {
      await del(media.url)
    } catch {
      // Ignore blob deletion errors
    }
  }

  await sql`DELETE FROM media WHERE id = ${params.id}`
  return NextResponse.json({ ok: true })
}
