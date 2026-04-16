export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const maxDuration = 60

// Proxy o vídeo diretamente — sem redirect — para evitar CORS taint no canvas do frontend
export async function GET(
  _request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const [media] = await sql`SELECT url, type FROM media WHERE id = ${params.mediaId}`
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let url = media.url
  if (url.startsWith('/')) {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    const bytes = await readFile(join(process.cwd(), 'public', url))
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) return NextResponse.json({ error: 'Upstream failed' }, { status: 502 })

  const contentType = upstream.headers.get('content-type') || 'video/mp4'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
