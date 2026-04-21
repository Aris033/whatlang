import { supabase } from '../lib/supabase'

type SaveAnswerInput = {
  wordId: number
  userAnswer: string
  isCorrect: boolean
}

export async function saveAnswer({
  wordId,
  userAnswer,
  isCorrect,
}: SaveAnswerInput): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('You must be signed in to save an answer.')
  }

  const { error } = await supabase.from('answers').insert({
    user_id: user.id,
    word_id: wordId,
    user_answer: userAnswer,
    is_correct: isCorrect,
  })

  if (error) {
    throw new Error(error.message)
  }
}
