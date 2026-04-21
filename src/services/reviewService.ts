import { supabase } from '../lib/supabase'
import { saveAnswer } from './answersService'
import { updateUserWordProgress } from './progressService'
import {
  formatTranslationsForDisplay,
  isCorrectTranslation,
} from '../utils/translations'

type SubmitWordAnswerInput = {
  wordId: number
  userAnswer: string
  correctTranslation: string
  hintUsed?: boolean
  revealUsed?: boolean
  penaltyPoints?: number
}

type SubmitWordAnswerResult = {
  isCorrect: boolean
  normalizedUserAnswer: string
  formattedAcceptedTranslations: string
}

export async function submitWordAnswer({
  wordId,
  userAnswer,
  correctTranslation,
  hintUsed = false,
  revealUsed = false,
  penaltyPoints = 0,
}: SubmitWordAnswerInput): Promise<SubmitWordAnswerResult> {
  const {
    normalizedUserAnswer,
    isCorrect,
  } = isCorrectTranslation(userAnswer, correctTranslation)

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
    hintUsed,
    revealUsed,
    penaltyPoints,
  })

  await updateUserWordProgress({
    userId: user.id,
    wordId,
    correctDelta: isCorrect ? 1 : 0,
    wrongDelta: isCorrect ? 0 : 1,
    lastIsCorrect: isCorrect,
  })

  return {
    isCorrect,
    normalizedUserAnswer,
    formattedAcceptedTranslations: formatTranslationsForDisplay(correctTranslation),
  }
}

export async function getAuthenticatedUserId() {
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

  return user.id
}

type RecordProgressPenaltyInput = {
  userId: string
  wordId: number
  wrongDelta: number
}

export async function recordProgressPenalty({
  userId,
  wordId,
  wrongDelta,
}: RecordProgressPenaltyInput) {
  await updateUserWordProgress({
    userId,
    wordId,
    correctDelta: 0,
    wrongDelta,
    lastIsCorrect: false,
  })
}

type SaveRevealedFailureInput = {
  userId: string
  wordId: number
  userAnswer: string
  penaltyPoints: number
  hintUsed: boolean
}

export async function saveRevealedFailure({
  userId,
  wordId,
  userAnswer,
  penaltyPoints,
  hintUsed,
}: SaveRevealedFailureInput) {
  await saveAnswer({
    userId,
    wordId,
    userAnswer: userAnswer.trim(),
    isCorrect: false,
    hintUsed,
    revealUsed: true,
    penaltyPoints,
  })
}
