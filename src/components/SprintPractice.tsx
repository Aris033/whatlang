import { useEffect, useMemo, useRef, useState } from 'react'
import { submitWordAnswer } from '../services/reviewService'
import { fetchWords } from '../services/wordsService'
import type { Word } from '../types/word'
import DifficultyIndicator from './DifficultyIndicator'

type SprintStage = 'setup' | 'running' | 'summary'

const SPRINT_DURATION_SECONDS = 35

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

function SprintPractice() {
  const [words, setWords] = useState<Word[]>([])
  const [sessionWords, setSessionWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATION_SECONDS)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [stage, setStage] = useState<SprintStage>('setup')
  const [lastAcceptedTranslations, setLastAcceptedTranslations] = useState('')
  const [lastAnswerWasCorrect, setLastAnswerWasCorrect] = useState<boolean | null>(null)
  const answerInputRef = useRef<HTMLInputElement | null>(null)
  const intervalIdRef = useRef<number | null>(null)
  const sessionDeadlineRef = useRef<number | null>(null)
  const isSessionEndingRef = useRef(false)
  const stageRef = useRef<SprintStage>('setup')

  useEffect(() => {
    stageRef.current = stage
  }, [stage])

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
          error instanceof Error ? error.message : 'Could not load sprint words.'
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
    if (stage !== 'running') {
      return
    }

    answerInputRef.current?.focus()
  }, [stage, currentWordIndex])

  useEffect(() => {
    if (stage !== 'running') {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }

      return
    }

    const tick = () => {
      if (!sessionDeadlineRef.current) {
        return
      }

      const remainingSeconds = Math.max(
        0,
        Math.ceil((sessionDeadlineRef.current - Date.now()) / 1000)
      )

      setTimeLeft(remainingSeconds)

      if (remainingSeconds <= 0) {
        endSession()
      }
    }

    tick()
    intervalIdRef.current = window.setInterval(tick, 250)

    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [stage])

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current)
      }
    }
  }, [])

  const currentWord = sessionWords[currentWordIndex] ?? null

  const endSession = () => {
    if (isSessionEndingRef.current || stageRef.current !== 'running') {
      return
    }

    isSessionEndingRef.current = true

    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    sessionDeadlineRef.current = null
    setTimeLeft(0)
    setStage('summary')
  }

  const moveToNextWord = () => {
    const nextIndex = currentWordIndex + 1

    if (nextIndex < sessionWords.length) {
      setCurrentWordIndex(nextIndex)
      return
    }

    setSessionWords(shuffleWords(words))
    setCurrentWordIndex(0)
  }

  const startSprint = () => {
    if (words.length === 0) {
      setErrorMessage('Add some words to Supabase before starting Sprint mode.')
      return
    }

    isSessionEndingRef.current = false
    sessionDeadlineRef.current = Date.now() + SPRINT_DURATION_SECONDS * 1000
    setSessionWords(shuffleWords(words))
    setCurrentWordIndex(0)
    setUserAnswer('')
    setTimeLeft(SPRINT_DURATION_SECONDS)
    setCorrectCount(0)
    setWrongCount(0)
    setTotalAnswered(0)
    setSaveErrorMessage('')
    setErrorMessage('')
    setLastAcceptedTranslations('')
    setLastAnswerWasCorrect(null)
    setStage('running')
  }

  const resetSprint = () => {
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    isSessionEndingRef.current = false
    sessionDeadlineRef.current = null
    setSessionWords([])
    setCurrentWordIndex(0)
    setUserAnswer('')
    setTimeLeft(SPRINT_DURATION_SECONDS)
    setCorrectCount(0)
    setWrongCount(0)
    setTotalAnswered(0)
    setSaveErrorMessage('')
    setErrorMessage('')
    setLastAcceptedTranslations('')
    setLastAnswerWasCorrect(null)
    setStage('setup')
  }

  const handleSubmitAnswer = async () => {
    if (
      !currentWord ||
      !userAnswer.trim() ||
      stageRef.current !== 'running' ||
      isSavingAnswer
    ) {
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

      setTotalAnswered((currentTotal) => currentTotal + 1)
      setLastAcceptedTranslations(result.formattedAcceptedTranslations)
      setLastAnswerWasCorrect(result.isCorrect)

      if (result.isCorrect) {
        setCorrectCount((currentCount) => currentCount + 1)
      } else {
        setWrongCount((currentCount) => currentCount + 1)
      }

      setUserAnswer('')

      if (sessionDeadlineRef.current && Date.now() >= sessionDeadlineRef.current) {
        endSession()
        return
      }

      if (stageRef.current === 'running') {
        moveToNextWord()
      }
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error ? error.message : 'Could not save your sprint answer.'
      )
    } finally {
      setIsSavingAnswer(false)
    }
  }

  const stats = useMemo(
    () => [
      { label: 'Correct', value: correctCount },
      { label: 'Wrong', value: wrongCount },
      { label: 'Answered', value: totalAnswered },
    ],
    [correctCount, totalAnswered, wrongCount]
  )

  if (isLoading) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Sprint</span>
        <h2>Loading sprint words...</h2>
        <p>Preparing a fast 35-second session from your vocabulary.</p>
      </section>
    )
  }

  if (stage === 'setup') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Sprint</span>
        <h2>35-second sprint</h2>
        <p>Answer as many words as you can before the timer runs out.</p>

        <div className="sprint-setup-card">
          <div className="sprint-timer sprint-timer--large" aria-label="Sprint timer">
            {timeLeft}s
          </div>

          <div className="sprint-stats-grid">
            {stats.map((item) => (
              <article key={item.label} className="quiz-summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <button type="button" className="primary-button" onClick={startSprint}>
          Start sprint
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
        <span className="page-section__tag">Sprint</span>
        <h2>Sprint complete</h2>
        <p className="quiz-summary-score">
          You answered {totalAnswered} words in 35 seconds.
        </p>

        <div className="sprint-summary-header">
          <div className="sprint-timer" aria-label="Sprint finished timer">
            0s
          </div>
        </div>

        <div className="sprint-stats-grid">
          {stats.map((item) => (
            <article key={item.label} className="quiz-summary-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="practice-actions">
          <button type="button" className="primary-button" onClick={resetSprint}>
            New sprint
          </button>
        </div>
      </section>
    )
  }

  if (!currentWord) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Sprint</span>
        <h2>Could not start this sprint.</h2>
        <p>Try again and we will prepare a fresh timed run.</p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Sprint</span>

      <div className="sprint-summary-header">
        <div className="sprint-timer" aria-label={`${timeLeft} seconds remaining`}>
          {timeLeft}s
        </div>

        <div className="sprint-inline-stats" aria-label="Sprint score">
          {stats.map((item) => (
            <span key={item.label} className="mistake-chip">
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>

      <div className="practice-word-block practice-word-block--enter">
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
          void handleSubmitAnswer()
        }}
      >
        <label className="auth-form__field">
          <span>Your answer</span>
          <input
            ref={answerInputRef}
            type="text"
            value={userAnswer}
            disabled={isSavingAnswer || stage !== 'running'}
            onChange={(event) => {
              setUserAnswer(event.target.value)
              if (saveErrorMessage) {
                setSaveErrorMessage('')
              }
            }}
            placeholder="Write the Spanish translation"
          />
        </label>

        <div className="practice-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={!userAnswer.trim() || isSavingAnswer || stage !== 'running'}
          >
            {isSavingAnswer ? 'Checking...' : 'Submit answer'}
          </button>
        </div>
      </form>

      {saveErrorMessage ? (
        <p className="auth-message auth-message--error">{saveErrorMessage}</p>
      ) : null}

      {lastAnswerWasCorrect === true ? (
        <p className="auth-message auth-message--success">
          Correct! Accepted answers: {lastAcceptedTranslations}.
        </p>
      ) : null}

      {lastAnswerWasCorrect === false ? (
        <p className="auth-message auth-message--error">
          Incorrect. Correct answers: {lastAcceptedTranslations}.
        </p>
      ) : null}
    </section>
  )
}

export default SprintPractice
