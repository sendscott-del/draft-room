import { createClient } from '@supabase/supabase-js'
import type { AppData } from '../types'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function loadData(): Promise<AppData | null> {
  const { data, error } = await supabase
    .from('draft_room')
    .select('data')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data?.data as AppData | null
}

export async function saveData(gameData: AppData): Promise<void> {
  const { error } = await supabase
    .from('draft_room')
    .update({ data: gameData, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}
