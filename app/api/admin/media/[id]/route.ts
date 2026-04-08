import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

function r2KeyFromUrl(url: string): string | null {
  const publicBase = process.env.R2_PUBLIC_URL
  if (publicBase && url.startsWith(publicBase + '/')) {
    return url.slice(publicBase.length + 1)
  }
  return null
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const [media] = await sql`SELECT * FROM media WHERE id = ${params.id}`
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete from R2 if it's an R2 URL
  const key = r2KeyFromUrl(media.url)
  if (key) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }))
    } catch { /* ignore */ }
  }
  if (media.thumbnail_url) {
    const thumbKey = r2KeyFromUrl(media.thumbnail_url)
    if (thumbKey) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: thumbKey }))
      } catch { /* ignore */ }
    }
  }

  await sql`DELETE FROM media WHERE id = ${params.id}`
  return NextResponse.json({ ok: true })
}
