import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../store/authStore'
import './SignInModal.css'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  originRect: DOMRect | null
  promptMessage?: string | null
}

export function SignInModal({
  isOpen,
  onClose,
  onSuccess,
  originRect,
  promptMessage,
}: SignInModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSignUpMode, setIsSignUpMode] = useState(false)

  const { login, register, isLoading, errorMessage, clearError } = useAuthStore()

  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isReducedMotionRef = useRef(false)

  // Clear errors when opening modal or switching modes
  useEffect(() => {
    if (isOpen) {
      clearError()
    }
  }, [isOpen, isSignUpMode, clearError])

  // Check reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    isReducedMotionRef.current = mq.matches
    const handler = (e: MediaQueryListEvent) => {
      isReducedMotionRef.current = e.matches
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Signature Emergence Animation from button rect
  useEffect(() => {
    if (!isOpen || isClosing) return

    const card = cardRef.current
    const overlay = overlayRef.current
    const content = contentRef.current
    if (!card || !overlay || !content) return

    if (isReducedMotionRef.current) {
      overlay.style.opacity = '1'
      card.style.transform = 'none'
      card.style.opacity = '1'
      content.style.opacity = '1'
      setTimeout(() => (isSignUpMode ? nameInputRef.current?.focus() : emailInputRef.current?.focus()), 50)
      return
    }

    const cardRect = card.getBoundingClientRect()
    const rect = originRect || {
      left: window.innerWidth - 160,
      top: 24,
      width: 90,
      height: 36,
    }

    const btnCenterX = rect.left + rect.width / 2
    const btnCenterY = rect.top + rect.height / 2
    const cardCenterX = cardRect.left + cardRect.width / 2
    const cardCenterY = cardRect.top + cardRect.height / 2

    const deltaX = btnCenterX - cardCenterX
    const deltaY = btnCenterY - cardCenterY
    const scaleX = Math.max(0.12, rect.width / cardRect.width)
    const scaleY = Math.max(0.08, rect.height / cardRect.height)

    // Backdrop fade
    overlay.animate(
      [
        { opacity: 0 },
        { opacity: 1 },
      ],
      { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    )

    // Card emergence: smoothly scales, translates, and expands from button
    const cardAnim = card.animate(
      [
        {
          transform: `translate3d(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`,
          borderRadius: '20px',
          boxShadow: '1.5px 2px 0 #26231f',
          opacity: 0.3,
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          borderRadius: '22px',
          boxShadow: '6px 8px 0 #26231f, 0 24px 48px rgba(38, 35, 31, 0.22)',
          opacity: 1,
        },
      ],
      {
        duration: 440,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    )

    // Content inside card unfolds smoothly during expansion
    content.animate(
      [
        { opacity: 0, transform: 'scale(0.88)' },
        { opacity: 0, transform: 'scale(0.92)', offset: 0.35 },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration: 440,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      }
    )

    cardAnim.onfinish = () => {
      if (isSignUpMode) {
        nameInputRef.current?.focus()
      } else {
        emailInputRef.current?.focus()
      }
    }
  }, [isOpen, isClosing, originRect, isSignUpMode])

  // Direct dismissal on successful login (no retraction into vanished button)
  const handleSuccessClose = useCallback(() => {
    const card = cardRef.current
    const overlay = overlayRef.current

    if (!card || !overlay || isReducedMotionRef.current) {
      if (onSuccess) onSuccess()
      else onClose()
      return
    }

    setIsClosing(true)
    overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 220,
      easing: 'ease-out',
      fill: 'forwards',
    })

    const cardAnim = card.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.96)' },
      ],
      { duration: 220, easing: 'ease-out', fill: 'forwards' }
    )

    cardAnim.onfinish = () => {
      setIsClosing(false)
      if (onSuccess) onSuccess()
      else onClose()
    }
  }, [onSuccess, onClose])

  // Retraction back into origin button upon cancellation
  const handleStartClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)

    const card = cardRef.current
    const overlay = overlayRef.current
    const content = contentRef.current

    if (!card || !overlay || !content || isReducedMotionRef.current) {
      setIsClosing(false)
      onClose()
      return
    }

    const cardRect = card.getBoundingClientRect()
    const rect = originRect || {
      left: window.innerWidth - 160,
      top: 24,
      width: 90,
      height: 36,
    }

    const btnCenterX = rect.left + rect.width / 2
    const btnCenterY = rect.top + rect.height / 2
    const cardCenterX = cardRect.left + cardRect.width / 2
    const cardCenterY = cardRect.top + cardRect.height / 2

    const deltaX = btnCenterX - cardCenterX
    const deltaY = btnCenterY - cardCenterY
    const scaleX = Math.max(0.12, rect.width / cardRect.width)
    const scaleY = Math.max(0.08, rect.height / cardRect.height)

    // Backdrop fade out
    overlay.animate(
      [
        { opacity: 1 },
        { opacity: 0 },
      ],
      { duration: 320, easing: 'ease-in', fill: 'forwards' }
    )

    // Form content dissolves quickly so user sees the shape collapsing
    content.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.86)' },
      ],
      { duration: 160, easing: 'ease-out', fill: 'forwards' }
    )

    // Card collapses into button coordinates
    const closeAnim = card.animate(
      [
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          borderRadius: '22px',
          boxShadow: '6px 8px 0 #26231f, 0 24px 48px rgba(38, 35, 31, 0.22)',
          opacity: 1,
        },
        {
          transform: `translate3d(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px, 0) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`,
          borderRadius: '20px',
          boxShadow: '1.5px 2px 0 #26231f',
          opacity: 0.1,
        },
      ],
      {
        duration: 360,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'forwards',
      }
    )

    closeAnim.onfinish = () => {
      setIsClosing(false)
      onClose()
    }
  }, [isClosing, onClose, originRect])

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleStartClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleStartClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (isSignUpMode) {
      const success = await register(name, email, password)
      if (success) {
        handleSuccessClose()
      }
    } else {
      const success = await login(email, password)
      if (success) {
        handleSuccessClose()
      }
    }
  }

  const fillDemoCredentials = () => {
    setEmail('cinema@goodshow.com')
    setPassword('Goodshow123!')
    clearError()
  }

  if (!isOpen && !isClosing) return null

  const modalContent = (
    <div
      className="signin-overlay"
      ref={overlayRef}
      onClick={handleStartClose}
      role="presentation"
    >
      <div
        className="signin-modal-card"
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="signin-close-btn"
          onClick={handleStartClose}
          aria-label="Close sign in dialog"
        >
          ✕
        </button>

        <div className="signin-modal-content" ref={contentRef}>
          {/* Movie Ticket Kicker Badge */}
          <div className="signin-ticket-badge">
            <span className="badge-star" aria-hidden="true">✳</span>
            <span>GOODSHOW CINEMA CLUB · ADMIT ONE</span>
            <span className="badge-star" aria-hidden="true">✳</span>
          </div>

          <h2 id="signin-modal-title" className="signin-title">
            {isSignUpMode ? 'Join the Picture House' : 'Welcome Back'}
          </h2>
          <p className="signin-subtitle">
            {isSignUpMode
              ? 'Claim your velvet seat, unlock advance double-features, and save your favourite reels.'
              : 'Pull up a seat. Your watchlist, seat reservations, and cinema memories await.'}
          </p>

          {/* Pending Booking Prompt Banner */}
          {promptMessage && (
            <div className="signin-prompt-banner" role="alert">
              <span className="banner-icon" aria-hidden="true">🎟</span>
              <span className="banner-text">{promptMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="signin-error-box" role="alert">
              <span className="error-star" aria-hidden="true">⚠️</span>
              <span className="error-text">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="signin-form" onSubmit={handleSubmit}>
            {/* Name Field (Sign Up mode only) */}
            {isSignUpMode && (
              <div className="form-group">
                <label htmlFor="signin-name" className="form-label">
                  Your name
                </label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    ref={nameInputRef}
                    id="signin-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="signin-email" className="form-label">
                Email address
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  ref={emailInputRef}
                  id="signin-email"
                  type="email"
                  required
                  placeholder="name@goodshow.cinema"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="signin-password" className="form-label">
                  Password
                </label>
                {!isSignUpMode && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={fillDemoCredentials}
                    title="Fill demo account credentials"
                  >
                    Use demo account
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input password-input"
                  autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="remember-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="custom-checkbox"
                />
                <span>Remember my seat</span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="signin-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="signin-spinner" aria-hidden="true" />
              ) : (
                <span>{isSignUpMode ? 'Claim Your Seat ➔' : 'Take Your Seat ➔'}</span>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="signin-footer-row">
            <span>{isSignUpMode ? 'Already have a cinema pass?' : 'New to Goodshow Picture House?'}</span>
            <button
              type="button"
              className="toggle-mode-btn"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode)
                clearError()
              }}
            >
              {isSignUpMode ? 'Sign In instead' : 'Join the Cinema Club'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}
