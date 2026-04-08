import { type NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

const urlCache = new Map<string, { url: string; thumbnail_url: string | null; type: string; ts: number }>()
const CACHE_TTL = 1000 * 60 * 60

export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const isThumb = new URL(request.url).searchParams.get('thumb') === '1'

  const cached = urlCache.get(params.mediaId)
  let url: string
  let thumbnail_url: string | null
  let type: string

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    url = cached.url
    thumbnail_url = cached.thumbnail_url
    type = cached.type
  } else {
    const [media] = await sql`SELECT url, thumbnail_url, type FROM media WHERE id = ${params.mediaId}`
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    url = media.url
    thumbnail_url = media.thumbnail_url ?? null
    type = media.type
    urlCache.set(params.mediaId, { url, thumbnail_url, type, ts: Date.now() })
  }

  const serveUrl = isThumb && thumbnail_url ? thumbnail_url : url

  // Arquivo local (dev) — serve direto
  if (serveUrl.startsWith('/')) {
    const contentType = isThumb ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'image/jpeg'
    const filePath = join(process.cwd(), 'public', serveUrl)
    const buffer = await readFile(filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // Blob público — redireciona direto (sem proxy, sem auth)
  if (!serveUrl.includes('.private.')) {
    return NextResponse.redirect(serveUrl, { status: 302 })
  }

  // URL privada legada — faz proxy sem auth (Vercel Blob suspenso; tenta mesmo assim)
  const contentType = isThumb ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'image/jpeg'
  const range = request.headers.get('range')
  const fetchHeaders: Record<string, string> = {}
  if (range) fetchHeaders['Range'] = range

  const upstream = await fetch(serveUrl, { headers: fetchHeaders })
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600',
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*',
  }
  const cl = upstream.headers.get('content-length')
  const cr = upstream.headers.get('content-range')
  if (cl) headers['Content-Length'] = cl
  if (cr) headers['Content-Range'] = cr

  return new NextResponse(upstream.body, { status: upstream.status, headers })
}
