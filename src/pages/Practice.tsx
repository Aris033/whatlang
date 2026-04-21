import { useState } from 'react'
import FreePractice from '../components/FreePractice'
import QuizPractice from '../components/QuizPractice'
import type { PracticeMode } from '../types/practice'

type PracticeModeCard = {
  id: Exclude<PracticeMode, 'menu'>
  title: string
  description: string
  isAvailable: boolean
}

const practiceModes: PracticeModeCard[] = [
  {
    id: 'free-practice',
    title: 'Free Practice',
    description: 'Practice words freely with hint and reveal support.',
    isAvailable: true,
  },
  {
    id: 'quiz',
    title: 'Quiz',
    description: '10 questions by difficulty or at random.',
    isAvailable: true,
  },
  {
    id: 'category',
    title: 'Category',
    description: '5 questions from one selected category.',
    isAvailable: false,
  },
  {
    id: 'sprint',
    title: 'Sprint',
    description: 'Answer as many as you can in 35 seconds.',
    isAvailable: false,
  },
]

function Practice() {
  const [currentMode, setCurrentMode] = useState<PracticeMode>('menu')

  if (currentMode === 'free-practice') {
    return (
      <div className="practice-shell">
        <div className="practice-subnav">
          <button
            type="button"
            className="practice-subnav__back"
            onClick={() => setCurrentMode('menu')}
          >
            Back to modes
          </button>
        </div>

        <FreePractice />
      </div>
    )
  }

  if (currentMode === 'quiz') {
    return (
      <div className="practice-shell">
        <div className="practice-subnav">
          <button
            type="button"
            className="practice-subnav__back"
            onClick={() => setCurrentMode('menu')}
          >
            Back to modes
          </button>
        </div>

        <QuizPractice />
      </div>
    )
  }

  return (
    <section className="page-section">
      <span className="page-section__tag">Practice</span>
      <h2>Choose your mode</h2>
      <p>
        Pick the kind of session you want. Free practice is ready now, and the
        next modes are set up to land cleanly.
      </p>

      <div className="practice-modes-grid">
        {practiceModes.map((mode) => (
          <article
            key={mode.id}
            className={mode.isAvailable ? 'practice-mode-card is-available' : 'practice-mode-card'}
          >
            <div className="practice-mode-card__content">
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
            </div>

            {mode.isAvailable ? (
              <button
                type="button"
                className="primary-button practice-mode-card__action"
                onClick={() => setCurrentMode(mode.id)}
              >
                Open mode
              </button>
            ) : (
              <span className="practice-mode-card__coming-soon">Coming soon</span>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default Practice
