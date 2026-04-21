import { useEffect, useState } from 'react'
import { fetchDashboardSummary } from '../services/dashboardService'
import type { DashboardSummary } from '../types/dashboard'
import type { AppPage } from '../types/navigation'

type HomeProps = {
  onNavigate: (page: AppPage) => void
}

function Home({ onNavigate }: HomeProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadSummary = async () => {
      setIsLoadingSummary(true)
      setSummaryError('')

      try {
        const nextSummary = await fetchDashboardSummary()

        if (!isMounted) {
          return
        }

        setSummary(nextSummary)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSummaryError(
          error instanceof Error ? error.message : 'Could not load dashboard summary.'
        )
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false)
        }
      }
    }

    void loadSummary()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="home-dashboard">
      <div className="home-hero">
        <span className="page-section__tag">WhatLang</span>
        <h1>Build a calmer, stronger English habit one word at a time.</h1>
        <p>
          Practice quickly, revisit what still feels shaky, and keep your
          learning rhythm light but consistent.
        </p>

        <div className="home-metrics" aria-label="Dashboard summary">
          <div className="home-metric">
            <span className="home-metric__label">Words ready</span>
            <strong className="home-metric__value">
              {isLoadingSummary ? '...' : summary?.totalWords ?? 0}
            </strong>
          </div>

          <div className="home-metric">
            <span className="home-metric__label">To review</span>
            <strong className="home-metric__value">
              {isLoadingSummary ? '...' : summary?.wordsToReview ?? 0}
            </strong>
          </div>

          <div className="home-metric">
            <span className="home-metric__label">Practised</span>
            <strong className="home-metric__value">
              {isLoadingSummary ? '...' : summary?.wordsPractised ?? 0}
            </strong>
          </div>
        </div>

        {summaryError ? <p className="home-hero__error">{summaryError}</p> : null}
      </div>

      <div className="home-grid">
        <article className="home-card home-card--primary">
          <div className="home-card__content">
            <span className="home-card__eyebrow">Practice</span>
            <h2>Warm up with a new word now.</h2>
            <p>
              Jump straight into short translation rounds and keep momentum
              without overthinking the session.
            </p>

            {!isLoadingSummary && summary ? (
              <p className="home-card__microcopy">
                {summary.totalWords} words available to practise right now.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="primary-button home-card__action"
            onClick={() => onNavigate('practice')}
          >
            Start practice
          </button>
        </article>

        <article className="home-card">
          <div className="home-card__content">
            <span className="home-card__eyebrow">Mistakes</span>
            <h2>Review the words that still need attention.</h2>
            <p>
              Your mistake list stays focused on the vocabulary where wrong
              answers still outweigh the correct ones.
            </p>

            {!isLoadingSummary && summary ? (
              <p className="home-card__microcopy">
                {summary.wordsToReview} words currently need another look.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="secondary-button home-card__action"
            onClick={() => onNavigate('mistakes')}
          >
            Open mistakes
          </button>
        </article>

        <article className="home-card home-card--muted">
          <div className="home-card__content">
            <span className="home-card__eyebrow">Stats</span>
            <h2>Progress is coming soon.</h2>
            <p>
              Next up, we can turn your answer history into streaks, trends and
              a clearer view of improvement.
            </p>

            {!isLoadingSummary && summary ? (
              <p className="home-card__microcopy">
                You have already practised {summary.wordsPractised} unique words.
              </p>
            ) : null}
          </div>

          <span className="home-card__coming-soon">Coming soon</span>
        </article>
      </div>
    </section>
  )
}

export default Home
