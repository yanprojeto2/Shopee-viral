import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // Tenta Vercel Blob primeiro; se falhar, salva localmente
  try {
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })
    return NextResponse.json({ url: blob.url })
  } catch {
    // Fallback: salva em /public/uploads/
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)
    const url = `/uploads/${folder}/${filename}`
    return NextResponse.json({ url })
  }
}
