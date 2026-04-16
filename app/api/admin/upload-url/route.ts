export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  const { filename, contentType, folder } = await request.json()

  if (!filename) {
    return NextResponse.json({ error: 'filename required' }, { status: 400 })
  }

  const key = `${folder || 'uploads'}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // Do NOT include ContentType in the command — avoids header signature mismatch in browsers
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  })

  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 600 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ signedUrl, publicUrl, key, contentType })
}
