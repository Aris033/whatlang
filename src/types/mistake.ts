export type Mistake = {
  word_id: number
  correct_count: number
  wrong_count: number
  total_attempts: number
  last_answered_at: string
  word: {
    id: number
    english_word: string
    spanish_translation: string
    difficulty: string | null
    topic: string | null
  }
}
