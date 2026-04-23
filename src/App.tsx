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

const GUEST_MODE_STORAGE_KEY = 'whatlang_guest_mode'

const navigationItems: NavigationItem[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'mistakes', label: 'Mistakes' },
]

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [signOutError, setSignOutError] = useState('')
  const [currentPage, setCurrentPage] = useState<AppPage>('home')
  const [practiceViewVersion, setPracticeViewVersion] = useState(0)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page)

    if (page === 'practice') {
      setPracticeViewVersion((currentValue) => currentValue + 1)
    }
  }

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
        const storedGuestMode =
          window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true'

        setIsGuestMode(!data.session && storedGuestMode)
        setCurrentPage(!data.session && storedGuestMode ? 'practice' : 'home')
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
      setPracticeViewVersion(0)
      setIsLoadingSession(false)

      if (event === 'SIGNED_IN') {
        setIsGuestMode(false)
        window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY)
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
        setIsGuestMode(false)
        window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY)
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

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSignOut = async () => {
    setSignOutError('')

    const { error } = await supabase.auth.signOut()

    if (error) {
      setSignOutError(error.message)
    }
  }

  const handleContinueAsGuest = () => {
    setIsGuestMode(true)
    setCurrentPage('practice')
    setPracticeViewVersion((currentValue) => currentValue + 1)
    window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true')
  }

  const handleExitGuestMode = () => {
    setIsGuestMode(false)
    setCurrentPage('home')
    setPracticeViewVersion(0)
    window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY)
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

  if (!session && !isGuestMode) {
    return <Login onContinueAsGuest={handleContinueAsGuest} />
  }

  const isAuthenticated = Boolean(session)
  const availableNavigationItems = isAuthenticated
    ? navigationItems
    : navigationItems.filter((item) => item.id === 'practice')

  return (
    <div className="app-shell">
      {showWelcomeToast && isAuthenticated ? (
        <div className="app-toast" role="status" aria-live="polite">
          <strong>Welcome back</strong>
          <span>You&apos;re signed in and ready to practise.</span>
        </div>
      ) : null}

      <header className={isHeaderScrolled ? 'app-header is-scrolled' : 'app-header'}>
        <button
          type="button"
          className="app-header__brand"
          onClick={() => handleNavigate(isAuthenticated ? 'home' : 'practice')}
          aria-label={isAuthenticated ? 'Go to Home' : 'Go to Practice'}
        >
          <span className="app-header__logo" aria-hidden="true">
            WL
          </span>
          <span className="app-header__brand-copy">
            <span className="app-header__name">WhatLang</span>
            <span className="app-header__tagline">
              English practice with a lighter rhythm
            </span>
          </span>
        </button>

        <div className="app-header__nav-area">
          <NavBar
            currentPage={currentPage}
            items={availableNavigationItems}
            onNavigate={handleNavigate}
          />

          <div className="user-menu">
            {isAuthenticated ? (
              <>
                <span className="user-menu__email">
                  {session?.user.email ?? 'unknown email'}
                </span>
                <button
                  type="button"
                  className="user-menu__signout"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <span className="user-menu__email">Guest mode</span>
                <button
                  type="button"
                  className="user-menu__signout"
                  onClick={handleExitGuestMode}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-content">
        {signOutError ? (
          <p className="auth-message auth-message--error">{signOutError}</p>
        ) : null}

        {isAuthenticated && currentPage === 'home' ? (
          <Home onNavigate={handleNavigate} />
        ) : null}
        {currentPage === 'practice' ? (
          <Practice key={practiceViewVersion} isGuest={!isAuthenticated} />
        ) : null}
        {isAuthenticated && currentPage === 'mistakes' ? <Mistakes /> : null}
      </main>
    </div>
  )
}

export default App
