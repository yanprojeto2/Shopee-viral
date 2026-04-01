import { neon } from '@neondatabase/serverless'

// Neon serverless PostgreSQL client
// fetchOptions: cache no-store garante que o Next.js nunca cacheia respostas do banco
export const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: { cache: 'no-store' },
})
