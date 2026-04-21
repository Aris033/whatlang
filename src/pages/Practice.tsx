import { useEffect, useState } from 'react'
import {
  getAuthenticatedUserId,
  recordProgressPenalty,
  saveRevealedFailure,
  submitWordAnswer,
} from '../services/reviewService'
import { fetchWords } from '../services/wordsService'
import type { Word } from '../types/word'
import {
  formatTranslationsForDisplay,
  getFirstAcceptedTranslation,
  getHintPrefix,
} from '../utils/translations'

type AnswerStatus = 'idle' | 'correct' | 'incorrect'
const AUTO_ADVANCE_DELAY_MS = 900

function getDifficultyLevel(value: string | null) {
  const parsedValue = Number(value)

  if (Number.isNaN(parsedValue)) {
    return null
  }

  return Math.min(4, Math.max(1, parsedValue))
}

function DifficultyIndicator({ difficulty }: { difficulty: string | null }) {
  const level = getDifficultyLevel(difficulty)

  if (!level) {
    return null
  }

  return (
    <div
      className={`difficulty-indicator difficulty-indicator--level-${level}`}
      aria-label={`Difficulty level ${level} out of 4`}
      title={`Difficulty ${level}/4`}
    >
      {[1, 2, 3, 4].map((item) => (
        <span
          key={item}
          className={
            item <= level
              ? 'difficulty-indicator__bar is-filled'
              : 'difficulty-indicator__bar'
          }
        />
      ))}
    </div>
  )
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

function Practice() {
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

  useEffect(() => {
    let isMounted = true

    const loadWords = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
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
  }, [])

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

  const handleCheckAnswer = async () => {
    if (!currentWord || revealUsed) {
      return
    }

    setSaveErrorMessage('')
    setIsSavingAnswer(true)

    try {
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

      const userId = await getAuthenticatedUserId()

      if (!hintUsed) {
        await recordProgressPenalty({
          userId,
          wordId: currentWord.id,
          wrongDelta: 1,
        })

        setHintUsed(true)
        setUserAnswer(getHintPrefix(currentWord.spanish_translation))
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
        <span className="page-section__tag">Practice</span>
        <h2>Loading words...</h2>
        <p>Fetching vocabulary from Supabase for your first practice round.</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Practice</span>
        <h2>Could not load practice words.</h2>
        <p className="auth-message auth-message--error">{errorMessage}</p>
      </section>
    )
  }

  if (!currentWord) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Practice</span>
        <h2>No words available yet.</h2>
        <p>Add some rows to the `words` table and this practice flow will be ready.</p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Practice</span>
      <h2>Translate</h2>

      <div className="practice-word-block">
        <div className="practice-word-row">
          <p className="practice-word">{currentWord.english_word}</p>
          <DifficultyIndicator difficulty={currentWord.difficulty} />
        </div>

        {currentWord.topic ? <p className="practice-topic">{currentWord.topic}</p> : null}
      </div>

      <div className="practice-form">
        <label className="auth-form__field">
          <span>Your answer</span>
          <input
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
            type="button"
            className="primary-button"
            onClick={() => void handleCheckAnswer()}
            disabled={!userAnswer.trim() || isSavingAnswer || revealUsed}
          >
            {isSavingAnswer ? 'Saving answer...' : 'Check answer'}
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
      </div>

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

export default Practice
