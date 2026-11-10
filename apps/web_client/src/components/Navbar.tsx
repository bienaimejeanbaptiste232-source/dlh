import { useState } from 'react'
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

// ── SVG Icons ──────────────────────────────────────────────────
const IconCart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width="18" height="18">
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

const IconWhatsApp = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
  </svg>
)

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width="20" height="20">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width="20" height="20">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconStore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
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

const CATEGORY_ITEMS: { cat: MerchantCategory; label: string }[] = [
  { cat: 'ALL', label: 'Tout Kategori' },
  { cat: 'RESTAURANT', label: 'Restoran & Bar' },
  { cat: 'FAST_FOOD', label: 'Fast Food & Fritay' },
  { cat: 'SUPERMARKET', label: 'Sipèmache & Pwovizyon' },
  { cat: 'PHARMACY', label: 'Famasi & Sante' },
  { cat: 'CONSTRUCTION', label: 'Materyo Konstriksyon' },
  { cat: 'BEVERAGE_DEPOT', label: 'Dépôt Bwason & Dlo' },
]

export default function Navbar({ page, onNavigate, onCategoryFilter, activeCategory = 'ALL' }: NavbarProps) {
  const { user } = useAuth()
  const { totalItems, openCart } = useCart()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('dlh_zone')) || 'Sant Vil'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState<MerchantCategory>('ALL')

  const nav = (p: NavPage) => {
    onNavigate(p)
    setDrawerOpen(false)
  }

  const filterCat = (cat: MerchantCategory) => {
    onCategoryFilter?.(cat)
    setDrawerOpen(false)
    if (page !== 'home') {
      onNavigate('home')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchCategory !== 'ALL') {
      onCategoryFilter?.(searchCategory)
    }
    if (page !== 'home') {
      onNavigate('home')
    }
    // Dispatch search query to HomePage listener
    window.dispatchEvent(new CustomEvent('dlh:search', { detail: { query: searchQuery } }))
    const searchInput = document.getElementById('merchant-search') as HTMLInputElement | null
    if (searchInput) {
      searchInput.value = searchQuery
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <header className="navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* ── Tier 1: Main Header Row (1:1 Maket Ayisyen Design) ── */}
      <nav className="ma-header-main">
        {/* Left: Hamburger + Logo + "Vin Vandè" Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Hamburger Icon */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Louvri Meni"
            className="ma-nav-menu-btn"
          >
            <IconMenu />
          </button>

          {/* Logo & Brand Name */}
          <div
            onClick={() => nav('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            role="button"
            tabIndex={0}
          >
            <img
              src="/logo.png"
              alt="Delivery Lakay"
              style={{ height: 36, width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#17191C', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  DELIVERY
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#E11D48', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  LAKAY
                </span>
              </div>
              <span style={{ fontSize: '0.5625rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Makèt Ayisyen · Okap
              </span>
            </div>
          </div>

          {/* "Vin Vandè" Pill Button */}
          <a
            href="https://wa.me/50940553636?text=Mwen%20vle%20vin%20vande%20sou%20Delivery%20Lakay"
            target="_blank"
            rel="noopener noreferrer"
            className="ma-nav-sell-pill desktop-only"
          >
            Vin Vandè
          </a>
        </div>

        {/* Center: Search Input + Connected Search Button */}
        <form onSubmit={handleSearchSubmit} className="ma-nav-search-form">
          <input
            type="text"
            className="ma-nav-search-input"
            placeholder="Chèche pwodwi, mak, kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="ma-nav-search-btn" aria-label="Chèche">
            <IconSearch />
          </button>
        </form>

        {/* Right: Account + Orders + Cart Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {/* User Account Button */}
          <button
            onClick={() => nav(user ? 'profile' : 'auth')}
            className="ma-nav-account-btn desktop-only"
          >
            <span className="ma-nav-sub-label">
              Bonjou, {user ? (user.firstName || 'zanmi') : 'konekte'}
            </span>
            <span className="ma-nav-main-label">
              Kont ▾
            </span>
          </button>

          {/* Returns & Orders Button */}
          <button
            onClick={() => nav('orders')}
            className="ma-nav-orders-btn desktop-only"
          >
            <span className="ma-nav-sub-label">Retounen</span>
            <span className="ma-nav-main-label">& Kòmann</span>
          </button>

          {/* Cart Icon with Red Badge */}
          <button
            onClick={openCart}
            className="ma-nav-cart-btn"
            aria-label="Panyen Kòmann"
          >
            <IconCart />
            <span className="ma-nav-cart-badge">{totalItems}</span>
          </button>
        </div>
      </nav>

      {/* ── Tier 2: Subnav Strip (Solid Black Bar #000000 1:1 Maket Ayisyen) ── */}
      <div className="ma-subnav-bar">
        <div className="ma-subnav-inner">
          <button
            className={`ma-subnav-link ${activeCategory === 'ALL' && page === 'home' ? 'active' : ''}`}
            onClick={() => filterCat('ALL')}
          >
            Pwodwi Tout
          </button>

          <button
            className="ma-subnav-link"
            onClick={() => {
              if (page !== 'home') nav('home')
              setTimeout(() => {
                document.getElementById('stores-section')?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
          >
            Boutik yo
          </button>

          <a
            href="https://wa.me/50940553636?text=Mwen%20vle%20yon%20Kat%20Kado%20Delivery%20Lakay"
            target="_blank"
            rel="noopener noreferrer"
            className="ma-subnav-link"
          >
            Kat Kado
          </a>

          <a
            href="https://wa.me/50940553636?text=Mwen%20vle%20envite%20zanmi%20m%20sou%20Delivery%20Lakay"
            target="_blank"
            rel="noopener noreferrer"
            className="ma-subnav-link"
          >
            Envite Zanmi
          </a>

          <a
            href="https://wa.me/50940553636?text=Mwen%20vle%20vann%20sou%20Delivery%20Lakay"
            target="_blank"
            rel="noopener noreferrer"
            className="ma-subnav-link"
          >
            Vann sou Maket
          </a>

          <button
            className="ma-subnav-link"
            onClick={() => nav('orders')}
          >
            Swiv Kòmann
          </button>

          <button
            className="ma-subnav-link"
            onClick={() => setDrawerOpen(true)}
          >
            Zòn: {selectedZone} ▾
          </button>

          <a
            href="#footer-info"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('footer-info')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="ma-subnav-link"
          >
            Kiyès Nou Ye
          </a>

          <a
            href="https://wa.me/50940553636?text=Bonjou%20mwen%20bezwen%20èd"
            target="_blank"
            rel="noopener noreferrer"
            className="ma-subnav-link"
          >
            Èd
          </a>
        </div>
      </div>

      {/* ── Slide-Out Category Drawer (Maket Ayisyen Pattern) ── */}
      {drawerOpen && (
        <>
          <div
            className="ma-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="ma-drawer-content">
            <div className="ma-drawer-head">
              <div className="ma-drawer-title">
                <img src="/logo.png" alt="Logo" style={{ height: 28 }} />
                <span>Delivery Lakay</span>
              </div>
              <button
                className="ma-drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fèmen"
              >
                <IconX />
              </button>
            </div>

            <div className="ma-drawer-body">
              {/* Delivery Zone Selector in Drawer */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#FF6000' }}>📍</span>
                  <span>Zòn Livrezon ou nan Okap</span>
                </div>
                <select
                  value={selectedZone}
                  onChange={(e) => {
                    setSelectedZone(e.target.value)
                    try { localStorage.setItem('dlh_zone', e.target.value) } catch {}
                  }}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Achte pa Kategori
              </div>
              {CATEGORY_ITEMS.map(({ cat, label }) => (
                <div
                  key={cat}
                  className={`ma-drawer-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => filterCat(cat)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeCategory === cat ? '#FF6000' : '#CBD5E1', display: 'inline-block', marginRight: 6 }} />
                  <span>{label}</span>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '12px 0' }} />

              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Sèvis Kliyan
              </div>
              <div className="ma-drawer-item" onClick={() => nav('orders')}>
                <IconClipboard />
                <span>Swiv Kòmann Ou</span>
              </div>
              <div className="ma-drawer-item" onClick={() => nav('profile')}>
                <IconUser />
                <span>Kont & Pwofil Mwen</span>
              </div>
              <a
                className="ma-drawer-item"
                href="https://wa.me/50940553636?text=Mwen%20bezwen%20asistans%20sou%20Delivery%20Lakay"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconWhatsApp size={16} color="#25D366" />
                <span>💬 Asistans WhatsApp</span>
              </a>
            </div>

            <div className="ma-drawer-footer">
              <a
                href="https://wa.me/50940553636?text=Mwen%20vle%20vin%20vande%20sou%20Delivery%20Lakay"
                target="_blank"
                rel="noopener noreferrer"
                className="ma-sell-btn"
              >
                <IconStore />
                <span>Vin Vandè sou Delivery Lakay</span>
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
