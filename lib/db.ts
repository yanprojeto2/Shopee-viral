import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Lazily initialized to avoid module-level errors during Next.js build
let _client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!_client) {
    _client = neon(process.env.DATABASE_URL!, {
      fetchOptions: { cache: 'no-store' },
    })
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql: NeonQueryFunction<false, false> = ((...args: any[]) => {
  return (getClient() as any)(...args)
}) as NeonQueryFunction<false, false>
