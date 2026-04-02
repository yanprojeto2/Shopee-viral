'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Image as ImageIcon, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import ToggleActiveButton from '@/components/admin/ToggleActiveButton'

interface Product {
  id: string
  name: string
  category: string
  price: string | null
  rank: number | null
  is_active: boolean
  photo_count: number
  video_count: number
  total_downloads: number
  thumb_url: string | null
}

export default function ProductsTableClient({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const allSelected = products.length > 0 && selected.size === products.length
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const deleteSelected = async () => {
    if (!confirm(`Excluir ${selected.size} produto(s)? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      )
    )
    setDeleting(false)
    setSelected(new Set())
    toast({ title: `✅ ${selected.size} produto(s) excluído(s)`, variant: 'success' })
    window.location.reload()
  }

  return (
    <>
      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between bg-shopee-light border border-shopee-border rounded-lg px-4 py-2.5 mb-4">
          <span className="text-sm font-semibold text-shopee">
            {selected.size} produto(s) selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={deleteSelected}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Excluindo...' : `Excluir ${selected.size}`}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-shopee cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">Rank</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Produto</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Categoria</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Mídias</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Downloads</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className={`hover:bg-gray-50 transition-colors ${selected.has(product.id) ? 'bg-shopee-light' : ''}`}
              >
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    className="w-4 h-4 accent-shopee cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {product.rank ? (
                    <Badge variant={product.rank === 1 ? 'gold' : product.rank === 2 ? 'silver' : product.rank === 3 ? 'bronze' : 'default'}>
                      #{product.rank}
                    </Badge>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gray-100 flex-none overflow-hidden">
                      {product.thumb_url ? (
                        <Image src={product.thumb_url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 line-clamp-1">{product.name}</p>
                      {product.price && <p className="text-xs text-muted-foreground">R$ {product.price}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{product.category}</td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{product.photo_count}🖼 · {product.video_count}🎬</span>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell font-semibold text-gray-700">
                  {product.total_downloads.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <ToggleActiveButton id={product.id} isActive={product.is_active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" disabled className="h-8 cursor-not-allowed opacity-60 text-xs">
                      Editar (em breve)
                    </Button>
                    <Button size="icon" variant="ghost" asChild className="h-8 w-8">
                      <Link href={`/admin/products/${product.id}/media`}><ImageIcon className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-semibold">Nenhum produto cadastrado ainda.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/products/new"><Plus className="h-4 w-4" />Adicionar primeiro produto</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
