import { NextRequest, NextResponse } from 'next/server'
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'

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
    const { key, uploadId, parts } = await request.json()

    await r2.send(new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p: { partNumber: number; etag: string }) => ({
          PartNumber: p.partNumber,
          ETag: p.etag,
        })),
      },
    }))

    return NextResponse.json({ url: `${process.env.R2_PUBLIC_URL}/${key}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('upload/complete error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
