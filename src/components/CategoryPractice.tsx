import { useEffect, useMemo, useRef, useState } from 'react'
import { submitWordAnswer } from '../services/reviewService'
import { fetchWords, fetchWordsByTopic } from '../services/wordsService'
import type { Word } from '../types/word'
import DifficultyIndicator from './DifficultyIndicator'
import { formatTopicsForDisplay, hasTopic, parseTopics } from '../utils/topics'

type CategoryStage = 'setup' | 'quiz' | 'summary'
type AnswerStatus = 'idle' | 'correct' | 'incorrect'

type CategoryResult = {
  isCorrect: boolean
  acceptedTranslations: string
}

const CATEGORY_LENGTH = 5

function shuffleWords(words: Word[]) {
  const shuffledWords = [...words]

  for (let index = shuffledWords.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = shuffledWords[index]
    shuffledWords[index] = shuffledWords[randomIndex]
    shuffledWords[randomIndex] = currentItem
  }

  return shuffledWords
}

function buildCategoryWords(words: Word[], category: string) {
  return shuffleWords(words.filter((word) => hasTopic(word.topic, category))).slice(
    0,
    CATEGORY_LENGTH
  )
}

function CategoryPractice() {
  const [words, setWords] = useState<Word[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categoryWords, setCategoryWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle')
  const [lastResult, setLastResult] = useState<CategoryResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreparingSession, setIsPreparingSession] = useState(false)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [stage, setStage] = useState<CategoryStage>('setup')
  const answerInputRef = useRef<HTMLInputElement | null>(null)

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
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Could not load category words.'
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
    if (stage !== 'quiz' || answerStatus !== 'idle') {
      return
    }

    answerInputRef.current?.focus()
  }, [stage, currentIndex, answerStatus])

  const availableCategories = useMemo(() => {
    const uniqueTopics = new Set<string>()

    words.forEach((word) => {
      parseTopics(word.topic).forEach((topic) => {
        uniqueTopics.add(topic)
      })
    })

    return [...uniqueTopics].sort((left, right) => left.localeCompare(right))
  }, [words])

  const currentWord = categoryWords[currentIndex] ?? null

  const totals = useMemo(
    () => ({
      correctAnswers: score,
      wrongAnswers: Math.max(0, currentIndex - score),
    }),
    [currentIndex, score]
  )

  const startCategorySession = async () => {
    if (!selectedCategory) {
      setErrorMessage('Choose a category to start this session.')
      return
    }

    setIsPreparingSession(true)
    setErrorMessage('')

    try {
      const fetchedWords = await fetchWordsByTopic(selectedCategory)
      const nextCategoryWords = buildCategoryWords(fetchedWords, selectedCategory)

      if (nextCategoryWords.length < CATEGORY_LENGTH) {
        setErrorMessage(
          `You need at least 5 words in the "${selectedCategory}" category to start this mode.`
        )
        return
      }

      setCategoryWords(nextCategoryWords)
      setCurrentIndex(0)
      setScore(0)
      setUserAnswer('')
      setAnswerStatus('idle')
      setLastResult(null)
      setSaveErrorMessage('')
      setStage('quiz')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not prepare this category session.'
      )
    } finally {
      setIsPreparingSession(false)
    }
  }

  const handleCheckAnswer = async () => {
    if (!currentWord || !userAnswer.trim()) {
      return
    }

    setIsSavingAnswer(true)
    setSaveErrorMessage('')

    try {
      const result = await submitWordAnswer({
        wordId: currentWord.id,
        userAnswer,
        correctTranslation: currentWord.spanish_translation,
      })

      setAnswerStatus(result.isCorrect ? 'correct' : 'incorrect')
      setLastResult({
        isCorrect: result.isCorrect,
        acceptedTranslations: result.formattedAcceptedTranslations,
      })

      if (result.isCorrect) {
        setScore((currentScore) => currentScore + 1)
      }
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error ? error.message : 'Could not save your category answer.'
      )
    } finally {
      setIsSavingAnswer(false)
    }
  }

  const handleNextQuestion = () => {
    const nextIndex = currentIndex + 1

    if (nextIndex >= categoryWords.length) {
      setStage('summary')
      return
    }

    setCurrentIndex(nextIndex)
    setUserAnswer('')
    setAnswerStatus('idle')
    setLastResult(null)
    setSaveErrorMessage('')
  }

  const handleRestart = () => {
    setStage('setup')
    setCategoryWords([])
    setCurrentIndex(0)
    setScore(0)
    setUserAnswer('')
    setAnswerStatus('idle')
    setLastResult(null)
    setSaveErrorMessage('')
    setErrorMessage('')
  }

  if (isLoading) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Category</span>
        <h2>Loading categories...</h2>
        <p>Preparing a focused 5-question session from your vocabulary.</p>
      </section>
    )
  }

  if (stage === 'setup') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Category</span>
        <h2>Choose a category</h2>
        <p>Pick one category and practise 5 words from that topic.</p>

        {availableCategories.length > 0 ? (
          <div className="quiz-difficulty-selector">
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  category === selectedCategory
                    ? 'quiz-difficulty-option is-active'
                    : 'quiz-difficulty-option'
                }
                onClick={() => {
                  setSelectedCategory(category)
                  setErrorMessage('')
                }}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <p className="auth-message auth-message--error">
            No categories were found in the `topic` field yet.
          </p>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={() => void startCategorySession()}
          disabled={availableCategories.length === 0 || isPreparingSession}
        >
          {isPreparingSession ? 'Preparing session...' : 'Start category mode'}
        </button>

        {errorMessage ? (
          <p className="auth-message auth-message--error">{errorMessage}</p>
        ) : null}
      </section>
    )
  }

  if (stage === 'summary') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Category</span>
        <h2>{selectedCategory}</h2>
        <p className="quiz-summary-score">
          Score: {score} / {CATEGORY_LENGTH}
        </p>

        <div className="quiz-summary-grid">
          <article className="quiz-summary-card">
            <span>Correct answers</span>
            <strong>{score}</strong>
          </article>

          <article className="quiz-summary-card">
            <span>Wrong answers</span>
            <strong>{CATEGORY_LENGTH - score}</strong>
          </article>
        </div>

        <div className="practice-actions">
          <button type="button" className="primary-button" onClick={handleRestart}>
            New category session
          </button>
        </div>
      </section>
    )
  }

  if (!currentWord) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Category</span>
        <h2>Could not start this session.</h2>
        <p>Try again and we will prepare a fresh 5-question category round.</p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Category</span>
      <div className="quiz-progress-row">
        <div>
          <h2>Question {currentIndex + 1} of {CATEGORY_LENGTH}</h2>
          <p className="quiz-progress-copy">
            {selectedCategory} - {score} correct, {totals.wrongAnswers} wrong.
          </p>
        </div>
        <DifficultyIndicator difficulty={currentWord.difficulty} />
      </div>

      <div className="practice-word-block practice-word-block--enter">
        <p className="practice-word">{currentWord.english_word}</p>
        {currentWord.topic ? (
          <p className="practice-topic">{formatTopicsForDisplay(currentWord.topic)}</p>
        ) : null}
      </div>

      <form
        className="practice-form"
        onSubmit={(event) => {
          event.preventDefault()

          if (answerStatus !== 'idle' || isSavingAnswer || !userAnswer.trim()) {
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
            onChange={(event) => {
              setUserAnswer(event.target.value)
              if (saveErrorMessage) {
                setSaveErrorMessage('')
              }
            }}
            disabled={answerStatus !== 'idle'}
            placeholder="Write the Spanish translation"
          />
        </label>

        <div className="practice-actions">
          {answerStatus === 'idle' ? (
            <button
              type="submit"
              className="primary-button"
              disabled={!userAnswer.trim() || isSavingAnswer}
            >
              {isSavingAnswer ? 'Checking...' : 'Check answer'}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={handleNextQuestion}
            >
              {currentIndex + 1 === CATEGORY_LENGTH ? 'View results' : 'Next question'}
            </button>
          )}
        </div>
      </form>

      {saveErrorMessage ? (
        <p className="auth-message auth-message--error">{saveErrorMessage}</p>
      ) : null}

      {lastResult?.isCorrect ? (
        <p className="auth-message auth-message--success">
          Correct! Accepted answers: {lastResult.acceptedTranslations}.
        </p>
      ) : null}

      {lastResult && !lastResult.isCorrect ? (
        <p className="auth-message auth-message--error">
          Incorrect. Correct answers: {lastResult.acceptedTranslations}.
        </p>
      ) : null}
    </section>
  )
}

export default CategoryPractice

