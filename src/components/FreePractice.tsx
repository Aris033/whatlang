import { useEffect, useRef, useState } from 'react'
import {
  getAuthenticatedUserId,
  recordProgressPenalty,
  saveRevealedFailure,
  submitWordAnswer,
} from '../services/reviewService'
import { guestWords } from '../lib/guestWords'
import { fetchWords } from '../services/wordsService'
import type { Word } from '../types/word'
import {
  formatTranslationsForDisplay,
  getFirstAcceptedTranslation,
  getHintPrefix,
  isCorrectTranslation,
} from '../utils/translations'
import DifficultyIndicator from './DifficultyIndicator'

type AnswerStatus = 'idle' | 'correct' | 'incorrect'
const AUTO_ADVANCE_DELAY_MS = 900

type FreePracticeProps = {
  isGuest?: boolean
}

function getRandomWord(words: Word[], currentWordId?: number) {
  if (words.length === 0) {
    return null
  }

  if (words.length === 1) {
    return words[0]
  }

  const availableWords = words.filter((word) => word.id !== currentWordId)
  const randomIndex = Math.floor(Math.random() * availableWords.length)

  return availableWords[randomIndex]
}

function FreePractice({ isGuest = false }: FreePracticeProps) {
  const [words, setWords] = useState<Word[]>([])
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [revealUsed, setRevealUsed] = useState(false)
  const [revealedTranslation, setRevealedTranslation] = useState('')
  const answerInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadWords = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        if (isGuest) {
          if (!isMounted) {
            return
          }

          setWords(guestWords)
          setCurrentWord(getRandomWord(guestWords))
          return
        }

        const fetchedWords = await fetchWords()

        if (!isMounted) {
          return
        }

        setWords(fetchedWords)
        setCurrentWord(getRandomWord(fetchedWords))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Could not load words.'
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadWords()

    return () => {
      isMounted = false
    }
  }, [isGuest])

  useEffect(() => {
    if (answerStatus !== 'correct' || revealUsed) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      handleNextWord()
    }, AUTO_ADVANCE_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [answerStatus, revealUsed, words, currentWord])

  useEffect(() => {
    if (!currentWord || revealUsed) {
      return
    }

    answerInputRef.current?.focus()
  }, [currentWord, revealUsed])

  const handleCheckAnswer = async () => {
    if (!currentWord || revealUsed) {
      return
    }

    setSaveErrorMessage('')
    setIsSavingAnswer(true)

    try {
      if (isGuest) {
        const result = isCorrectTranslation(
          userAnswer,
          currentWord.spanish_translation
        )

        setAnswerStatus(result.isCorrect ? 'correct' : 'incorrect')
        return
      }

      const result = await submitWordAnswer({
        wordId: currentWord.id,
        userAnswer,
        correctTranslation: currentWord.spanish_translation,
        hintUsed,
        revealUsed: false,
        penaltyPoints: hintUsed ? 1 : 0,
      })

      setAnswerStatus(result.isCorrect ? 'correct' : 'incorrect')
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error ? error.message : 'Could not save your answer.'
      )
    } finally {
      setIsSavingAnswer(false)
    }
  }

  const handleNextWord = () => {
    const nextWord = getRandomWord(words, currentWord?.id)

    setCurrentWord(nextWord)
    setUserAnswer('')
    setAnswerStatus('idle')
    setSaveErrorMessage('')
    setHintUsed(false)
    setRevealUsed(false)
    setRevealedTranslation('')
  }

  const handleHintOrReveal = async () => {
    if (!currentWord || isSavingAnswer) {
      return
    }

    setSaveErrorMessage('')
    setAnswerStatus('idle')

    try {
      const firstAcceptedTranslation = getFirstAcceptedTranslation(
        currentWord.spanish_translation
      )

      if (!firstAcceptedTranslation) {
        throw new Error('This word has no valid translation configured.')
      }

      if (isGuest) {
        if (!hintUsed) {
          setHintUsed(true)
          setUserAnswer(getHintPrefix(currentWord.spanish_translation))
          window.setTimeout(() => {
            answerInputRef.current?.focus()
            const currentValueLength = answerInputRef.current?.value.length ?? 0
            answerInputRef.current?.setSelectionRange(
              currentValueLength,
              currentValueLength
            )
          }, 0)
          return
        }

        if (revealUsed) {
          return
        }

        setRevealUsed(true)
        setRevealedTranslation(firstAcceptedTranslation)
        setAnswerStatus('incorrect')
        return
      }

      const userId = await getAuthenticatedUserId()

      if (!hintUsed) {
        await recordProgressPenalty({
          userId,
          wordId: currentWord.id,
          wrongDelta: 1,
        })

        setHintUsed(true)
        setUserAnswer(getHintPrefix(currentWord.spanish_translation))
        window.setTimeout(() => {
          answerInputRef.current?.focus()
          const currentValueLength = answerInputRef.current?.value.length ?? 0
          answerInputRef.current?.setSelectionRange(
            currentValueLength,
            currentValueLength
          )
        }, 0)
        return
      }

      if (revealUsed) {
        return
      }

      setIsSavingAnswer(true)

      await recordProgressPenalty({
        userId,
        wordId: currentWord.id,
        wrongDelta: 2,
      })

      const penaltyPoints = hintUsed ? 3 : 2

      await saveRevealedFailure({
        userId,
        wordId: currentWord.id,
        userAnswer,
        penaltyPoints,
        hintUsed,
      })

      setRevealUsed(true)
      setRevealedTranslation(firstAcceptedTranslation)
      setAnswerStatus('incorrect')
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error ? error.message : 'Could not use help for this word.'
      )
    } finally {
      setIsSavingAnswer(false)
    }
  }

  if (isLoading) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Free Practice</span>
        <h2>Loading words...</h2>
        <p>
          {isGuest
            ? 'Preparing a small guest preview for your first round.'
            : 'Fetching vocabulary from Supabase for your first practice round.'}
        </p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Free Practice</span>
        <h2>Could not load practice words.</h2>
        <p className="auth-message auth-message--error">{errorMessage}</p>
      </section>
    )
  }

  if (!currentWord) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Free Practice</span>
        <h2>No words available yet.</h2>
        <p>
          {isGuest
            ? 'Guest preview words could not be prepared.'
            : 'Add some rows to the `words` table and this practice flow will be ready.'}
        </p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Free Practice</span>
      <h2>Translate</h2>

      {isGuest ? (
        <p className="practice-guest-note">
          Guest preview: answers are checked locally and this session will not
          save your progress.
        </p>
      ) : null}

      <div key={currentWord.id} className="practice-word-block practice-word-block--enter">
        <div className="practice-word-row">
          <p className="practice-word">{currentWord.english_word}</p>
          <DifficultyIndicator difficulty={currentWord.difficulty} />
        </div>

        {currentWord.topic ? <p className="practice-topic">{currentWord.topic}</p> : null}
      </div>

      <form
        className="practice-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!userAnswer.trim() || isSavingAnswer || revealUsed) {
            return
          }

          void handleCheckAnswer()
        }}
      >
        <label className="auth-form__field">
          <span>Your answer</span>
          <input
            ref={answerInputRef}
            type="text"
            value={userAnswer}
            disabled={revealUsed}
            onChange={(event) => {
              setUserAnswer(event.target.value)
              if (answerStatus !== 'idle') {
                setAnswerStatus('idle')
              }
              if (saveErrorMessage) {
                setSaveErrorMessage('')
              }
            }}
            placeholder="Write the Spanish translation"
          />
        </label>

        <p className="practice-helper-text">
          Press Enter to check faster, or use Hint if you get stuck.
        </p>

        <div className="practice-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleHintOrReveal()}
            disabled={isSavingAnswer || !currentWord || revealUsed}
          >
            {hintUsed ? 'Reveal' : 'Hint'}
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={!userAnswer.trim() || isSavingAnswer || revealUsed}
          >
            {isSavingAnswer
              ? isGuest
                ? 'Checking...'
                : 'Saving answer...'
              : 'Check answer'}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleNextWord}
            disabled={isSavingAnswer || answerStatus === 'correct'}
          >
            Next word
          </button>
        </div>
      </form>

      {saveErrorMessage ? (
        <p className="auth-message auth-message--error">{saveErrorMessage}</p>
      ) : null}

      {revealUsed && revealedTranslation ? (
        <p className="auth-message auth-message--error">
          Revealed answer: {revealedTranslation}
        </p>
      ) : null}

      {answerStatus === 'correct' ? (
        <p className="auth-message auth-message--success">
          Correct! Accepted answers: {formatTranslationsForDisplay(currentWord.spanish_translation)}.
        </p>
      ) : null}

      {answerStatus === 'incorrect' && !revealUsed ? (
        <p className="auth-message auth-message--error">
          Incorrect. Correct answers: {formatTranslationsForDisplay(currentWord.spanish_translation)}.
        </p>
      ) : null}
    </section>
  )
}

export default FreePractice
