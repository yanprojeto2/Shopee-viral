'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

interface TextEditorModalProps {
  open: boolean
  onClose: () => void
  posterUrl?: string | null
}

const POSITIONS = ['Topo', 'Centro', 'Base'] as const
type Position = typeof POSITIONS[number]

export default function TextEditorModal({ open, onClose, posterUrl }: TextEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('')
  const [position, setPosition] = useState<Position>('Base')
  const [fontSize, setFontSize] = useState(32)

  useEffect(() => {
    if (!open) return
    drawCanvas()
  }, [open, text, position, fontSize, posterUrl])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 540
    canvas.height = 960

    // Background
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const render = () => {
      if (!text) return
      const padding = 24
      const boxHeight = fontSize + padding * 2

      const y =
        position === 'Topo' ? 0
        : position === 'Centro' ? (canvas.height - boxHeight) / 2
        : canvas.height - boxHeight

      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillRect(0, y, canvas.width, boxHeight)

      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Word wrap
      const maxWidth = canvas.width - 32
      const words = text.split(' ')
      let line = ''
      const lines: string[] = []
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line)
          line = word
        } else {
          line = test
        }
      }
      if (line) lines.push(line)

      const lineH = fontSize * 1.3
      const totalH = lines.length * lineH
      lines.forEach((l, i) => {
        ctx.fillText(l, canvas.width / 2, y + boxHeight / 2 - totalH / 2 + i * lineH + lineH / 2)
      })
    }

    if (posterUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        render()
      }
      img.onerror = () => render()
      img.src = posterUrl
    } else {
      render()
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = 'legenda.jpg'
    a.href = canvas.toDataURL('image/jpeg', 0.92)
    a.click()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-bold text-gray-800">Editor de Texto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg border border-gray-200 bg-black"
            style={{ aspectRatio: '9/16' }}
          />

          {/* Text input */}
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-shopee"
            rows={3}
            placeholder="Digite seu texto ou CTA aqui..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Position */}
          <div className="flex gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  position === p
                    ? 'bg-shopee text-white border-shopee'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-shopee'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Font size */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16">Tamanho</span>
            <input
              type="range"
              min={18}
              max={64}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-6">{fontSize}</span>
          </div>

          <Button className="w-full min-h-[44px]" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Baixar imagem
          </Button>
        </div>
      </div>
    </div>
  )
}
