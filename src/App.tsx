import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Login from './pages/Login'
import Mistakes from './pages/Mistakes'
import Practice from './pages/Practice'
import { supabase } from './lib/supabase'
import type { AppPage, NavigationItem } from './types/navigation'
import './App.css'

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'practice', label: 'Practice' },
  { id: 'mistakes', label: 'Mistakes' },
]

const pageComponents: Record<AppPage, ReactNode> = {
  home: <Home />,
  practice: <Practice />,
  mistakes: <Mistakes />,
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [signOutError, setSignOutError] = useState('')
  const [currentPage, setCurrentPage] = useState<AppPage>('home')

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setSignOutError(error.message)
      } else {
        setSession(data.session)
      }

      setIsLoadingSession(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSignOutError('')
      setCurrentPage('home')
      setIsLoadingSession(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    setSignOutError('')

    const { error } = await supabase.auth.signOut()

    if (error) {
      setSignOutError(error.message)
    }
  }

  if (isLoadingSession) {
    return (
      <div className="app-shell">
        <section className="auth-card auth-card--centered">
          <span className="auth-card__tag">WhatLang</span>
          <h1>Loading your session...</h1>
          <p>Checking whether you are already signed in.</p>
        </section>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <p className="hero-banner__eyebrow">WhatLang</p>
        <div className="hero-banner__content">
          <div>
            <h1>You are signed in.</h1>
            <p className="hero-banner__description">
              Your authentication is connected and the app is ready for the
              next step.
            </p>
          </div>
          <div className="hero-banner__card">
            <span className="hero-banner__badge">Authenticated</span>
            <p>
              Signed in as <strong>{session.user.email ?? 'unknown email'}</strong>
            </p>
          </div>
        </div>
      </header>

      <main className="page-content">
        <section className="auth-summary">
          <div>
            <span className="auth-card__tag">Session</span>
            <p className="auth-summary__email">
              Signed in as <strong>{session.user.email ?? 'unknown email'}</strong>
            </p>
          </div>

          <button type="button" className="secondary-button" onClick={handleSignOut}>
            Sign out
          </button>
        </section>

        {signOutError ? (
          <p className="auth-message auth-message--error">{signOutError}</p>
        ) : null}

        <NavBar
          currentPage={currentPage}
          items={navigationItems}
          onNavigate={setCurrentPage}
        />

        {pageComponents[currentPage]}
      </main>
    </div>
  )
}

export default App
