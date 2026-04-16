export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3'

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
  const chunk = formData.get('chunk') as File
  const key = formData.get('key') as string
  const uploadId = formData.get('uploadId') as string
  const partNumber = parseInt(formData.get('partNumber') as string)

  if (!chunk || !key || !uploadId || !partNumber) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await chunk.arrayBuffer())

    const { ETag } = await r2.send(new UploadPartCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
    }))

    console.log(`Part ${partNumber} ETag: ${ETag}`)
    return NextResponse.json({ etag: ETag, partNumber })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Part ${partNumber} error:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
