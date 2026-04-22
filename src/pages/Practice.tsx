import { useState } from 'react'
import CategoryPractice from '../components/CategoryPractice'
import FreePractice from '../components/FreePractice'
import QuizPractice from '../components/QuizPractice'
import SprintPractice from '../components/SprintPractice'
import type { PracticeMode } from '../types/practice'

type PracticeAreaCard = {
  id: 'vocabulary' | 'phrasal-verbs' | 'verbs' | 'grammar'
  title: string
  description: string
  eyebrow: string
  isAvailable: boolean
}

type PracticeModeCard = {
  id: Extract<PracticeMode, 'free-practice' | 'quiz' | 'category' | 'sprint'>
  title: string
  description: string
  isAvailable: boolean
}

const practiceAreas: PracticeAreaCard[] = [
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    description: 'Build confidence with word practice, quizzes, categories and sprint sessions.',
    eyebrow: 'Available now',
    isAvailable: true,
  },
  {
    id: 'phrasal-verbs',
    title: 'Phrasal Verbs',
    description: 'Practise natural combinations like get up, look for and turn on.',
    eyebrow: 'Coming soon',
    isAvailable: false,
  },
  {
    id: 'verbs',
    title: 'Verbs',
    description: 'Work on tenses, forms and the core verb patterns you use every day.',
    eyebrow: 'Coming soon',
    isAvailable: false,
  },
  {
    id: 'grammar',
    title: 'Grammar',
    description: 'Train sentence structure, articles, prepositions and everyday accuracy.',
    eyebrow: 'Coming soon',
    isAvailable: false,
  },
]

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
    isAvailable: true,
  },
  {
    id: 'sprint',
    title: 'Sprint',
    description: 'Answer as many as you can in 35 seconds.',
    isAvailable: true,
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
            onClick={() => setCurrentMode('vocabulary')}
          >
            Back to vocabulary
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
            onClick={() => setCurrentMode('vocabulary')}
          >
            Back to vocabulary
          </button>
        </div>

        <QuizPractice />
      </div>
    )
  }

  if (currentMode === 'category') {
    return (
      <div className="practice-shell">
        <div className="practice-subnav">
          <button
            type="button"
            className="practice-subnav__back"
            onClick={() => setCurrentMode('vocabulary')}
          >
            Back to vocabulary
          </button>
        </div>

        <CategoryPractice />
      </div>
    )
  }

  if (currentMode === 'sprint') {
    return (
      <div className="practice-shell">
        <div className="practice-subnav">
          <button
            type="button"
            className="practice-subnav__back"
            onClick={() => setCurrentMode('vocabulary')}
          >
            Back to vocabulary
          </button>
        </div>

        <SprintPractice />
      </div>
    )
  }

  if (currentMode === 'vocabulary') {
    return (
      <section className="page-section">
        <span className="page-section__tag">Practice</span>
        <div className="practice-subnav practice-subnav--page">
          <button
            type="button"
            className="practice-subnav__back"
            onClick={() => setCurrentMode('menu')}
          >
            Back to areas
          </button>
        </div>

        <h2>Vocabulary modes</h2>
        <p>
          Choose how you want to practise vocabulary right now. Each mode gives
          you a different pace and structure.
        </p>

        <div className="practice-modes-grid">
          {practiceModes.map((mode) => (
            <article
              key={mode.id}
              className={
                mode.isAvailable ? 'practice-mode-card is-available' : 'practice-mode-card'
              }
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

  return (
    <section className="page-section">
      <span className="page-section__tag">Practice</span>
      <h2>Choose your area</h2>
      <p>
        Start with vocabulary today, and keep an eye on the next learning areas
        that are on the way.
      </p>

      <div className="practice-areas-grid">
        {practiceAreas.map((area) => (
          <article
            key={area.id}
            className={
              area.isAvailable
                ? 'practice-area-card is-available'
                : 'practice-area-card'
            }
          >
            <div className="practice-area-card__content">
              <span className="practice-area-card__eyebrow">{area.eyebrow}</span>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
            </div>

            {area.isAvailable ? (
              <button
                type="button"
                className="primary-button practice-area-card__action"
                onClick={() => setCurrentMode('vocabulary')}
              >
                Open area
              </button>
            ) : (
              <span className="practice-area-card__coming-soon">Coming soon</span>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default Practice
