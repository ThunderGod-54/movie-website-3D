import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../store/authStore'
import './AccountSettingsModal.css'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { user, session } = useAuthStore()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const memberSinceFormatted = user.createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.createdAt))
    : 'Recent Member'

  const sessionExpiresFormatted = session?.expiresAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.expiresAt))
    : 'Active'

  const modalContent = (
    <div className="settings-overlay" onClick={onClose} role="presentation">
      <div
        className="settings-card"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <button
          type="button"
          className="settings-close-btn"
          onClick={onClose}
          aria-label="Close Account Settings"
        >
          ✕
        </button>

        <div className="settings-header">
          <div className="settings-kicker">
            <span aria-hidden="true">★</span>
            <span>GOODSHOW CINEMA CLUB · MEMBER CARD</span>
          </div>
          <h2 id="settings-modal-title" className="settings-title">
            Account Settings
          </h2>
          <p className="settings-subtitle">
            Manage your Goodshow Picture House membership and credentials.
          </p>
        </div>

        <div className="settings-profile-card">
          <div className="settings-avatar-large">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="settings-profile-meta">
            <h3 className="profile-name">{user.name}</h3>
            <p className="profile-email">{user.email}</p>
            <span className="profile-tier-badge">
              <span aria-hidden="true">✳</span> {user.memberTier}
            </span>
          </div>
        </div>

        <div className="settings-details-section">
          <h4 className="section-title">Membership Details</h4>
          <div className="settings-grid">
            <div className="settings-field">
              <span className="field-label">Member ID</span>
              <span className="field-value monospace">{user.id}</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Member Since</span>
              <span className="field-value">{memberSinceFormatted}</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Session Security</span>
              <span className="field-value status-secure">● Authenticated (SHA-256)</span>
            </div>
            <div className="settings-field">
              <span className="field-label">Session Valid Until</span>
              <span className="field-value">{sessionExpiresFormatted}</span>
            </div>
          </div>
        </div>

        <div className="settings-actions-footer">
          <button type="button" className="settings-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}
