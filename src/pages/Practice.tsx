import { useEffect, useState } from 'react'
import { submitWordAnswer } from '../services/reviewService'
import { fetchWords } from '../services/wordsService'
import type { Word } from '../types/word'

type AnswerStatus = 'idle' | 'correct' | 'incorrect'

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

  const handleCheckAnswer = async () => {
    if (!currentWord) {
      return
    }

    setSaveErrorMessage('')
    setIsSavingAnswer(true)

    try {
      const result = await submitWordAnswer({
        wordId: currentWord.id,
        userAnswer,
        correctTranslation: currentWord.spanish_translation,
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
      <h2>Translate this word into Spanish.</h2>
      <p className="practice-word">{currentWord.english_word}</p>

      <div className="practice-meta">
        {currentWord.topic ? <span>Topic: {currentWord.topic}</span> : null}
        {currentWord.difficulty ? (
          <span>Difficulty: {currentWord.difficulty}</span>
        ) : null}
      </div>

      <div className="practice-form">
        <label className="auth-form__field">
          <span>Your answer</span>
          <input
            type="text"
            value={userAnswer}
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
            className="primary-button"
            onClick={() => void handleCheckAnswer()}
            disabled={!userAnswer.trim() || isSavingAnswer}
          >
            {isSavingAnswer ? 'Saving answer...' : 'Check answer'}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleNextWord}
            disabled={isSavingAnswer}
          >
            Next word
          </button>
        </div>
      </div>

      {saveErrorMessage ? (
        <p className="auth-message auth-message--error">{saveErrorMessage}</p>
      ) : null}

      {answerStatus === 'correct' ? (
        <p className="auth-message auth-message--success">
          Correct! The translation is {currentWord.spanish_translation}.
        </p>
      ) : null}

      {answerStatus === 'incorrect' ? (
        <p className="auth-message auth-message--error">
          Incorrect. The correct translation is {currentWord.spanish_translation}.
        </p>
      ) : null}
    </section>
  )
}

export default Practice
