import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-shopee shadow-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl">
          <span>Do zero ao salário mínimo com a Shopee</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-semibold min-h-[44px] min-w-[44px] px-2 justify-center"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
