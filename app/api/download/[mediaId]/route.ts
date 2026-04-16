export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { slugify } from '@/lib/utils'

export const maxDuration = 60

const VIDEO_DOWNLOAD_LIMIT = 10

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function getExtAndMime(url: string, type: string): { ext: string; mime: string } {
  if (type !== 'video') return { ext: 'jpg', mime: 'image/jpeg' }
  const lower = url.toLowerCase()
  if (lower.includes('.webm')) return { ext: 'webm', mime: 'video/webm' }
  if (lower.includes('.mov')) return { ext: 'mp4', mime: 'video/mp4' } // re-label MOV as mp4 for compatibility
  return { ext: 'mp4', mime: 'video/mp4' }
}

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

  // Rate limit: max 10 video downloads per IP per day
  if (media.type === 'video') {
    const ip = getClientIp(request)
    const [{ count }] = await sql`
      SELECT COUNT(*) AS count
      FROM downloads d
      JOIN media m ON m.id = d.media_id
      WHERE d.ip_address = ${ip}
        AND m.type = 'video'
        AND d.downloaded_at >= NOW() - INTERVAL '1 day'
    `
    if (Number(count) >= VIDEO_DOWNLOAD_LIMIT) {
      return NextResponse.json(
        { error: 'Limite de downloads atingido. Tente novamente amanhã.' },
        { status: 429 }
      )
    }
  }

  const ip = getClientIp(request)

  // Increment downloads (fire and forget)
  sql`UPDATE media SET downloads = downloads + 1 WHERE id = ${params.mediaId}`.then(() => {})
  sql`INSERT INTO downloads (media_id, user_agent, ip_address) VALUES (${params.mediaId}, ${request.headers.get('user-agent') || ''}, ${ip})`.then(() => {})

  const { ext, mime } = getExtAndMime(media.url, media.type)
  const filename = `${slugify(media.product_name)}.${ext}`

  // Local file (dev)
  if (media.url.startsWith('/')) {
    try {
      const { readFile } = await import('fs/promises')
      const { join } = await import('path')
      const bytes = await readFile(join(process.cwd(), 'public', media.url))
      return new NextResponse(bytes, {
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': bytes.byteLength.toString(),
        },
      })
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  // Public URL (R2 or Vercel Blob public) — fetch without auth
  // R2 public URL — redirect directly (avoids Vercel timeout/buffering)
  return NextResponse.redirect(media.url, { status: 302 })
}
