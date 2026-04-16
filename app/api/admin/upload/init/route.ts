export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, folder } = await request.json()
    const key = `${folder || 'uploads'}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { UploadId } = await r2.send(new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: contentType,
    }))

    return NextResponse.json({ uploadId: UploadId, key })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('upload/init error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
