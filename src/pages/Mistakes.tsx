import { useEffect, useState } from 'react'
import { fetchMistakes } from '../services/mistakesService'
import type { Mistake } from '../types/mistake'

function formatAnsweredAt(value: string) {
  return new Date(value).toLocaleString()
}

function Mistakes() {
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadMistakes = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const fetchedMistakes = await fetchMistakes()

        if (!isMounted) {
          return
        }

        setMistakes(fetchedMistakes)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Could not load mistakes.'
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadMistakes()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Review</span>
        <h2>Loading your mistakes...</h2>
        <p>Fetching your latest incorrect answers from Supabase.</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Review</span>
        <h2>Could not load your mistakes.</h2>
        <p className="auth-message auth-message--error">{errorMessage}</p>
      </section>
    )
  }

  if (mistakes.length === 0) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Review</span>
        <h2>No mistakes yet.</h2>
        <p>
          Nice work. Once you miss some words in practice, they will appear here
          for review.
        </p>
      </section>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Review</span>
      <h2>Your current mistakes</h2>
      <p>
        These words still need review because your wrong answers are higher than
        your correct answers.
      </p>

      <div className="mistakes-list">
        {mistakes.map((mistake) => (
          <article key={mistake.word_id} className="mistake-card">
            <div className="mistake-card__header">
              <h3>{mistake.word.english_word}</h3>
              <span>{formatAnsweredAt(mistake.last_answered_at)}</span>
            </div>

            <div className="practice-meta">
              <span>Translation: {mistake.word.spanish_translation}</span>
              <span>Wrong: {mistake.wrong_count}</span>
              <span>Correct: {mistake.correct_count}</span>
              <span>Total attempts: {mistake.total_attempts}</span>
              {mistake.word.topic ? <span>Topic: {mistake.word.topic}</span> : null}
              {mistake.word.difficulty ? (
                <span>Difficulty: {mistake.word.difficulty}</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Mistakes
