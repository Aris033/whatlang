import { useEffect, useMemo, useState } from 'react'
import { fetchMistakes } from '../services/mistakesService'
import { submitWordAnswer } from '../services/reviewService'
import type { Mistake } from '../types/mistake'
import { formatTranslationsForDisplay } from '../utils/translations'

type AnswerStatus = 'idle' | 'correct' | 'incorrect'
const MISTAKES_PER_PAGE = 5

type MistakeReviewState = {
  answer: string
  feedbackStatus: AnswerStatus
  feedbackMessage: string
  saveErrorMessage: string
  isSaving: boolean
  isTranslationVisible: boolean
}

function createInitialReviewState(): MistakeReviewState {
  return {
    answer: '',
    feedbackStatus: 'idle',
    feedbackMessage: '',
    saveErrorMessage: '',
    isSaving: false,
    isTranslationVisible: false,
  }
}

function Mistakes() {
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [reviewStateByWordId, setReviewStateByWordId] = useState<
    Record<number, MistakeReviewState>
  >({})

  useEffect(() => {
    void loadMistakes()
  }, [])

  const loadMistakes = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const fetchedMistakes = await fetchMistakes()

      setMistakes(fetchedMistakes)
      setCurrentPage((currentPageValue) => {
        const nextTotalPages = Math.max(
          1,
          Math.ceil(fetchedMistakes.length / MISTAKES_PER_PAGE)
        )

        return Math.min(currentPageValue, nextTotalPages)
      })
      setReviewStateByWordId((current) => {
        const nextState: Record<number, MistakeReviewState> = {}

        for (const mistake of fetchedMistakes) {
          nextState[mistake.word_id] =
            current[mistake.word_id] ?? createInitialReviewState()
        }

        return nextState
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not load mistakes.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const updateReviewState = (
    wordId: number,
    updater: (state: MistakeReviewState) => MistakeReviewState
  ) => {
    setReviewStateByWordId((current) => ({
      ...current,
      [wordId]: updater(current[wordId] ?? createInitialReviewState()),
    }))
  }

  const handleCheckAnswer = async (mistake: Mistake) => {
    const state = reviewStateByWordId[mistake.word_id] ?? createInitialReviewState()

    if (!state.answer.trim()) {
      return
    }

    updateReviewState(mistake.word_id, (current) => ({
      ...current,
      saveErrorMessage: '',
      feedbackStatus: 'idle',
      feedbackMessage: '',
      isSaving: true,
    }))

    try {
      const result = await submitWordAnswer({
        wordId: mistake.word_id,
        userAnswer: state.answer,
        correctTranslation: mistake.word.spanish_translation,
      })

      updateReviewState(mistake.word_id, (current) => ({
        ...current,
        answer: '',
        isSaving: false,
        feedbackStatus: result.isCorrect ? 'correct' : 'incorrect',
        feedbackMessage: result.isCorrect
          ? 'Correct!'
          : `Incorrect. Correct answers: ${result.formattedAcceptedTranslations}`,
      }))

      await loadMistakes()
    } catch (error) {
      updateReviewState(mistake.word_id, (current) => ({
        ...current,
        isSaving: false,
        saveErrorMessage:
          error instanceof Error ? error.message : 'Could not save your answer.',
      }))
    }
  }

  const toggleTranslation = (wordId: number) => {
    updateReviewState(wordId, (current) => ({
      ...current,
      isTranslationVisible: !current.isTranslationVisible,
    }))
  }

  const totalPages = Math.max(1, Math.ceil(mistakes.length / MISTAKES_PER_PAGE))
  const paginatedMistakes = useMemo(() => {
    const startIndex = (currentPage - 1) * MISTAKES_PER_PAGE

    return mistakes.slice(startIndex, startIndex + MISTAKES_PER_PAGE)
  }, [currentPage, mistakes])

  if (isLoading) {
    return (
      <section className="page-section">
        <span className="page-section__tag">Review</span>
        <h2>Loading your mistakes...</h2>
        <p>Fetching your current review words from Supabase.</p>
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
        {paginatedMistakes.map((mistake) => {
          const state =
            reviewStateByWordId[mistake.word_id] ?? createInitialReviewState()

          return (
            <article key={mistake.word_id} className="mistake-card">
              <div className="mistake-card__header">
                <div className="mistake-card__title-group">
                  <h3>{mistake.word.english_word}</h3>
                </div>
              </div>

              <div className="mistake-card__body">
                <div className="practice-meta mistake-card__chips">
                  <span>Wrong: {mistake.pending_wrong_count}</span>
                  {mistake.word.topic ? <span>Topic: {mistake.word.topic}</span> : null}
                  <button
                    type="button"
                    className="mistake-chip mistake-chip--interactive"
                    onClick={() => toggleTranslation(mistake.word_id)}
                  >
                    {state.isTranslationVisible
                      ? `Translation: ${formatTranslationsForDisplay(mistake.word.spanish_translation)}`
                      : 'View translation'}
                  </button>
                </div>

                <form
                  className="mistake-card__review"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!state.answer.trim() || state.isSaving) {
                      return
                    }

                    void handleCheckAnswer(mistake)
                  }}
                >
                  <input
                    type="text"
                    value={state.answer}
                    onChange={(event) =>
                      updateReviewState(mistake.word_id, (current) => ({
                        ...current,
                        answer: event.target.value,
                        feedbackStatus: 'idle',
                        feedbackMessage: '',
                        saveErrorMessage: '',
                      }))
                    }
                    className="mistake-card__input"
                    placeholder="Type the Spanish translation"
                  />

                  <button
                    type="submit"
                    className="mistake-card__check"
                    disabled={!state.answer.trim() || state.isSaving}
                  >
                    {state.isSaving ? 'Checking...' : 'Check'}
                  </button>
                </form>

                {state.saveErrorMessage ? (
                  <p className="auth-message auth-message--error">
                    {state.saveErrorMessage}
                  </p>
                ) : null}

                {state.feedbackStatus === 'correct' ? (
                  <p className="auth-message auth-message--success">
                    {state.feedbackMessage}
                  </p>
                ) : null}

                {state.feedbackStatus === 'incorrect' ? (
                  <p className="auth-message auth-message--error">
                    {state.feedbackMessage}
                  </p>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mistakes-pagination mistakes-pagination--floating">
        <span className="mistakes-pagination__summary">
          Showing {(currentPage - 1) * MISTAKES_PER_PAGE + 1}-
          {Math.min(currentPage * MISTAKES_PER_PAGE, mistakes.length)} of {mistakes.length}
        </span>

        <div className="mistakes-pagination__actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span className="mistakes-pagination__page">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

export default Mistakes
