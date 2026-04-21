export type UserWordProgress = {
  id: number
  user_id: string
  word_id: number
  correct_count: number
  wrong_count: number
  last_is_correct: boolean
  last_answered_at: string
  updated_at: string
}
