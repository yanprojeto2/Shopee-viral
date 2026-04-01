import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  try {
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: 'private',
    })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Fallback local (só funciona em dev)
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const uploadDir = join(process.cwd(), 'public', 'uploads', folder)
      await mkdir(uploadDir, { recursive: true })
      await writeFile(join(uploadDir, filename), buffer)
      const url = `/uploads/${folder}/${filename}`
      return NextResponse.json({ url, warning: `Blob falhou (${message}), salvo localmente` })
    } catch {
      return NextResponse.json({ error: `Blob error: ${message}` }, { status: 500 })
    }
  }
}
