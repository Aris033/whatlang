import { supabase } from '../lib/supabase'
import type { UserWordProgress } from '../types/progress'

type UpdateUserWordProgressInput = {
  userId: string
  wordId: number
  isCorrect: boolean
}

export async function updateUserWordProgress({
  userId,
  wordId,
  isCorrect,
}: UpdateUserWordProgressInput): Promise<void> {
  const { data, error } = await supabase
    .from('user_word_progress')
    .select(
      'id, user_id, word_id, correct_count, wrong_count, last_is_correct, last_answered_at, updated_at'
    )
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const existingProgress = data as UserWordProgress | null
  const now = new Date().toISOString()

  const correctCount = existingProgress
    ? existingProgress.correct_count + (isCorrect ? 1 : 0)
    : isCorrect
      ? 1
      : 0

  const wrongCount = existingProgress
    ? existingProgress.wrong_count + (isCorrect ? 0 : 1)
    : isCorrect
      ? 0
      : 1

  const { error: upsertError } = await supabase.from('user_word_progress').upsert(
    {
      user_id: userId,
      word_id: wordId,
      correct_count: correctCount,
      wrong_count: wrongCount,
      last_is_correct: isCorrect,
      last_answered_at: now,
      updated_at: now,
    },
    {
      onConflict: 'user_id,word_id',
    }
  )

  if (upsertError) {
    throw new Error(upsertError.message)
  }
}
