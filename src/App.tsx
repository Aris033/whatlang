import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
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

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [signOutError, setSignOutError] = useState('')
  const [currentPage, setCurrentPage] = useState<AppPage>('home')
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)

  useEffect(() => {
    let isMounted = true
    let toastTimeoutId: number | undefined

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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setSignOutError('')
      setCurrentPage('home')
      setIsLoadingSession(false)

      if (event === 'SIGNED_IN') {
        setShowWelcomeToast(true)

        if (toastTimeoutId) {
          window.clearTimeout(toastTimeoutId)
        }

        toastTimeoutId = window.setTimeout(() => {
          setShowWelcomeToast(false)
        }, 1300)
      }

      if (event === 'SIGNED_OUT') {
        setShowWelcomeToast(false)
      }
    })

    return () => {
      isMounted = false
      if (toastTimeoutId) {
        window.clearTimeout(toastTimeoutId)
      }
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
      {showWelcomeToast ? (
        <div className="app-toast" role="status" aria-live="polite">
          <strong>Welcome back</strong>
          <span>You&apos;re signed in and ready to practise.</span>
        </div>
      ) : null}

      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true">
            WL
          </span>
          <div>
            <p className="app-header__name">WhatLang</p>
            <p className="app-header__tagline">English practice with a lighter rhythm</p>
          </div>
        </div>

        <div className="app-header__nav-area">
          <NavBar
            currentPage={currentPage}
            items={navigationItems}
            onNavigate={setCurrentPage}
          />

          <div className="user-menu">
            <span className="user-menu__email">{session.user.email ?? 'unknown email'}</span>
            <button
              type="button"
              className="user-menu__signout"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="page-content">
        {signOutError ? (
          <p className="auth-message auth-message--error">{signOutError}</p>
        ) : null}

        {currentPage === 'home' ? <Home onNavigate={setCurrentPage} /> : null}
        {currentPage === 'practice' ? <Practice /> : null}
        {currentPage === 'mistakes' ? <Mistakes /> : null}
      </main>
    </div>
  )
}

export default App
