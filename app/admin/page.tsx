export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { sql } from '@/lib/db'
import { Package, Image, Download, TrendingUp, Plus, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getStats() {
  const [[products], [media], [downloadsToday]] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM products`,
    sql`SELECT COUNT(*)::int AS count, COALESCE(SUM(downloads), 0)::int AS total FROM media`,
    sql`SELECT COUNT(*)::int AS count FROM downloads WHERE downloaded_at >= CURRENT_DATE`,
  ])
  return {
    products: products.count,
    media: media.count,
    totalDownloads: media.total,
    todayDownloads: downloadsToday.count,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const metrics = [
    { title: 'Total de Produtos', value: stats.products, icon: <Package className="h-5 w-5 text-shopee" />, bg: 'bg-orange-50' },
    { title: 'Total de Mídias', value: stats.media, icon: <Image className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-50' },
    { title: 'Downloads Hoje', value: stats.todayDownloads, icon: <TrendingUp className="h-5 w-5 text-green-500" />, bg: 'bg-green-50' },
    { title: 'Downloads Total', value: stats.totalDownloads, icon: <Download className="h-5 w-5 text-purple-500" />, bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do Shopee Viral Studio</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus className="h-4 w-4" />Adicionar produto</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardContent className="pt-6">
              <div className={`inline-flex p-2 rounded-lg ${m.bg} mb-3`}>{m.icon}</div>
              <p className="text-3xl font-extrabold text-gray-800">{m.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">{m.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Ações rápidas</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link href="/admin/products/new"><Plus className="h-4 w-4" />Novo produto</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/products"><Package className="h-4 w-4" />Gerenciar produtos</Link></Button>
          <Button variant="outline" asChild><Link href="/" target="_blank"><ExternalLink className="h-4 w-4" />Ver site público</Link></Button>
        </CardContent>
      </Card>
    </div>
  )
}
