import { supabase } from '../lib/supabase'
import type { Mistake } from '../types/mistake'
import type { Word } from '../types/word'

type MistakeRow = {
  id: number
  word_id: number
  user_answer: string
  answered_at: string
}

export async function fetchMistakes(): Promise<Mistake[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('You must be signed in to review mistakes.')
  }

  const { data, error } = await supabase
    .from('answers')
    .select('id, word_id, user_answer, answered_at')
    .eq('user_id', user.id)
    .eq('is_correct', false)
    .order('answered_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const mistakeRows = data as MistakeRow[]

  if (mistakeRows.length === 0) {
    return []
  }

  const wordIds = [...new Set(mistakeRows.map((entry) => entry.word_id))]

  const { data: wordsData, error: wordsError } = await supabase
    .from('words')
    .select('id, english_word, spanish_translation, difficulty, topic, created_at')
    .in('id', wordIds)

  if (wordsError) {
    throw new Error(wordsError.message)
  }

  const wordsById = new Map(
    (wordsData as Word[]).map((word) => [word.id, word] as const)
  )

  return mistakeRows
    .filter((entry) => wordsById.has(entry.word_id))
    .map((entry) => ({
      id: entry.id,
      user_answer: entry.user_answer,
      answered_at: entry.answered_at,
      word: wordsById.get(entry.word_id)!,
    }))
}
