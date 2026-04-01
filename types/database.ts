export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          price: string | null
          shopee_link: string | null
          affiliate_link: string | null
          rank: number | null
          is_top10: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          price?: string | null
          shopee_link?: string | null
          affiliate_link?: string | null
          rank?: number | null
          is_top10?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          price?: string | null
          shopee_link?: string | null
          affiliate_link?: string | null
          rank?: number | null
          is_top10?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          product_id: string
          type: 'photo' | 'video'
          url: string
          thumbnail_url: string | null
          original_source: string | null
          file_size: string | null
          duration: string | null
          downloads: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: 'photo' | 'video'
          url: string
          thumbnail_url?: string | null
          original_source?: string | null
          file_size?: string | null
          duration?: string | null
          downloads?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          type?: 'photo' | 'video'
          url?: string
          thumbnail_url?: string | null
          original_source?: string | null
          file_size?: string | null
          duration?: string | null
          downloads?: number
          created_at?: string
        }
      }
      downloads: {
        Row: {
          id: string
          media_id: string
          user_agent: string | null
          downloaded_at: string
        }
        Insert: {
          id?: string
          media_id: string
          user_agent?: string | null
          downloaded_at?: string
        }
        Update: {
          id?: string
          media_id?: string
          user_agent?: string | null
          downloaded_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Media = Database['public']['Tables']['media']['Row']
export type MediaInsert = Database['public']['Tables']['media']['Insert']

export type Download = Database['public']['Tables']['downloads']['Row']

export type ProductWithMedia = Product & {
  media: Media[]
  photo_count: number
  video_count: number
  total_downloads: number
}

export const CATEGORIES = [
  'Eletrônicos',
  'Beleza',
  'Casa',
  'Moda',
  'Saúde',
  'Esporte',
  'Outros',
] as const

export type Category = (typeof CATEGORIES)[number]
