'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default function ToggleNewVideoButton({ id, isNewVideo }: { id: string; isNewVideo: boolean }) {
  const [value, setValue] = useState(isNewVideo)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    await fetch(`/api/admin/products/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_new_video: !value }),
    })
    setValue(!value)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} className="transition-opacity disabled:opacity-50">
      <Badge
        variant={value ? 'default' : 'secondary'}
        className={`cursor-pointer select-none ${value ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
      >
        {value ? 'Novo' : '—'}
      </Badge>
    </button>
  )
}
