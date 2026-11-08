import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { MerchantCategory } from '../App'

type NavPage = 'home' | 'checkout' | 'profile' | 'auth' | 'orders'

interface NavbarProps {
  page: NavPage
  onNavigate: (p: NavPage) => void
  onCategoryFilter?: (cat: MerchantCategory) => void
  activeCategory?: MerchantCategory
}

// ── SVG Icons (Zero Emojis, Pure Crisp SVGs) ─────────────────
const IconCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width="19" height="19">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width="18" height="18">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconClipboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width="18" height="18">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
)

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width="16" height="16">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconWhatsApp = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
  </svg>
)

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width="22" height="22">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width="22" height="22">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ZONES = [
  'Sant Vil',
  'Vaudreuil',
  'Haut-du-Cap',
  'Madan Kolo',
  'Baryè Boutèy',
  'Petite Anse',
  'Carenage',
  'Vertières',
  'Bande du Nord'
]

export default function Navbar({ page, onNavigate, onCategoryFilter, activeCategory = 'ALL' }: NavbarProps) {
  const { user } = useAuth()
  const { totalItems, openCart } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('dlh_zone')) || 'Sant Vil'
  })
  const [zoneOpen, setZoneOpen] = useState(false)

  const nav = (p: NavPage) => {
    onNavigate(p)
    setMenuOpen(false)
  }

  const filterCat = (cat: MerchantCategory) => {
    onCategoryFilter?.(cat)
    setMenuOpen(false)
  }

  return (
    <header className="navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      {/* ── Tier 1: Alibaba-Style Thin Top Bar ── */}
      <div className="navbar-top-bar" style={{
        background: '#17191C',
        color: '#D1D5DB',
        fontSize: '0.75rem',
        padding: '5px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#9CA3AF' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B96B' }} />
            Livraison rapide · Cap-Haïtien & environs
          </span>
          <span style={{ color: '#4B5563' }}>|</span>
          <span style={{ color: '#E5E7EB', fontWeight: 600 }}>Service officiel de livraison en Haïti</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="https://wa.me/50940553636"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
          >
            <IconWhatsApp size={14} color="#25D366" />
            <span>Asistans WhatsApp: +509 40 55 36 36</span>
          </a>
          {user ? (
            <span style={{ color: '#FF6000', fontWeight: 700, cursor: 'pointer' }} onClick={() => nav('profile')}>
              Kliyan: {user.firstName || 'Mwen'}
            </span>
          ) : (
            <span style={{ color: '#FF6000', fontWeight: 700, cursor: 'pointer' }} onClick={() => nav('auth')}>
              Konekte / Enskri
            </span>
          )}
        </div>
      </div>

      {/* ── Tier 2: Main Brand Bar ── */}
      <nav
        className="navbar-main-brand-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 20px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E8E8'
        }}
      >
        {/* Brand Logo & Name */}
        <div
          onClick={() => nav('home')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          role="button"
          tabIndex={0}
        >
          <img
            src="/logo.png"
            alt="Delivery Lakay Haïti"
            style={{ height: 38, width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="navbar-brand-name" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#17191C', letterSpacing: '-0.3px' }}>
                Delivery Lakay
              </span>
              <span className="navbar-brand-badge" style={{
                background: '#FFF3EB',
                color: '#FF6000',
                border: '1px solid rgba(255,96,0,0.3)',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                HAÏTI
              </span>
            </div>
          </div>
        </div>

        {/* ── Delivery Zone Selector (UberEats / DoorDash Style) ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setZoneOpen(!zoneOpen)}
            className="navbar-zone-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 22,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ color: '#FF6000', display: 'flex', alignItems: 'center' }}>
              <IconMapPin />
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div className="zone-label-full" style={{ fontSize: '0.625rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Livrezon nan
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#17191C', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="zone-label-full">Cap-Haïtien · {selectedZone}</span>
                <span className="zone-label-compact">{selectedZone}</span>
                <span style={{ color: '#9CA3AF', display: 'inline-flex' }}><IconChevronDown /></span>
              </div>
            </div>
          </button>

          {/* Zone Dropdown */}
          {zoneOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                onClick={() => setZoneOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 230,
                  background: '#FFFFFF',
                  borderRadius: 14,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
                  border: '1px solid #E8E8E8',
                  zIndex: 999,
                  padding: '6px',
                }}
              >
                <div style={{ padding: '8px 12px 6px', fontSize: '0.6875rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6' }}>
                  Chwazi Zòn Livrezon
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {ZONES.map(z => {
                    const isSelected = selectedZone === z
                    return (
                      <button
                        key={z}
                        onClick={() => {
                          setSelectedZone(z)
                          setZoneOpen(false)
                          try { localStorage.setItem('dlh_zone', z) } catch {}
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: 'none',
                          background: isSelected ? '#FFF3EB' : 'transparent',
                          color: isSelected ? '#FF6000' : '#1F2937',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.8125rem',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{z}</span>
                        {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6000' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Orders Link (Desktop only) */}
          <button
            onClick={() => nav('orders')}
            className="desktop-only"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: page === 'orders' ? '#FF6000' : '#374151',
              fontWeight: 700,
              fontSize: '0.875rem',
              padding: '8px 12px',
              borderRadius: 6
            }}
          >
            <IconClipboard />
            <span>Kòmand Yo</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={openCart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#FFF3EB',
              border: '1.5px solid rgba(255,96,0,0.3)',
              color: '#FF6000',
              padding: '7px 14px',
              borderRadius: 20,
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <IconCart />
            <span className="cart-text-label">Panye</span>
            {totalItems > 0 && (
              <span style={{
                background: '#FF6000',
                color: '#FFFFFF',
                borderRadius: '50%',
                padding: '2px 7px',
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                {totalItems}
              </span>
            )}
          </button>

          {/* User Profile / Login Button (Desktop only, mobile has it in BottomNav) */}
          {user ? (
            <button
              onClick={() => nav('profile')}
              className="desktop-only"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 24,
                padding: '5px 12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#FF6000',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8125rem'
              }}>
                {user.firstName?.[0] || 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#17191C' }}>
                  {user.firstName || 'Kont'}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => nav('auth')}
              className="desktop-only"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#FF6000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,96,0,0.3)'
              }}
            >
              <IconUser />
              <span>Konekte</span>
            </button>
          )}

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meni"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#17191C',
              padding: 6,
              display: 'flex'
            }}
            className="mobile-hamburger-btn"
          >
            {menuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {/* ── Tier 3: Subnav Category Row — Bouton yo filtre vreman ── */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E8E8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {([
          { cat: 'ALL',           label: 'Tout Kategori' },
          { cat: 'RESTAURANT',    label: 'Restoran & Bar' },
          { cat: 'FAST_FOOD',     label: 'Fast Food' },
          { cat: 'SUPERMARKET',   label: 'Sipèmache & Pwovizyon' },
          { cat: 'PHARMACY',      label: 'Famasi & Swen' },
          { cat: 'CONSTRUCTION',  label: 'Materyo & Zouti' },
          { cat: 'BEVERAGE_DEPOT',label: 'Dépôt Bwason' },
        ] as { cat: MerchantCategory; label: string }[]).map(({ cat, label }) => {
          const isActive = activeCategory === cat && page === 'home'
          return (
            <button
              key={cat}
              onClick={() => filterCat(cat)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #FF6000' : '2.5px solid transparent',
                color: isActive ? '#FF6000' : '#4B5563',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.8125rem',
                padding: '9px 10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s'
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Mobile Overlay & Drawer ── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2000
          }}
        />
      )}

      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 300,
        height: '100dvh',
        background: '#FFFFFF',
        zIndex: 2001,
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E8E8E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 32 }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#17191C' }}>Delivery Lakay</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
          >
            <IconX />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {/* Mobile Zone Selector */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', marginBottom: 4 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconMapPin />
              <span>Zòn Livrezon: Cap-Haïtien</span>
            </div>
            <select
              value={selectedZone}
              onChange={e => {
                const z = e.target.value
                setSelectedZone(z)
                try { localStorage.setItem('dlh_zone', z) } catch {}
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1.5px solid #FF6000',
                background: '#FFFFFF',
                color: '#17191C',
                fontWeight: 700,
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              {ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => nav('home')}
            style={{
              padding: '12px 16px',
              textAlign: 'left',
              background: page === 'home' ? '#FFF3EB' : 'transparent',
              color: page === 'home' ? '#FF6000' : '#17191C',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Akèy
          </button>
          <button
            onClick={() => nav('orders')}
            style={{
              padding: '12px 16px',
              textAlign: 'left',
              background: page === 'orders' ? '#FFF3EB' : 'transparent',
              color: page === 'orders' ? '#FF6000' : '#17191C',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Kòmand Mwen Yo
          </button>
          <button
            onClick={() => { openCart(); setMenuOpen(false) }}
            style={{
              padding: '12px 16px',
              textAlign: 'left',
              background: 'transparent',
              color: '#17191C',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Panye Mwen</span>
            {totalItems > 0 && (
              <span style={{ background: '#FF6000', color: '#FFFFFF', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={() => nav(user ? 'profile' : 'auth')}
            style={{
              padding: '12px 16px',
              textAlign: 'left',
              background: page === 'profile' || page === 'auth' ? '#FFF3EB' : 'transparent',
              color: page === 'profile' || page === 'auth' ? '#FF6000' : '#17191C',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            {user ? 'Pwofil Mwen' : 'Konekte / Enskri'}
          </button>

          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E8E8E8' }}>
            <a
              href="https://wa.me/50940553636"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px',
                background: '#25D366',
                color: '#FFFFFF',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                justifyContent: 'center'
              }}
            >
              <IconWhatsApp size={18} color="#FFFFFF" />
              <span>WhatsApp: +509 40 55 36 36</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
