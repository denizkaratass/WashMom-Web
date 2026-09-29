import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// .env doldurulmadıysa uygulama yine açılır (analiz çalışır), sadece hesap özellikleri kapalı olur.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Hesap özellikleri henüz ayarlanmadı. frontend/.env dosyasına Supabase bilgilerini ekleyince giriş ve gardırop açılacak.'
