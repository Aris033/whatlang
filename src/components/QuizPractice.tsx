import { useEffect, useMemo, useRef, useState } from 'react'
import { submitWordAnswer } from '../services/reviewService'
import { fetchWords } from '../services/wordsService'
import type { Word } from '../types/word'
import DifficultyIndicator from './DifficultyIndicator'

type QuizDifficulty = '1' | '2' | '3' | '4' | 'random'
type QuizStage = 'setup' | 'quiz' | 'summary'
type AnswerStatus = 'idle' | 'correct' | 'incorrect'

type QuizResult = {
  isCorrect: boolean
  acceptedTranslations: string
}

const QUIZ_LENGTH = 10

const difficultyOptions: Array<{ value: QuizDifficulty; label: string }> = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: 'random', label: 'Random' },
]

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

function buildQuizWords(words: Word[], difficulty: QuizDifficulty) {
  const filteredWords =
    difficulty === 'random'
      ? words
      : words.filter((word) => word.difficulty === difficulty)

  return shuffleWords(filteredWords).slice(0, QUIZ_LENGTH)
}

function getQuizRequirementCopy(difficulty: QuizDifficulty) {
  if (difficulty === 'random') {
    return 'You need at least 10 words in Supabase to start a random quiz.'
  }

  return `You need at least 10 words with difficulty ${difficulty} to start this quiz.`
}

function QuizPractice() {
  const [words, setWords] = useState<Word[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('random')
  const [quizWords, setQuizWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle')
  const [lastResult, setLastResult] = useState<QuizResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [stage, setStage] = useState<QuizStage>('setup')
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
          error instanceof Error ? error.message : 'Could not load quiz words.'
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

  const currentWord = quizWords[currentIndex] ?? null

  const totals = useMemo(
    () => ({
      correctAnswers: score,
      wrongAnswers: Math.max(0, currentIndex - score),
    }),
    [currentIndex, score]
  )

  const startQuiz = () => {
    const nextQuizWords = buildQuizWords(words, selectedDifficulty)

    if (nextQuizWords.length < QUIZ_LENGTH) {
      setErrorMessage(getQuizRequirementCopy(selectedDifficulty))
      return
    }

    setQuizWords(nextQuizWords)
    setCurrentIndex(0)
    setScore(0)
    setUserAnswer('')
    setAnswerStatus('idle')
    setLastResult(null)
    setSaveErrorMessage('')
    setErrorMessage('')
    setStage('quiz')
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
        error instanceof Error ? error.message : 'Could not save your quiz answer.'
      )
    } finally {
      setIsSavingAnswer(false)
    }
  }

  const handleNextQuestion = () => {
    const nextIndex = currentIndex + 1

    if (nextIndex >= quizWords.length) {
      setStage('summary')
      return
    }

    setCurrentIndex(nextIndex)
    setUserAnswer('')
    setAnswerStatus('idle')
    setLastResult(null)
    setSaveErrorMessage('')
  }

  const handleRestartQuiz = () => {
    setStage('setup')
    setQuizWords([])
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
        <span className="page-section__tag">Quiz</span>
        <h2>Loading quiz words...</h2>
        <p>Preparing a 10-question session from your vocabulary.</p>
      </section>
    )
  }

  if (errorMessage && stage === 'setup') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Quiz</span>
        <h2>Quiz setup</h2>
        <p>Pick a difficulty and start a focused 10-question round.</p>

        <div className="quiz-difficulty-selector">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === selectedDifficulty
                  ? 'quiz-difficulty-option is-active'
                  : 'quiz-difficulty-option'
              }
              onClick={() => {
                setSelectedDifficulty(option.value)
                setErrorMessage('')
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button type="button" className="primary-button" onClick={startQuiz}>
          Start quiz
        </button>

        <p className="auth-message auth-message--error">{errorMessage}</p>
      </section>
    )
  }

  if (stage === 'setup') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Quiz</span>
        <h2>Pick your difficulty</h2>
        <p>Choose the level for this 10-question quiz, or go random for a mixed round.</p>

        <div className="quiz-difficulty-selector">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === selectedDifficulty
                  ? 'quiz-difficulty-option is-active'
                  : 'quiz-difficulty-option'
              }
              onClick={() => setSelectedDifficulty(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button type="button" className="primary-button" onClick={startQuiz}>
          Start quiz
        </button>
      </section>
    )
  }

  if (stage === 'summary') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Quiz</span>
        <h2>Quiz complete</h2>
        <p className="quiz-summary-score">
          Score: {score} / {QUIZ_LENGTH}
        </p>

        <div className="quiz-summary-grid">
          <article className="quiz-summary-card">
            <span>Correct answers</span>
            <strong>{score}</strong>
          </article>

          <article className="quiz-summary-card">
            <span>Wrong answers</span>
            <strong>{QUIZ_LENGTH - score}</strong>
          </article>
        </div>

        <div className="practice-actions">
          <button type="button" className="primary-button" onClick={handleRestartQuiz}>
            New quiz
          </button>
        </div>
      </section>
    )
  }

  if (!currentWord) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Quiz</span>
        <h2>Could not start this quiz.</h2>
        <p>Try again and we will build a fresh 10-question session.</p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Quiz</span>
      <div className="quiz-progress-row">
        <div>
          <h2>Question {currentIndex + 1} of {QUIZ_LENGTH}</h2>
          <p className="quiz-progress-copy">
            Score: {score} correct, {totals.wrongAnswers} wrong.
          </p>
        </div>
        <DifficultyIndicator difficulty={currentWord.difficulty} />
      </div>

      <div className="practice-word-block practice-word-block--enter">
        <p className="practice-word">{currentWord.english_word}</p>
        {currentWord.topic ? <p className="practice-topic">{currentWord.topic}</p> : null}
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
              {currentIndex + 1 === QUIZ_LENGTH ? 'View results' : 'Next question'}
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

export default QuizPractice
