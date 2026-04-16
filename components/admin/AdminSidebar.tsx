'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Package, ExternalLink, Menu, X } from 'lucide-react'

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '/admin', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard' },
    { href: '/admin/products', icon: <Package className="h-4 w-4" />, label: 'Produtos' },
  ]

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 h-14 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <span className="font-extrabold text-shopee">Shopee Viral</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl flex flex-col transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-2xl">🎬</span>
            <div>
              <p className="font-extrabold text-shopee leading-tight">Shopee Viral</p>
              <p className="text-xs text-muted-foreground">Studio Admin</p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-gray-600 hover:bg-shopee-light hover:text-shopee transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-4 w-4" />
            Ver site
          </Link>
        </div>
      </div>
    </>
  )
}
