import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { LayoutDashboard, Package, LogOut, ExternalLink } from 'lucide-react'
import AdminMobileNav from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile nav (hamburger + drawer) */}
      <AdminMobileNav />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col flex-none min-h-screen">
        <div className="p-5 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <div>
              <p className="font-extrabold text-shopee leading-tight">Shopee Viral</p>
              <p className="text-xs text-muted-foreground">Studio Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <NavItem href="/admin/products" icon={<Package className="h-4 w-4" />} label="Produtos" />
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Ver site
          </Link>
          <form action={async () => {
            'use server'
            const { cookies } = await import('next/headers')
            const cookieStore = cookies()
            cookieStore.delete('shopee-admin-token')
            redirect('/login')
          }}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold text-gray-600 hover:bg-shopee-light hover:text-shopee transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
