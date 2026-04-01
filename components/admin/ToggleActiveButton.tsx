'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    await fetch(`/api/admin/products/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !active }),
    })
    setActive(!active)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} className="transition-opacity disabled:opacity-50">
      <Badge variant={active ? 'default' : 'secondary'} className="cursor-pointer select-none">
        {active ? 'Ativo' : 'Inativo'}
      </Badge>
    </button>
  )
}
