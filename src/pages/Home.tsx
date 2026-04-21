import type { AppPage } from '../types/navigation'

type HomeProps = {
  onNavigate: (page: AppPage) => void
}

function Home({ onNavigate }: HomeProps) {
  return (
    <section className="home-dashboard">
      <div className="home-hero">
        <span className="page-section__tag">WhatLang</span>
        <h1>Build a calmer, stronger English habit one word at a time.</h1>
        <p>
          Practice quickly, revisit what still feels shaky, and keep your
          learning rhythm light but consistent.
        </p>
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
          </div>

          <span className="home-card__coming-soon">Coming soon</span>
        </article>
      </div>
    </section>
  )
}

export default Home
