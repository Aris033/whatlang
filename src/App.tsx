import { useState } from 'react'
import type { ReactNode } from 'react'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Login from './pages/Login'
import Mistakes from './pages/Mistakes'
import Practice from './pages/Practice'
import type { AppPage, NavigationItem } from './types/navigation'
import './App.css'

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'practice', label: 'Practice' },
  { id: 'mistakes', label: 'Mistakes' },
  { id: 'login', label: 'Login' },
]

const pageComponents: Record<AppPage, ReactNode> = {
  home: <Home />,
  practice: <Practice />,
  mistakes: <Mistakes />,
  login: <Login />,
}

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home')

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <p className="hero-banner__eyebrow">WhatLang</p>
        <div className="hero-banner__content">
          <div>
            <h1>Practice English vocabulary and useful phrases every day.</h1>
            <p className="hero-banner__description">
              A simple base app to learn, translate and review what costs you
              the most.
            </p>
          </div>
          <div className="hero-banner__card">
            <span className="hero-banner__badge">Access</span>
            <p>Sign in to save your progress and practice.</p>
            <button className="login-button" onClick={() => setCurrentPage('login')}>
              Login
            </button>
          </div>
        </div>
      </header>

      <NavBar
        currentPage={currentPage}
        items={navigationItems}
        onNavigate={setCurrentPage}
      />

      <main className="page-content">{pageComponents[currentPage]}</main>
    </div>
  )
}

export default App
