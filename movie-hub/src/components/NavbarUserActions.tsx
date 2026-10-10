import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { SignInModal } from './SignInModal'
import { MyBookingsModal } from './MyBookingsModal'
import { AccountSettingsModal } from './AccountSettingsModal'
import './NavbarUserActions.css'

interface NavbarUserActionsProps {
  className?: string
}

export function NavbarUserActions({ className = '' }: NavbarUserActionsProps) {
  const {
    user,
    isAuthenticated,
    logout,
    isSignInModalOpen,
    signInPrompt,
    openSignInModal,
    closeSignInModal,
    userBookings,
  } = useAuthStore()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isBookingsOpen, setIsBookingsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [signInOriginRect, setSignInOriginRect] = useState<DOMRect | null>(null)

  const signInBtnRef = useRef<HTMLButtonElement>(null)
  const profileBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleOpenSignIn = () => {
    if (signInBtnRef.current) {
      setSignInOriginRect(signInBtnRef.current.getBoundingClientRect())
    }
    openSignInModal()
  }

  const handleCloseSignIn = () => {
    closeSignInModal()
  }

  const handleSignInSuccess = () => {
    closeSignInModal()
  }

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  const handleOpenBookings = () => {
    setIsMenuOpen(false)
    setIsBookingsOpen(true)
  }

  const handleOpenSettings = () => {
    setIsMenuOpen(false)
    setIsSettingsOpen(true)
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
    <div className={`navbar-user-actions ${className}`}>
      {!isAuthenticated ? (
        <button
          ref={signInBtnRef}
          type="button"
          className={`nav-signin-btn ${isSignInModalOpen ? 'is-emerging-origin' : ''}`}
          onClick={handleOpenSignIn}
          aria-haspopup="dialog"
          aria-expanded={isSignInModalOpen}
          aria-label="Sign In to Goodshow Cinema"
        >
          <span>Sign In</span>
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
            aria-label={`Profile menu for ${user?.name || 'Member'}`}
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
                  <p className="menu-user-name">{user?.name}</p>
                  <p className="menu-user-email">{user?.email}</p>
                  <span className="menu-user-badge">
                    <span aria-hidden="true">★</span> {user?.memberTier}
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
                  {userBookings.length > 0 && (
                    <span className="menu-booking-count">{userBookings.length}</span>
                  )}
                </button>

                <button
                  type="button"
                  className="menu-action-item"
                  role="menuitem"
                  onClick={handleOpenSettings}
                >
                  <span className="menu-action-icon" aria-hidden="true">⚙️</span>
                  <span className="menu-action-label">Account Settings</span>
                </button>

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
        isOpen={isSignInModalOpen}
        onClose={handleCloseSignIn}
        onSuccess={handleSignInSuccess}
        originRect={signInOriginRect}
        promptMessage={signInPrompt}
      />

      {/* My Bookings Modal */}
      <MyBookingsModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
