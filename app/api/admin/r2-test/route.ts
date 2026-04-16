export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'

export async function GET() {
  const accountId = process.env.R2_ACCOUNT_ID || ''
  const bucket = process.env.R2_BUCKET || ''
  const keyId = process.env.R2_ACCESS_KEY_ID || ''
  const secret = process.env.R2_SECRET_ACCESS_KEY || ''

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId.trim()}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: keyId.trim(),
      secretAccessKey: secret.trim(),
    },
  })

  const results: Record<string, string> = {
    accountId_len: String(accountId.length),
    bucket_len: String(bucket.length),
    keyId_len: String(keyId.length),
    secret_len: String(secret.length),
    accountId_trimmed_len: String(accountId.trim().length),
    bucket_val: bucket.trim(),
  }

  // Test 1: PutObject
  try {
    await r2.send(new PutObjectCommand({
      Bucket: bucket.trim(),
      Key: 'test/diag.txt',
      Body: Buffer.from('test'),
      ContentType: 'text/plain',
    }))
    results.putObject = 'OK'
  } catch (e) {
    results.putObject = e instanceof Error ? e.message : String(e)
  }

  // Test 2: CreateMultipartUpload
  let uploadId: string | undefined
  try {
    const r = await r2.send(new CreateMultipartUploadCommand({
      Bucket: bucket.trim(),
      Key: 'test/diag-multi.mp4',
      ContentType: 'video/mp4',
    }))
    uploadId = r.UploadId
    results.createMultipart = 'OK - UploadId: ' + uploadId?.substring(0, 20)
  } catch (e) {
    results.createMultipart = e instanceof Error ? e.message : String(e)
  }

  if (uploadId) {
    try {
      await r2.send(new AbortMultipartUploadCommand({
        Bucket: bucket.trim(),
        Key: 'test/diag-multi.mp4',
        UploadId: uploadId,
      }))
      results.abortMultipart = 'OK'
    } catch (e) {
      results.abortMultipart = e instanceof Error ? e.message : String(e)
    }
  }

  return NextResponse.json(results)
}
