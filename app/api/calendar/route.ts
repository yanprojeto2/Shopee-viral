import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Garante que a tabela existe antes de qualquer operação
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS posting_calendar (
      id          SERIAL PRIMARY KEY,
      date        DATE        NOT NULL UNIQUE,
      videos      INTEGER     NOT NULL DEFAULT 1,
      note        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

// GET /api/calendar?year=2025&month=4
export async function GET(req: NextRequest) {
  await ensureTable()
  const { searchParams } = new URL(req.url)
  const year  = searchParams.get('year')
  const month = searchParams.get('month')

  try {
    let rows
    if (year && month) {
      rows = await sql`
        SELECT id, date::text, videos, note, updated_at
        FROM posting_calendar
        WHERE EXTRACT(YEAR  FROM date) = ${parseInt(year)}
          AND EXTRACT(MONTH FROM date) = ${parseInt(month)}
        ORDER BY date ASC
      `
    } else {
      rows = await sql`
        SELECT id, date::text, videos, note, updated_at
        FROM posting_calendar
        ORDER BY date ASC
      `
    }
    return NextResponse.json(rows)
  } catch (err) {
    console.error('[calendar GET]', err)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

// POST /api/calendar — upsert por date
export async function POST(req: NextRequest) {
  await ensureTable()
  try {
    const { date, videos, note } = await req.json()

    if (!date || typeof videos !== 'number' || videos < 1) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const [row] = await sql`
      INSERT INTO posting_calendar (date, videos, note)
      VALUES (${date}, ${videos}, ${note ?? null})
      ON CONFLICT (date) DO UPDATE
        SET videos     = EXCLUDED.videos,
            note       = EXCLUDED.note,
            updated_at = NOW()
      RETURNING id, date::text, videos, note, updated_at
    `
    return NextResponse.json(row)
  } catch (err) {
    console.error('[calendar POST]', err)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
