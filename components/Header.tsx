import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-shopee shadow-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl">
          <span>Shopee Viral</span>
        </Link>

        <nav>
          <Link
            href="/calendario"
            className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors text-sm font-semibold min-h-[44px] px-2 justify-center"
          >
            <CalendarDays className="h-5 w-5" />
            <span>Calendário</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
