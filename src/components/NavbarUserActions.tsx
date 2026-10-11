import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { SignInModal } from './SignInModal'
import { History } from './AccountMenu'
import './NavbarUserActions.css'

interface NavbarUserActionsProps {
  className?: string
}

export function NavbarUserActions({ className = '' }: NavbarUserActionsProps) {
  const { user, ready, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [signInOriginRect, setSignInOriginRect] = useState<DOMRect | null>(null)

  const signInBtnRef = useRef<HTMLButtonElement>(null)
  const profileBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleOpenSignIn = () => {
    if (signInBtnRef.current) {
      setSignInOriginRect(signInBtnRef.current.getBoundingClientRect())
    }
    setIsSignInOpen(true)
  }

  const handleCloseSignIn = () => {
    setIsSignInOpen(false)
  }

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  const handleOpenBookings = () => {
    setIsMenuOpen(false)
    setIsHistoryOpen(true)
  }

  const handleSignOut = () => {
    setIsMenuOpen(false)
    logout()
  }

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Close profile dropdown on Escape
  useEffect(() => {
    if (!isMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        profileBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  const initialLetter = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'G'

  return (
    <div
      className={`navbar-user-actions ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {!user ? (
        <button
          ref={signInBtnRef}
          type="button"
          disabled={!ready}
          className={`nav-signin-btn ${isSignInOpen ? 'is-emerging-origin' : ''}`}
          onClick={handleOpenSignIn}
          aria-haspopup="dialog"
          aria-expanded={isSignInOpen}
          aria-label="Sign In to Goodshow Cinema"
        >
          <span>{ready ? 'Sign In' : 'Loading…'}</span>
        </button>
      ) : (
        <div className="profile-menu-container">
          <button
            ref={profileBtnRef}
            type="button"
            className={`nav-profile-btn ${isMenuOpen ? 'is-active' : ''}`}
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`Profile menu for ${user.name || 'Member'}`}
          >
            <span className="profile-avatar-initial">{initialLetter}</span>
            <span className="profile-status-dot" aria-hidden="true" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="profile-dropdown-menu"
              role="menu"
              aria-label="User account actions"
            >
              <div className="menu-user-header">
                <div className="menu-user-avatar">{initialLetter}</div>
                <div className="menu-user-text">
                  <p className="menu-user-name">{user.name}</p>
                  <p className="menu-user-email">{user.email}</p>
                  <span className="menu-user-badge">
                    <span aria-hidden="true">★</span> {user.role === 'ADMIN' ? 'Cinema Admin' : 'Member'}
                  </span>
                </div>
              </div>

              <div className="menu-divider" />

              <div className="menu-items-list">
                <button
                  type="button"
                  className="menu-action-item"
                  role="menuitem"
                  onClick={handleOpenBookings}
                >
                  <span className="menu-action-icon" aria-hidden="true">🎟</span>
                  <span className="menu-action-label">My Bookings</span>
                </button>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="menu-action-item"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="menu-action-icon" aria-hidden="true">⚙️</span>
                    <span className="menu-action-label">Admin Dashboard</span>
                  </Link>
                )}

                <div className="menu-divider" />

                <button
                  type="button"
                  className="menu-action-item signout-action"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  <span className="menu-action-icon" aria-hidden="true">➔</span>
                  <span className="menu-action-label">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cinematic Sign In Modal */}
      <SignInModal
        isOpen={isSignInOpen && !user}
        onClose={handleCloseSignIn}
        originRect={signInOriginRect}
      />

      {/* Bookings History Modal */}
      {isHistoryOpen && user && (
        <History key={user._id} onClose={() => setIsHistoryOpen(false)} />
      )}
    </div>
  )
}
export default NavbarUserActions
