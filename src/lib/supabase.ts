import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config/public-config'

const LOCAL_URL = 'goldstar.supabase.url'
const LOCAL_KEY = 'goldstar.supabase.publishable_key'

export function getSupabaseCredentials() {
  const url = (import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL || localStorage.getItem(LOCAL_URL) || '').trim()
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY || localStorage.getItem(LOCAL_KEY) || '').trim()
  return { url, key, ready: Boolean(url && key) }
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem(LOCAL_URL, url.trim())
  localStorage.setItem(LOCAL_KEY, key.trim())
}

export function clearSupabaseCredentials() {
  localStorage.removeItem(LOCAL_URL)
  localStorage.removeItem(LOCAL_KEY)
}

const credentials = getSupabaseCredentials()
export const supabase: SupabaseClient | null = credentials.ready ? createClient(credentials.url, credentials.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Connect your Supabase database to continue.')
  return supabase
}
