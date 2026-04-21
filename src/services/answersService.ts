import { supabase } from '../lib/supabase'

type SaveAnswerInput = {
  userId: string
  wordId: number
  userAnswer: string
  isCorrect: boolean
}

export async function saveAnswer({
  userId,
  wordId,
  userAnswer,
  isCorrect,
}: SaveAnswerInput): Promise<void> {
  const { error } = await supabase.from('answers').insert({
    user_id: userId,
    word_id: wordId,
    user_answer: userAnswer,
    is_correct: isCorrect,
  })

  if (error) {
    throw new Error(error.message)
  }
}
