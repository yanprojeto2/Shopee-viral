'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ChevronLeft, ChevronRight, Video, Trash2, X, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DayEntry {
  id: number
  date: string   // 'YYYY-MM-DD'
  videos: number
  note: string | null
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function toLocalDate(dateStr: string) {
  // 'YYYY-MM-DD' → Date at local midnight (evita off-by-one de fuso)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarioPage() {
  const { toast } = useToast()
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [entries, setEntries] = useState<DayEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modal, setModal] = useState<{ date: string; entry?: DayEntry } | null>(null)
  const [videos, setVideos] = useState(1)
  const [note,   setNote]   = useState('')
  const [saving, setSaving] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month + 1}`)
      if (!res.ok) throw new Error()
      setEntries(await res.json())
    } catch {
      toast({ title: 'Erro ao carregar calendário', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [year, month, toast])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const entryMap = Object.fromEntries(entries.map((e) => [e.date, e]))

  // Abrir modal
  const openModal = (dateStr: string) => {
    const existing = entryMap[dateStr]
    setVideos(existing?.videos ?? 1)
    setNote(existing?.note ?? '')
    setModal({ date: dateStr, entry: existing })
  }

  // Salvar
  const handleSave = async () => {
    if (!modal) return
    setSaving(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: modal.date, videos, note: note.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast({ title: '✅ Registro salvo!', variant: 'success' })
      setModal(null)
      fetchEntries()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Deletar
  const handleDelete = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/calendar/${dateStr}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Registro removido', variant: 'success' })
      setModal(null)
      fetchEntries()
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  // Navegação de mês
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Construir grade do calendário
  const firstDay = new Date(year, month, 1).getDay() // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Preencher até múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null)

  // Stats do mês
  const totalDays   = entries.length
  const totalVideos = entries.reduce((s, e) => s + e.videos, 0)

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-800">📅 Calendário de Postagens</h1>
          <p className="text-sm text-gray-500 mt-1">Registre os dias que você postou vídeos na Shopee</p>
        </div>

        {/* Stats do mês */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-shopee-border p-4 text-center">
            <p className="text-2xl font-extrabold text-shopee">{totalDays}</p>
            <p className="text-xs text-gray-500 mt-0.5">Dias postados</p>
          </div>
          <div className="bg-white rounded-xl border border-shopee-border p-4 text-center">
            <p className="text-2xl font-extrabold text-shopee">{totalVideos}</p>
            <p className="text-xs text-gray-500 mt-0.5">Vídeos no mês</p>
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-2xl border border-shopee-border shadow-sm overflow-hidden">
          {/* Header do mês */}
          <div className="flex items-center justify-between px-5 py-4 bg-shopee">
            <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-white font-extrabold text-lg">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Grade de dias */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando...</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="aspect-square border-b border-r border-gray-50" />
                const dateStr = formatDate(year, month, day)
                const entry   = entryMap[dateStr]
                const isToday = dateStr === todayStr
                const isFuture = toLocalDate(dateStr) > today

                return (
                  <button
                    key={i}
                    disabled={isFuture}
                    onClick={() => !isFuture && openModal(dateStr)}
                    className={`relative aspect-square flex flex-col items-center justify-center border-b border-r border-gray-100 transition-colors
                      ${isFuture ? 'cursor-default opacity-30' : 'hover:bg-shopee-light cursor-pointer'}
                      ${entry ? 'bg-orange-50' : ''}
                    `}
                  >
                    {/* Número do dia */}
                    <span className={`text-sm font-semibold leading-none
                      ${isToday ? 'bg-shopee text-white rounded-full w-7 h-7 flex items-center justify-center' : entry ? 'text-shopee' : 'text-gray-700'}
                    `}>
                      {day}
                    </span>

                    {/* Badge de vídeos */}
                    {entry && (
                      <span className="mt-1 flex items-center gap-0.5 text-[10px] font-bold text-shopee leading-none">
                        <Video className="h-2.5 w-2.5" />
                        {entry.videos}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Clique em qualquer dia para registrar ou editar uma postagem
        </p>
      </main>

      <Footer />

      {/* Modal de registro */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            {/* Título */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-800 text-base">
                {toLocalDate(modal.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Vídeos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantos vídeos você postou?
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVideos(v => Math.max(1, v - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-shopee hover:text-shopee transition-colors"
                >
                  −
                </button>
                <span className="flex-1 text-center text-2xl font-extrabold text-shopee">{videos}</span>
                <button
                  onClick={() => setVideos(v => v + 1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-shopee hover:text-shopee transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Nota */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Anotação <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: postei fone bluetooth e relógio..."
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-shopee focus:outline-none resize-none text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              {modal.entry && (
                <button
                  onClick={() => handleDelete(modal.date)}
                  className="p-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Remover registro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-shopee text-white font-semibold text-sm hover:bg-shopee-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
