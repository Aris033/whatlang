import { supabase } from '../lib/supabase'
import type { UserWordProgress } from '../types/progress'
import type { DashboardSummary } from '../types/dashboard'

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('You must be signed in to view your dashboard.')
  }

  const { count: totalWordsCount, error: totalWordsError } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })

  if (totalWordsError) {
    throw new Error(totalWordsError.message)
  }

  const { data: progressRows, error: progressError } = await supabase
    .from('user_word_progress')
    .select(
      'id, user_id, word_id, correct_count, wrong_count, last_is_correct, last_answered_at, updated_at'
    )
    .eq('user_id', user.id)

  if (progressError) {
    throw new Error(progressError.message)
  }

  const typedProgressRows = progressRows as UserWordProgress[]
  const wordsToReview = typedProgressRows.filter(
    (row) => row.wrong_count > row.correct_count
  ).length

  return {
    totalWords: totalWordsCount ?? 0,
    wordsToReview,
    wordsPractised: typedProgressRows.length,
  }
}
