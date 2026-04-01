import { type NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

// In-memory URL cache to avoid repeated DB lookups
const urlCache = new Map<string, { url: string; type: string; ts: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const cached = urlCache.get(params.mediaId)
  let url: string
  let type: string

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    url = cached.url
    type = cached.type
  } else {
    const [media] = await sql`SELECT url, type FROM media WHERE id = ${params.mediaId}`
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    url = media.url
    type = media.type
    urlCache.set(params.mediaId, { url, type, ts: Date.now() })
  }

  const contentType = type === 'video' ? 'video/mp4' : 'image/jpeg'
  const isLocal = url.startsWith('/')

  if (isLocal) {
    const filePath = join(process.cwd(), 'public', url)
    const buffer = await readFile(filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  }

  const range = request.headers.get('range')
  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN!}`,
  }
  if (range) fetchHeaders['Range'] = range

  const upstream = await fetch(url, { headers: fetchHeaders })
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': type === 'video'
      ? 'public, max-age=3600, stale-while-revalidate=86400'
      : 'public, max-age=86400, stale-while-revalidate=604800',
    'Accept-Ranges': 'bytes',
  }
  const cl = upstream.headers.get('content-length')
  const cr = upstream.headers.get('content-range')
  if (cl) headers['Content-Length'] = cl
  if (cr) headers['Content-Range'] = cr

  return new NextResponse(upstream.body, { status: upstream.status, headers })
}
