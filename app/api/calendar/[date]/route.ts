import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// DELETE /api/calendar/2025-04-05
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { date: string } }
) {
  const { date } = params
  if (!date) return NextResponse.json({ error: 'Data inválida' }, { status: 400 })

  try {
    await sql`DELETE FROM posting_calendar WHERE date = ${date}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[calendar DELETE]', err)
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 })
  }
}
