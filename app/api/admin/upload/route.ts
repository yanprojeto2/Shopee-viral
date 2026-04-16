export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const maxDuration = 60

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
    try {
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      }))
      return NextResponse.json({ url: `${process.env.R2_PUBLIC_URL}/${filename}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('R2 upload failed:', message)
      return NextResponse.json({ error: `R2: ${message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'R2 não configurado' }, { status: 500 })
}
