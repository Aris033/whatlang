export type Mistake = {
  id: number
  user_answer: string
  answered_at: string
  word: {
    id: number
    english_word: string
    spanish_translation: string
    difficulty: string | null
    topic: string | null
  }
}
