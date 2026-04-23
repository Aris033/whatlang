import { useState } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'sign-in' | 'sign-up'

type LoginProps = {
  onContinueAsGuest: () => void
}

function Login({ onContinueAsGuest }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)

  const isSignIn = mode === 'sign-in'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const credentials = {
      email: email.trim(),
      password,
    }

    const result = isSignIn
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp(credentials)

    setIsSubmitting(false)

    if (result.error) {
      setErrorMessage(result.error.message)
      return
    }

    if (isSignIn) {
      setSuccessMessage('Signed in successfully.')
      return
    }

    if (result.data.session) {
      setSuccessMessage('Account created and signed in successfully.')
      return
    }

    setSuccessMessage(
      'Account created. Check your email if confirmation is required in Supabase.'
    )
  }

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <p className="hero-banner__eyebrow">WhatLang</p>
        <div className="hero-banner__content">
          <div>
            <h1>Learn English with your own practice space.</h1>
            <p className="hero-banner__description">
              Sign in or create an account to save progress and prepare the app
              for real vocabulary sessions.
            </p>
          </div>
          <div className="hero-banner__card">
            <span className="hero-banner__badge">Supabase Auth</span>
            <p>Email and password authentication is now connected.</p>
          </div>
        </div>
      </header>

      <main className="page-content">
        <section className="auth-card">
          <span className="auth-card__tag">Access</span>
          <h2>{isSignIn ? 'Sign in to continue' : 'Create your account'}</h2>
          <p>
            {isSignIn
              ? 'Use your email and password to enter the app.'
              : 'Create a simple email and password account to get started.'}
          </p>

          <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={isSignIn ? 'auth-toggle__button is-active' : 'auth-toggle__button'}
              onClick={() => setMode('sign-in')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={!isSignIn ? 'auth-toggle__button is-active' : 'auth-toggle__button'}
              onClick={() => setMode('sign-up')}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-form__field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="auth-form__field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>

            {errorMessage ? (
              <p className="auth-message auth-message--error">{errorMessage}</p>
            ) : null}

            {successMessage ? (
              <p className="auth-message auth-message--success">{successMessage}</p>
            ) : null}

            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : isSignIn
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>
        </section>

        <div className="auth-guest-entry">
          <button
            type="button"
            className="auth-guest-entry__button"
            onClick={() => setIsGuestModalOpen(true)}
          >
            Try without signing in
          </button>
        </div>
      </main>

      {isGuestModalOpen ? (
        <div
          className="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-preview-title"
        >
          <div
            className="auth-modal__backdrop"
            onClick={() => setIsGuestModalOpen(false)}
          />

          <div className="auth-modal__panel">
            <div className="auth-modal__preview" aria-hidden="true">
              <div className="auth-modal__preview-header">
                <span className="auth-modal__preview-pill">Vocabulary</span>
                <span className="auth-modal__preview-pill auth-modal__preview-pill--muted">
                  Full account
                </span>
              </div>

              <div className="auth-modal__preview-card">
                <strong>What you unlock with an account</strong>
                <span>Free Practice, Quiz, Category, Sprint and Mistakes review.</span>
              </div>

              <div className="auth-modal__preview-grid">
                <div className="auth-modal__preview-box">
                  <span>Saved answers</span>
                </div>
                <div className="auth-modal__preview-box">
                  <span>Review history</span>
                </div>
                <div className="auth-modal__preview-box">
                  <span>Progress tracking</span>
                </div>
                <div className="auth-modal__preview-box">
                  <span>More modes</span>
                </div>
              </div>
            </div>

            <div className="auth-modal__content">
              <span className="auth-card__tag">Guest preview</span>
              <h2 id="guest-preview-title">Try WhatLang without signing in</h2>
              <p>
                You can test the app right now, but guest mode is only a small
                preview of the full experience.
              </p>

              <div className="auth-guest-list" aria-label="Guest mode limitations">
                <p>You will only be able to use Free Practice.</p>
                <p>You will not save answers, progress or review history.</p>
                <p>Quiz, Category, Sprint and Mistakes stay locked until you sign in.</p>
              </div>

              <div className="auth-modal__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsGuestModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={onContinueAsGuest}
                >
                  Continue as guest
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Login
