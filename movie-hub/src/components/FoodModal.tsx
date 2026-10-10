import { useState } from 'react'
import { playSelectionTick } from '../utils/selectionSound'
import './FoodModal.css'

const menuItems = [
  { id: 'popcorn-sm',  name: 'Popcorn (Small)',   price: 120, emoji: '🍿', category: 'Snacks'  },
  { id: 'popcorn-lg',  name: 'Popcorn (Large)',   price: 200, emoji: '🍿', category: 'Snacks'  },
  { id: 'nachos',      name: 'Nachos & Salsa',    price: 180, emoji: '🌮', category: 'Snacks'  },
  { id: 'hotdog',      name: 'Hot Dog',            price: 150, emoji: '🌭', category: 'Snacks'  },
  { id: 'cola',        name: 'Cola (Large)',        price: 90,  emoji: '🥤', category: 'Drinks'  },
  { id: 'water',       name: 'Water Bottle',       price: 30,  emoji: '💧', category: 'Drinks'  },
  { id: 'coffee',      name: 'Coffee',             price: 110, emoji: '☕', category: 'Drinks'  },
  { id: 'combo1',      name: 'Movie Combo',        price: 320, emoji: '🎬', category: 'Combos'  },
]

function playOrderChime() {
  try {
    const ctx = new AudioContext()
    // Two quick ascending pops
    const notes = [659.25, 880]
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.1
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.41)
    })
    setTimeout(() => ctx.close(), 800)
  } catch { /* silent fail */ }
}

type CartItem = { id: string; qty: number }

export default function FoodModal({ onClose }: { onClose: () => void }) {
  const [cart, setCart]       = useState<CartItem[]>([])
  const [ordered, setOrdered] = useState(false)

  function addItem(id: string) {
    playSelectionTick()
    setCart(c => {
      const ex = c.find(i => i.id === id)
      return ex ? c.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) : [...c, { id, qty: 1 }]
    })
  }

  function removeItem(id: string) {
    if (!cart.some(item => item.id === id)) return
    playSelectionTick()
    setCart(c => {
      const ex = c.find(i => i.id === id)
      if (!ex) return c
      return ex.qty === 1 ? c.filter(i => i.id !== id) : c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  function qtyOf(id: string) {
    return cart.find(i => i.id === id)?.qty ?? 0
  }

  const total = cart.reduce((sum, ci) => {
    const item = menuItems.find(m => m.id === ci.id)
    return sum + (item?.price ?? 0) * ci.qty
  }, 0)

  const categories = ['Snacks', 'Drinks', 'Combos']

  function handleOrder() {
    playOrderChime()
    setOrdered(true)
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (ordered) {
    return (
      <div
        className="fm-backdrop"
        onClick={onClose}
        onWheel={event => event.stopPropagation()}
        onPointerDown={event => event.stopPropagation()}
        onPointerUp={event => event.stopPropagation()}
      >
        <div className="fm-modal fm-modal--success" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
          <button className="fm-close-abs" onClick={onClose} aria-label="Close">✕</button>
          <div className="fm-success-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#4caf82" strokeWidth="3" />
              <path d="M18 32l10 10 18-18" stroke="#4caf82" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="fm-success-title">Order Placed!</h2>
          <p className="fm-success-sub">Your food will be ready at the counter. Enjoy the show 🎬</p>
          <div className="fm-order-summary">
            {cart.map(ci => {
              const item = menuItems.find(m => m.id === ci.id)!
              return (
                <div key={ci.id} className="fm-order-row">
                  <span>{item.emoji} {item.name} ×{ci.qty}</span>
                  <span>₹{item.price * ci.qty}</span>
                </div>
              )
            })}
            <div className="fm-order-total">
              <span>Total</span><span>₹{total}</span>
            </div>
          </div>
          <button className="fm-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    )
  }

  // ── Menu ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fm-backdrop"
      onClick={onClose}
      onWheel={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
      onPointerUp={event => event.stopPropagation()}
    >
      <div className="fm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Food Court">

        <div className="fm-header">
          <h2 className="fm-title">🍔 Food Court</h2>
          <button className="fm-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="fm-body">
          {categories.map(cat => {
            const items = menuItems.filter(m => m.category === cat)
            return (
              <div key={cat} className="fm-section">
                <p className="fm-section-label">{cat.toUpperCase()}</p>
                {items.map(item => {
                  const qty = qtyOf(item.id)
                  return (
                    <div key={item.id} className="fm-item">
                      <span className="fm-item-emoji" aria-hidden="true">{item.emoji}</span>
                      <div className="fm-item-info">
                        <span className="fm-item-name">{item.name}</span>
                        <span className="fm-item-price">₹{item.price}</span>
                      </div>
                      <div className="fm-item-ctrl">
                        {qty === 0 ? (
                          <button className="fm-add-btn" onClick={() => addItem(item.id)}>+ Add</button>
                        ) : (
                          <div className="fm-qty-ctrl">
                            <button onClick={() => removeItem(item.id)} aria-label="Remove one">−</button>
                            <span>{qty}</span>
                            <button onClick={() => addItem(item.id)} aria-label="Add one">+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {cart.length > 0 && (
          <div className="fm-footer">
            <div className="fm-footer-info">
              <span>{cart.reduce((s, i) => s + i.qty, 0)} item{cart.reduce((s, i) => s + i.qty, 0) > 1 ? 's' : ''}</span>
              <span className="fm-footer-total">₹{total}</span>
            </div>
            <button className="fm-order-btn" onClick={handleOrder}>
              Place Order ₹{total}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
