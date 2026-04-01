import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getRankBadgeColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-400 text-yellow-900' // gold
  if (rank === 2) return 'bg-gray-300 text-gray-700'     // silver
  if (rank === 3) return 'bg-amber-600 text-amber-100'   // bronze
  return 'bg-shopee text-white'
}

export function getRankBadgeGradient(rank: number): string {
  if (rank === 1) return 'from-yellow-300 to-yellow-500'
  if (rank === 2) return 'from-gray-200 to-gray-400'
  if (rank === 3) return 'from-amber-500 to-amber-700'
  return 'from-shopee to-shopee-dark'
}

export function formatDownloads(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}
