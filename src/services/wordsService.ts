import { supabase } from '../lib/supabase'
import type { Word } from '../types/word'

export async function fetchWords(): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select(
      'id, english_word, spanish_translation, difficulty, topic, created_at'
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data satisfies Word[]
}
