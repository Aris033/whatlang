import { supabase } from '../lib/supabase'
import type { Mistake } from '../types/mistake'
import type { UserWordProgress } from '../types/progress'
import type { Word } from '../types/word'

type MistakeProgressRow = Pick<
  UserWordProgress,
  'word_id' | 'correct_count' | 'wrong_count' | 'last_answered_at'
>

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
    .from('user_word_progress')
    .select(
      'id, user_id, word_id, correct_count, wrong_count, last_is_correct, last_answered_at, updated_at'
    )
    .eq('user_id', user.id)
    .order('wrong_count', { ascending: false })
    .order('last_answered_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const progressRows = (data as UserWordProgress[])
    .filter((entry) => entry.wrong_count > entry.correct_count)
    .map(
      (entry): MistakeProgressRow => ({
        word_id: entry.word_id,
        correct_count: entry.correct_count,
        wrong_count: entry.wrong_count,
        last_answered_at: entry.last_answered_at,
      })
    )

  if (progressRows.length === 0) {
    return []
  }

  const wordIds = [...new Set(progressRows.map((entry) => entry.word_id))]

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

  return progressRows
    .filter((entry) => wordsById.has(entry.word_id))
    .map((entry) => ({
      word_id: entry.word_id,
      correct_count: entry.correct_count,
      wrong_count: entry.wrong_count,
      total_attempts: entry.correct_count + entry.wrong_count,
      last_answered_at: entry.last_answered_at,
      word: wordsById.get(entry.word_id)!,
    }))
    .sort((left, right) => {
      if (right.wrong_count !== left.wrong_count) {
        return right.wrong_count - left.wrong_count
      }

      return (
        new Date(right.last_answered_at).getTime() -
        new Date(left.last_answered_at).getTime()
      )
    })
}
