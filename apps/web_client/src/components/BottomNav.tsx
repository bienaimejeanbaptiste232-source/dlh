import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { Page } from '../App'

interface BottomNavProps {
  page: Page
  onNavigate: (p: Page) => void
}

export default function BottomNav({ page, onNavigate }: BottomNavProps) {
  const { user } = useAuth()
  const { totalItems, openCart } = useCart()

  const handleStoresClick = () => {
    if (page !== 'home') {
      onNavigate('home')
      setTimeout(() => {
        const el = document.getElementById('merchants-section')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      const el = document.getElementById('merchants-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasyon mobil">
      {/* 1. Home */}
      <button
        onClick={() => onNavigate('home')}
        className={`bottom-nav-item ${page === 'home' ? 'active' : ''}`}
        type="button"
        aria-label="Akèy"
      >
        <div className="bottom-nav-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={page === 'home' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <span className="bottom-nav-label">Akèy</span>
      </button>

      {/* 2. Boutik */}
      <button
        onClick={handleStoresClick}
        className="bottom-nav-item"
        type="button"
        aria-label="Boutik"
      >
        <div className="bottom-nav-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v4H3z" />
            <path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>
        <span className="bottom-nav-label">Boutik</span>
      </button>

      {/* 3. Kòmand */}
      <button
        onClick={() => onNavigate('orders')}
        className={`bottom-nav-item ${page === 'orders' ? 'active' : ''}`}
        type="button"
        aria-label="Kòmand"
      >
        <div className="bottom-nav-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={page === 'orders' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M9 14h6" />
            <path d="M9 18h4" />
          </svg>
        </div>
        <span className="bottom-nav-label">Kòmand</span>
      </button>

      {/* 4. Panye (Cart) */}
      <button
        onClick={openCart}
        className="bottom-nav-item bottom-nav-cart"
        type="button"
        aria-label="Panye"
      >
        <div className="bottom-nav-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {totalItems > 0 && (
            <span className="bottom-nav-badge">{totalItems}</span>
          )}
        </div>
        <span className="bottom-nav-label">Panye</span>
      </button>

      {/* 5. Profil / Kont */}
      <button
        onClick={() => onNavigate(user ? 'profile' : 'auth')}
        className={`bottom-nav-item ${page === 'profile' || page === 'auth' ? 'active' : ''}`}
        type="button"
        aria-label="Kont"
      >
        <div className="bottom-nav-icon-wrap">
          {user ? (
            <div className="bottom-nav-avatar">
              {user.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={page === 'profile' || page === 'auth' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <span className="bottom-nav-label">{user ? (user.firstName || 'Profil') : 'Konekte'}</span>
      </button>
    </nav>
  )
}

