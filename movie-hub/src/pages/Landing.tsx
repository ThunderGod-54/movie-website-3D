import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { DoodleUniverse } from '../components/DoodleUniverse'
import { SignInModal } from '../components/SignInModal'
import { useScrollActivation } from '../hooks/useDepthScroll'
import './Landing.css'
import './LandingMotion.css'

function Landing() {
  const isActivated = useScrollActivation()
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [signInOriginRect, setSignInOriginRect] = useState<DOMRect | null>(null)
  const signInBtnRef = useRef<HTMLButtonElement>(null)

  const handleOpenSignIn = () => {
    if (signInBtnRef.current) {
      const rect = signInBtnRef.current.getBoundingClientRect()
      setSignInOriginRect(rect)
    }
    setIsSignInOpen(true)
  }

  const handleCloseSignIn = () => {
    setIsSignInOpen(false)
  }

  return (
    <div className={`landing-page ${isActivated ? 'is-activated' : 'is-initial'}`}>
      <header className="landing-header">
        <Link className="wordmark" to="/" aria-label="Goodshow home">
          <svg viewBox="0 0 42 42" aria-hidden="true">
            <path d="M8 13q1-5 6-5h15q5 0 5 5v16q0 5-5 5H14q-6 0-6-6zM14 8l4 7m7-7-4 7M8 19l9 4-9 4m26-8-9 4 9 4M17 23q4-4 8 0m-8 6q4 4 8 0" />
          </svg>
          <span>goodshow</span>
        </Link>

        {/* Navigation items: About → Sign In → Enter Theater (post-scroll) */}
        <div className="landing-header-actions">
          <a className="about-link" href="#about">About <span aria-hidden="true">↗</span></a>

          <button
            ref={signInBtnRef}
            type="button"
            className={`nav-signin-btn ${isSignInOpen ? 'is-emerging-origin' : ''}`}
            onClick={handleOpenSignIn}
            aria-haspopup="dialog"
            aria-expanded={isSignInOpen}
            aria-label="Sign In to Goodshow Cinema"
          >
            <span>Sign In</span>
          </button>

          <Link
            className={`header-enter-btn ${isActivated ? 'is-visible' : ''}`}
            to="/lobby"
            aria-label="Enter the theatre"
            tabIndex={isActivated ? 0 : -1}
          >
            <span>Enter theatre</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section
          className={`landing-hero ${isActivated ? 'is-faded' : ''}`}
          aria-labelledby="landing-title"
          aria-hidden={isActivated}
        >
          <p className="eyebrow"><span className="eyebrow-star" aria-hidden="true">✳</span> YOUR NEIGHBOURHOOD PICTURE HOUSE</p>
          <h1 id="landing-title">A little <span>movie</span><br />magic, this way.</h1>
          <p className="hero-copy">Good stories. Comfy seats. Popcorn for the plot.<br className="desktop-break" /> Your next favourite night out starts here.</p>
          <Link className="enter-button" to="/lobby">
            <span>Enter the theatre</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
          </Link>
          <span className="hero-scribble hero-scribble-left" aria-hidden="true">✳</span>
          <span className="hero-scribble hero-scribble-right" aria-hidden="true">✳</span>

          <div className="hero-scroll-hint" aria-hidden="true">
            <span>Scroll to explore</span>
            <span className="scroll-hint-arrow">↓</span>
          </div>
        </section>

        {/* Full-viewport background infinite doodle flight */}
        <DoodleUniverse isActivated={isActivated} isModalOpen={isSignInOpen} />
      </main>

      <footer className={`landing-footer ${isActivated ? 'is-ambient' : ''}`} id="about">
        <p>Made for nights worth remembering <span aria-hidden="true">✳</span></p>
        <small>Infinite cinema flight inspired by @nonzeroexitcode.</small>
      </footer>

      {/* Cinematic Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={handleCloseSignIn}
        originRect={signInOriginRect}
      />
    </div>
  )
}

export default Landing
