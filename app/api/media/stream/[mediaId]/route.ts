import { type NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const [media] = await sql`SELECT url, type FROM media WHERE id = ${params.mediaId}`
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const contentType = media.type === 'video' ? 'video/mp4' : 'image/jpeg'
  const isLocal = media.url.startsWith('/')

  if (isLocal) {
    // Arquivo local em /public
    const filePath = join(process.cwd(), 'public', media.url)
    const buffer = await readFile(filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }

  // Vercel Blob com token
  const range = request.headers.get('range')
  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN!}`,
  }
  if (range) fetchHeaders['Range'] = range

  const upstream = await fetch(media.url, { headers: fetchHeaders })
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Content-Length': upstream.headers.get('content-length') || '',
      'Content-Range': upstream.headers.get('content-range') || '',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
