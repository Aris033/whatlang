import { supabase } from '../lib/supabase'

type SaveAnswerInput = {
  userId: string
  wordId: number
  userAnswer: string
  isCorrect: boolean
  hintUsed?: boolean
  revealUsed?: boolean
  penaltyPoints?: number
}

export async function saveAnswer({
  userId,
  wordId,
  userAnswer,
  isCorrect,
  hintUsed = false,
  revealUsed = false,
  penaltyPoints = 0,
}: SaveAnswerInput): Promise<void> {
  const { error } = await supabase.from('answers').insert({
    user_id: userId,
    word_id: wordId,
    user_answer: userAnswer,
    is_correct: isCorrect,
    hint_used: hintUsed,
    reveal_used: revealUsed,
    penalty_points: penaltyPoints,
  })

  if (error) {
    throw new Error(error.message)
  }
}
