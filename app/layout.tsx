import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Shopee Viral Studio',
  description: 'Baixe fotos e vídeos virais de produtos Shopee para seus afiliados',
  keywords: ['shopee', 'afiliados', 'viral', 'produtos', 'vídeos'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-shopee-light font-nunito antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
