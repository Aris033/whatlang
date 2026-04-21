import { supabase } from '../lib/supabase'
import { saveAnswer } from './answersService'
import { updateUserWordProgress } from './progressService'

type SubmitWordAnswerInput = {
  wordId: number
  userAnswer: string
  correctTranslation: string
}

type SubmitWordAnswerResult = {
  isCorrect: boolean
  normalizedUserAnswer: string
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase()
}

export async function submitWordAnswer({
  wordId,
  userAnswer,
  correctTranslation,
}: SubmitWordAnswerInput): Promise<SubmitWordAnswerResult> {
  const normalizedUserAnswer = normalizeValue(userAnswer)
  const normalizedCorrectAnswer = normalizeValue(correctTranslation)
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!user) {
    throw new Error('You must be signed in to save your answer.')
  }

  await saveAnswer({
    userId: user.id,
    wordId,
    userAnswer: userAnswer.trim(),
    isCorrect,
  })

  await updateUserWordProgress({
    userId: user.id,
    wordId,
    isCorrect,
  })

  return {
    isCorrect,
    normalizedUserAnswer,
  }
}
