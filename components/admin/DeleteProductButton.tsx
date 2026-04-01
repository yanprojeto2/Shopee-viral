'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    } else {
      toast({ title: 'Produto excluído', variant: 'success' })
      window.location.reload()
    }
  }

  return (
    <Button
      size="icon" variant="ghost"
      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
      onClick={handleDelete} disabled={loading}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
