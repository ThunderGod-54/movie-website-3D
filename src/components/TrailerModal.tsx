import { useEffect } from 'react'
import './TrailerModal.css'

export type Trailer = {
  title: string
  videoId: string
}

export const trailers: Trailer[] = [
  { title: 'Dhurandhar 2', videoId: 'NHk7scrb_9I' },
  { title: 'F1', videoId: '8yh9BPUBbbQ' },
  { title: 'The Odyssey', videoId: 'f_bKjZeJBBI' },
  { title: 'Avengers: Doomsday', videoId: 'irVNGjRFZGk' },
  { title: 'Michael', videoId: '3zOLzsbOleM' },
]

type TrailerModalProps = {
  onClose: () => void
  onSelect: (trailer: Trailer) => void
}

export default function TrailerModal({ onClose, onSelect }: TrailerModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="trailer-picker-backdrop"
      onClick={onClose}
      onWheel={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
      onPointerUp={event => event.stopPropagation()}
    >
      <section
        className="trailer-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trailer-picker-title"
        onClick={event => event.stopPropagation()}
      >
        <header className="trailer-picker-header">
          <div>
            <p className="trailer-picker-kicker">NOW PLAYING IN THE AUDITORIUM</p>
            <h2 id="trailer-picker-title">Choose a trailer</h2>
          </div>
          <button className="trailer-picker-close" type="button" onClick={onClose} aria-label="Close trailer selection">
            ×
          </button>
        </header>
        <ul className="trailer-picker-list">
          {trailers.map((trailer, index) => (
            <li key={trailer.videoId}>
              <button type="button" className="trailer-picker-option" onClick={() => onSelect(trailer)}>
                <span className="trailer-picker-number">0{index + 1}</span>
                <span>{trailer.title}</span>
                <span className="trailer-picker-play" aria-hidden="true">▶</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="trailer-picker-note">Select a film to start its trailer on the big screen.</p>
      </section>
    </div>
  )
}
