import { type NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const [media] = await sql`
    SELECT m.*, p.name AS product_name
    FROM media m
    JOIN products p ON p.id = m.product_id
    WHERE m.id = ${params.mediaId}
  `

  if (!media) {
    return NextResponse.json({ error: 'Mídia não encontrada' }, { status: 404 })
  }

  // Increment downloads (fire and forget)
  sql`UPDATE media SET downloads = downloads + 1 WHERE id = ${params.mediaId}`.then(() => {})
  sql`INSERT INTO downloads (media_id, user_agent) VALUES (${params.mediaId}, ${request.headers.get('user-agent') || ''})`.then(() => {})

  const ext = media.type === 'video' ? 'mp4' : 'jpg'
  const filename = `${slugify(media.product_name)}.${ext}`

  try {
    let buffer: ArrayBuffer
    if (media.url.startsWith('/')) {
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')
      const filePath = join(process.cwd(), 'public', media.url)
      const bytes = await readFile(filePath)
      buffer = bytes.buffer
    } else {
      const fileResponse = await fetch(media.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN!}` },
      })
      if (!fileResponse.ok) throw new Error('Falha ao buscar arquivo')
      buffer = await fileResponse.arrayBuffer()
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': media.type === 'video' ? 'video/mp4' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch {
    return NextResponse.redirect(media.url)
  }
}
