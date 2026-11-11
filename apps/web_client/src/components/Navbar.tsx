import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import type { MerchantCategory } from '../App'
import { showToast } from '../lib/toast'

type NavPage = 'home' | 'checkout' | 'profile' | 'auth' | 'orders' | 'terms' | 'privacy' | 'merchant-register'

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

const IconLogIn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
)

const IconUserPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
)

const IconLogOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const IconBag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const IconUtensils = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M18 2v20M22 2v4a4 4 0 0 1-4 4M2 2v6a4 4 0 0 0 4 4v10M6 2v20M10 2v6a4 4 0 0 1-4 4" />
  </svg>
)

const IconFlame = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
)

const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const IconPill = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
  </svg>
)

const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

const IconBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
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
    <path d="M3 3h18v4H3z" />
    <path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
    <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
  </svg>
)

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconGift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
)

const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconHelp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const ZONES = [
  'Tout Zòn',
  'Sant-Vil Okap',
  'Carenage',
  'Vertières',
  'Rival',
  'Barrière-Bouteille',
  'Madeline',
  'Petite Anse',
  'Quartier Morin',
  'Limonade'
]

const CATEGORY_ITEMS: { cat: MerchantCategory; label: string }[] = [
  { cat: 'ALL', label: 'Tout Kategori' },
  { cat: 'RESTAURANT', label: 'Restoran & Bar' },
  { cat: 'FAST_FOOD', label: 'Fast Food & Fritay' },
  { cat: 'SUPERMARKET', label: 'Sipèmache & Episri' },
  { cat: 'PHARMACY', label: 'Famasi & Sante' },
  { cat: 'CONSTRUCTION', label: 'Materyo Konstriksyon' },
  { cat: 'BEVERAGE_DEPOT', label: 'Dépôt Bwason & Dlo' },
]

export default function Navbar({ page, onNavigate, onCategoryFilter, activeCategory = 'ALL' }: NavbarProps) {
  const { user, logout } = useAuth()
  const { totalItems, openCart } = useCart()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('dlh_zone')) || 'Sant Vil'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState<MerchantCategory>('ALL')

  // Modals & Menus state
  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false)
  const [selectedGiftAmount, setSelectedGiftAmount] = useState(2500)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const drawerContentRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const helpModalCardRef = useRef<HTMLDivElement>(null)
  const helpSubnavBtnRef = useRef<HTMLButtonElement>(null)

  // Close dropdowns & modals on outside click/touch + Escape key + listen to global modal triggers
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountMenuOpen(false)
      }
      if (zoneRef.current && !zoneRef.current.contains(target)) {
        setZoneDropdownOpen(false)
      }
      if (
        drawerOpen &&
        drawerContentRef.current &&
        !drawerContentRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
        setDrawerOpen(false)
      }
      if (
        helpModalOpen &&
        helpModalCardRef.current &&
        !helpModalCardRef.current.contains(target) &&
        helpSubnavBtnRef.current &&
        !helpSubnavBtnRef.current.contains(target)
      ) {
        setHelpModalOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
        setHelpModalOpen(false)
        setVendorModalOpen(false)
        setAccountMenuOpen(false)
        setZoneDropdownOpen(false)
      }
    }

    const handleOpenVendor = () => setVendorModalOpen(true)
    const handleOpenHelp = () => setHelpModalOpen(true)

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('dlh:open-vendor', handleOpenVendor)
    window.addEventListener('dlh:open-help', handleOpenHelp)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('dlh:open-vendor', handleOpenVendor)
      window.removeEventListener('dlh:open-help', handleOpenHelp)
    }
  }, [drawerOpen, helpModalOpen])

  const nav = (p: NavPage) => {
    onNavigate(p)
    setDrawerOpen(false)
    setAccountMenuOpen(false)
    setZoneDropdownOpen(false)
    setVendorModalOpen(false)
    setGiftCardModalOpen(false)
    setInviteModalOpen(false)
    setHelpModalOpen(false)
  }

  const filterCat = (cat: MerchantCategory) => {
    onCategoryFilter?.(cat)
    setDrawerOpen(false)
    setZoneDropdownOpen(false)
    onNavigate('home')
    setTimeout(() => {
      const el = document.getElementById('merchants-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const goHome = () => {
    onCategoryFilter?.('ALL')
    onNavigate('home')
    setDrawerOpen(false)
    setAccountMenuOpen(false)
    setZoneDropdownOpen(false)
    setVendorModalOpen(false)
    setGiftCardModalOpen(false)
    setInviteModalOpen(false)
    setHelpModalOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToStores = () => {
    onCategoryFilter?.('ALL')
    onNavigate('home')
    setDrawerOpen(false)
    setZoneDropdownOpen(false)
    setTimeout(() => {
      const el = document.getElementById('merchants-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleZoneSelect = (z: string) => {
    setSelectedZone(z)
    try { localStorage.setItem('dlh_zone', z) } catch {}
    window.dispatchEvent(new CustomEvent('dlh:zone-change', { detail: { zone: z } }))
    setZoneDropdownOpen(false)
    setDrawerOpen(false)
    onNavigate('home')
    setTimeout(() => {
      const el = document.getElementById('merchants-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const copyInviteLink = () => {
    const link = typeof window !== 'undefined' ? window.location.origin : 'https://dlh.ht'
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        showToast('Lyen sit la kopye nan clipboard ou!', 'success')
      }).catch(() => {
        showToast('Lyen: ' + link, 'info')
      })
    } else {
      showToast('Lyen: ' + link, 'info')
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
    <header className="navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* ── Tier 1: Main Header Row (1:1 Maket Ayisyen Design) ── */}
      <nav className="ma-header-main">
        {/* Left: Menu Drawer Button + Logo */}
        <div className="ma-nav-left" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Hamburger Menu Button (Icon Only - No label) */}
          <button
            ref={menuBtnRef}
            onClick={() => setDrawerOpen(prev => !prev)}
            aria-label={drawerOpen ? "Fèmen meni an" : "Louvri meni an"}
            className={`ma-nav-menu-btn ${drawerOpen ? 'active' : ''}`}
            title="Meni"
          >
            {drawerOpen ? <IconX /> : <IconMenu />}
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
              className="ma-nav-logo-img"
              style={{ height: 36, width: 'auto', objectFit: 'contain' }}
            />
            <div className="ma-nav-brand-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="ma-nav-brand-main" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#17191C', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  DELIVERY
                </span>
                <span className="ma-nav-brand-accent" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#E11D48', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  LAKAY
                </span>
              </div>
              <span className="ma-nav-brand-subtitle" style={{ fontSize: '0.5625rem', color: '#64748B', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Makèt Ayisyen · Okap
              </span>
            </div>
          </div>
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

        {/* Right: Zone Dropdown + Account + Orders + Cart */}
        <div className="ma-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Dedicated Zone Selector Dropdown (Does NOT open drawer) */}
          <div ref={zoneRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setZoneDropdownOpen(prev => !prev)}
              className="desktop-only"
              title="Chanje zòn livrezon nan Cap-Haïtien"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#0F172A',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconMapPin />
              <span>{selectedZone}</span>
              <IconChevronDown />
            </button>

            {zoneDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 210,
                maxHeight: 340,
                overflowY: 'auto',
                background: '#FFFFFF',
                borderRadius: 12,
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.18)',
                border: '1px solid #E2E8F0',
                padding: '6px',
                zIndex: 1050,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', padding: '6px 8px' }}>
                  Chwazi Zòn nan Okap:
                </div>
                {ZONES.map(z => (
                  <button
                    key={z}
                    onClick={() => handleZoneSelect(z)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: selectedZone === z ? '#FFF3EB' : 'none',
                      color: selectedZone === z ? '#FF6000' : '#1E293B',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: selectedZone === z ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => { if (selectedZone !== z) e.currentTarget.style.background = '#F8FAFC' }}
                    onMouseLeave={e => { if (selectedZone !== z) e.currentTarget.style.background = 'none' }}
                  >
                    <span>{z}</span>
                    {selectedZone === z && <span style={{ color: '#FF6000', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account Button & Dropdown */}
          <div ref={accountRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setAccountMenuOpen(prev => !prev)}
              className="ma-nav-account-btn desktop-only"
              style={{ cursor: 'pointer' }}
            >
              <span className="ma-nav-sub-label">
                Bonjou, {user ? (user.firstName || 'zanmi') : 'konekte'}
              </span>
              <span className="ma-nav-main-label">
                Kont ▾
              </span>
            </button>

            {accountMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 210,
                background: '#FFFFFF',
                borderRadius: 12,
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                border: '1px solid #E2E8F0',
                padding: '8px 6px',
                zIndex: 1050,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                {user ? (
                  <>
                    <button
                      onClick={() => nav('profile')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <IconUser />
                      <span>Pwofil Mwen</span>
                    </button>
                    <button
                      onClick={() => nav('orders')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <IconClipboard />
                      <span>Kòmann Mwen</span>
                    </button>
                    <button
                      onClick={() => nav('terms')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>Kondisyon & Règleman</span>
                    </button>
                    <div style={{ height: 1, background: '#F1F5F9', margin: '4px 6px' }} />
                    <button
                      onClick={() => {
                        logout?.()
                        setAccountMenuOpen(false)
                        onNavigate('home')
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 700, color: '#DC2626', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>Dekonekte</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => nav('auth')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: '#FF6000', color: '#FFFFFF', border: 'none', borderRadius: 8,
                        fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer', justifyContent: 'center'
                      }}
                    >
                      Konekte / Enskri
                    </button>
                    <button
                      onClick={() => nav('orders')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer', marginTop: 4
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <IconClipboard />
                      <span>Swiv yon Kòmann</span>
                    </button>
                    <button
                      onClick={() => nav('terms')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>Kondisyon & Règleman</span>
                    </button>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false)
                        setHelpModalOpen(true)
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'none', border: 'none', borderRadius: 8, textAlign: 'left',
                        fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>Èd & Asistans</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

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

      {/* ── Tier 2: Subnav Strip (Solid Black Bar #000000 - Categories & Actions) ── */}
      <div className="ma-subnav-bar">
        <div className="ma-subnav-inner">
          <button
            className={`ma-subnav-link ${activeCategory === 'ALL' && page === 'home' ? 'active' : ''}`}
            onClick={goToStores}
          >
            Tout Pwodwi
          </button>

          <button
            className="ma-subnav-link"
            onClick={goToStores}
          >
            Tout Boutik
          </button>

          <button
            className={`ma-subnav-link ${activeCategory === 'RESTAURANT' ? 'active' : ''}`}
            onClick={() => filterCat('RESTAURANT')}
          >
            Restoran & Bar
          </button>

          <button
            className={`ma-subnav-link ${activeCategory === 'FAST_FOOD' ? 'active' : ''}`}
            onClick={() => filterCat('FAST_FOOD')}
          >
            Fast Food & Fritay
          </button>

          <button
            className={`ma-subnav-link ${activeCategory === 'SUPERMARKET' ? 'active' : ''}`}
            onClick={() => filterCat('SUPERMARKET')}
          >
            Sipèmache & Episri
          </button>

          <button
            className={`ma-subnav-link ${activeCategory === 'PHARMACY' ? 'active' : ''}`}
            onClick={() => filterCat('PHARMACY')}
          >
            Famasi & Sante
          </button>

          <button
            className={`ma-subnav-link ${activeCategory === 'CONSTRUCTION' ? 'active' : ''}`}
            onClick={() => filterCat('CONSTRUCTION')}
          >
            Materyo Konstriksyon
          </button>

          <button
            className={`ma-subnav-link ${activeCategory === 'BEVERAGE_DEPOT' ? 'active' : ''}`}
            onClick={() => filterCat('BEVERAGE_DEPOT')}
          >
            Dépôt Bwason
          </button>

          <button
            type="button"
            className="ma-subnav-link"
            onClick={() => nav('orders')}
          >
            Swiv Kòmann
          </button>

          <button
            ref={helpSubnavBtnRef}
            type="button"
            className={`ma-subnav-link ${helpModalOpen ? 'active' : ''}`}
            onClick={() => setHelpModalOpen(prev => !prev)}
          >
            Èd & Asistans
          </button>
        </div>
      </div>

      {/* ── Slide-Out Category Drawer (Maket Ayisyen Pattern) ── */}
      {drawerOpen && (
        <>
          <div
            className="ma-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            onTouchEnd={() => setDrawerOpen(false)}
          />
          <div ref={drawerContentRef} className="ma-drawer-content">
            {/* Header: Delivery Lakay Official Brand Header with Logo */}
            <div className="ma-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="ma-drawer-logo-badge">
                  <img
                    src="/logo.png"
                    alt="Delivery Lakay"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                      DELIVERY
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FF6000', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                      LAKAY
                    </span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>
                    Sèvis Livrezon · Cap-Haïtien
                  </span>
                </div>
              </div>
              <button
                className="ma-drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fèmen"
              >
                ✕
              </button>
            </div>

            <div className="ma-drawer-body">
              {/* ── KONT MWEN ── */}
              <div className="ma-drawer-section-title">
                KONT MWEN
              </div>

              {!user ? (
                <>
                  <div className="ma-drawer-row" onClick={() => nav('auth')}>
                    <div className="ma-drawer-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                      <IconLogIn />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ma-drawer-row-title">Konekte</div>
                      <div className="ma-drawer-row-sub">Aksede kont ou pou w kòmande</div>
                    </div>
                    <span className="ma-drawer-row-arrow">›</span>
                  </div>

                  <div className="ma-drawer-row" onClick={() => nav('auth')}>
                    <div className="ma-drawer-icon-box" style={{ background: '#F3E8FF', color: '#7C3AED' }}>
                      <IconUserPlus />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ma-drawer-row-title">Kreye yon kont</div>
                      <div className="ma-drawer-row-sub">Enskri kòm nouvo kliyan</div>
                    </div>
                    <span className="ma-drawer-row-arrow">›</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="ma-drawer-row" onClick={() => nav('profile')}>
                    <div className="ma-drawer-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      <IconUser />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ma-drawer-row-title">Pwofil mwen ({user.firstName || 'Kont'})</div>
                      <div className="ma-drawer-row-sub">{user.phoneNumber || 'Kliyan Delivery Lakay'}</div>
                    </div>
                    <span className="ma-drawer-row-arrow">›</span>
                  </div>

                  <div className="ma-drawer-row" onClick={() => nav('orders')}>
                    <div className="ma-drawer-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
                      <IconClipboard />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ma-drawer-row-title">Kòmann mwen yo</div>
                      <div className="ma-drawer-row-sub">Gade tout kòmand ou pase deja</div>
                    </div>
                    <span className="ma-drawer-row-arrow">›</span>
                  </div>

                  <div className="ma-drawer-row" onClick={() => { setDrawerOpen(false); logout() }}>
                    <div className="ma-drawer-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                      <IconLogOut />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ma-drawer-row-title" style={{ color: '#DC2626' }}>Dekonekte</div>
                      <div className="ma-drawer-row-sub">Kite kont ou an sekirite</div>
                    </div>
                  </div>
                </>
              )}

              <div
                className="ma-drawer-row"
                onClick={() => {
                  setDrawerOpen(false)
                  openCart()
                }}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                  <IconCart />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ma-drawer-row-title">Panye ({totalItems})</span>
                    {totalItems > 0 && (
                      <span style={{
                        background: '#FF6000',
                        color: '#FFFFFF',
                        fontSize: '0.625rem',
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: 10
                      }}>
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="ma-drawer-row-sub">Wè atik ou seleksyone yo</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />

              {/* ── ACHTE PA KATEGORI ── */}
              <div className="ma-drawer-section-title">
                ACHTE PA KATEGORI
              </div>

              <div
                className={`ma-drawer-row ${page === 'home' && activeCategory === 'ALL' ? 'active' : ''}`}
                onClick={goHome}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#FFF1F2', color: '#E11D48' }}>
                  <IconBag />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Tout pwodwi</div>
                  <div className="ma-drawer-row-sub">Tout etablisman & machandiz</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div
                className={`ma-drawer-row ${activeCategory === 'RESTAURANT' ? 'active' : ''}`}
                onClick={() => filterCat('RESTAURANT')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                  <IconUtensils />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Manje Ayisyen</div>
                  <div className="ma-drawer-row-sub">Restoran, bar & repa cho</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div
                className={`ma-drawer-row ${activeCategory === 'FAST_FOOD' ? 'active' : ''}`}
                onClick={() => filterCat('FAST_FOOD')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#FFFBEB', color: '#D97706' }}>
                  <IconFlame />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Epis ak Pwodwi Lakay</div>
                  <div className="ma-drawer-row-sub">Fritay, pate & pwodwi lokal</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div
                className={`ma-drawer-row ${activeCategory === 'CONSTRUCTION' ? 'active' : ''}`}
                onClick={() => filterCat('CONSTRUCTION')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#F0FDF4', color: '#059669' }}>
                  <IconTag />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Rad ak Akseswa</div>
                  <div className="ma-drawer-row-sub">Boutik mòd & stil Okap</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div
                className={`ma-drawer-row ${activeCategory === 'BEVERAGE_DEPOT' ? 'active' : ''}`}
                onClick={() => filterCat('BEVERAGE_DEPOT')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <IconBox />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Soulye</div>
                  <div className="ma-drawer-row-sub">Tenis, sandal & soulye klasik</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div
                className={`ma-drawer-row ${activeCategory === 'SUPERMARKET' ? 'active' : ''}`}
                onClick={() => filterCat('SUPERMARKET')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#ECFDF5', color: '#0D9488' }}>
                  <IconStore />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Sipèmache & Episri</div>
                  <div className="ma-drawer-row-sub">Pwovizyon, lwil, sik & dlo</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div
                className={`ma-drawer-row ${activeCategory === 'PHARMACY' ? 'active' : ''}`}
                onClick={() => filterCat('PHARMACY')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  <IconPill />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Famasi & Sante</div>
                  <div className="ma-drawer-row-sub">Medikaman & swen sante</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />

              {/* ── ASISTANS & SIPÒ ── */}
              <div className="ma-drawer-section-title">
                ÈD & SIPÒ
              </div>

              <div
                className="ma-drawer-row"
                onClick={() => nav('orders')}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                  <IconTruck />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Swiv yon kòmann</div>
                  <div className="ma-drawer-row-sub">Gade pozisyon livrè w la</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>

              <a
                href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mwen%20bezwen%20asistans."
                target="_blank"
                rel="noopener noreferrer"
                className="ma-drawer-row"
                style={{ textDecoration: 'none' }}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#DCFCE7' }}>
                  <IconWhatsApp size={18} color="#16A34A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">WhatsApp Sipò</div>
                  <div className="ma-drawer-row-sub">+509 40 55 36 36 · Repons rapid</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </a>

              <div
                className="ma-drawer-row"
                onClick={() => { setDrawerOpen(false); setHelpModalOpen(true) }}
              >
                <div className="ma-drawer-icon-box" style={{ background: '#F1F5F9', color: '#475569' }}>
                  <IconHelp />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ma-drawer-row-title">Sant Èd & Kesyon Souvan</div>
                  <div className="ma-drawer-row-sub">Pri livrezon, peman & delè</div>
                </div>
                <span className="ma-drawer-row-arrow">›</span>
              </div>
            </div>

            <div className="ma-drawer-footer">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  onNavigate('merchant-register')
                }}
                className="ma-sell-btn"
              >
                <IconStore />
                <span>Vin Vandè sou Delivery Lakay</span>
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.625rem', color: '#64748B', fontWeight: 600, marginTop: 10 }}>
                Delivery Lakay Haïti · Sèvis Livrezon Rapid
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL: Vin Vandè sou Delivery Lakay ── */}
      {vendorModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setVendorModalOpen(false)}>
          <div className="product-modal-card" style={{ maxWidth: 480, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF3EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6000' }}>
                  <IconStore />
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#FF6000', textTransform: 'uppercase' }}>
                    Patnè Komèsyal · Okap
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                    Vin Vandè sou Delivery Lakay
                  </h3>
                </div>
              </div>
              <button onClick={() => setVendorModalOpen(false)} className="product-modal-close" style={{ position: 'static' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              Ogmante lavant ou nan Cap-Haïtien! Nou delivre pwodwi w yo bay plizyè milye kliyan san w pa bezwen enkyete w pou livrè.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { title: '0 HTG Frè Enskripsyon', desc: 'Enskri boutik ou, restoran w oswa famasi w gratis sou platfòm lan.' },
                { title: 'Flòt Livrè Pwofesyonèl', desc: 'Chofè nou yo pase pran kòmand yo nan lokal ou epi livre yo rapid.' },
                { title: 'Peman Garanti & Rapid', desc: 'Resevwa tout lajan lavant ou dirèk sou MonCash, Natcash oswa labank.' },
                { title: 'Vizibilite nan Tout Okap', desc: 'Pwodwi w yo afiche devan plis pase 10,000 itilizatè aktif.' },
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setVendorModalOpen(false)
                  onNavigate('merchant-register')
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #FF6000 0%, #EA580C 100%)', color: '#FFFFFF', padding: '12px 18px', borderRadius: 10,
                  fontSize: '0.875rem', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 96, 0, 0.3)'
                }}
              >
                <IconStore />
                <span>Ale sou Paj Enskripsyon Machann nan</span>
              </button>

              <a
                href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mwen%20ta%20renmen%20vin%20vandè%20ak%20enskri%20boutik%20mwen%20sou%20platfòm%20nan%20nan%20Cap-Haïtien."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#25D366', color: '#FFFFFF', padding: '12px 18px', borderRadius: 10,
                  fontSize: '0.875rem', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                }}
              >
                <IconWhatsApp size={18} color="#FFFFFF" />
                <span>Aplike Kounye a sou WhatsApp</span>
              </a>

              <a
                href="tel:+50940553636"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#F1F5F9', color: '#0F172A', padding: '10px 18px', borderRadius: 10,
                  fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none'
                }}
              >
                <span>Rele Dispatch Patnè: +509 40 55 36 36</span>
              </a>

              <button
                type="button"
                onClick={() => nav('terms')}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}
              >
                Gade Kondisyon Itilizasyon & Règleman Patnè →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Kat Kado ── */}
      {giftCardModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setGiftCardModalOpen(false)}>
          <div className="product-modal-card" style={{ maxWidth: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#FF6000', textTransform: 'uppercase' }}>Kado Espesyal</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>Kat Kado Delivery Lakay</h3>
              </div>
              <button onClick={() => setGiftCardModalOpen(false)} className="product-modal-close" style={{ position: 'static' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              Fè fanmi oswa zanmi w plezi nan Cap-Haïtien. Yo ka itilize kat kado a pou kòmande nan nenpòt restoran, sipèmache oswa famasi sou Delivery Lakay.
            </p>

            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Chwazi Montan Kat la:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
              {[1000, 2500, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedGiftAmount(amount)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 10,
                    border: selectedGiftAmount === amount ? '2px solid #FF6000' : '1px solid #E2E8F0',
                    background: selectedGiftAmount === amount ? '#FFF3EB' : '#FFFFFF',
                    color: selectedGiftAmount === amount ? '#FF6000' : '#0F172A',
                    fontWeight: 900,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {amount.toLocaleString('fr-HT')} HTG
                </button>
              ))}
            </div>

            <a
              href={`https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mwen%20ta%20renmen%20achte%20yon%20Kat%20Kado%20ki%20vo%20${selectedGiftAmount}%20HTG%20pou%20yon%20moun%20nan%20Cap-Haïtien.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#FF6000', color: '#FFFFFF', padding: '12px 18px', borderRadius: 10,
                fontSize: '0.875rem', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(255, 96, 0, 0.3)'
              }}
            >
              <span>Kòmande Kat Kado sa sou WhatsApp ({selectedGiftAmount.toLocaleString('fr-HT')} HTG)</span>
            </a>
          </div>
        </div>
      )}

      {/* ── MODAL: Envite Zanmi ── */}
      {inviteModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setInviteModalOpen(false)}>
          <div className="product-modal-card" style={{ maxWidth: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>Kominote Okap</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>Envite Fanmi & Zanmi w</h3>
              </div>
              <button onClick={() => setInviteModalOpen(false)} className="product-modal-close" style={{ position: 'static' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              Pataje sit Delivery Lakay la pou zanmi w ak fanmi w ka benefisye livrezon rapid nan Cap-Haïtien!
            </p>

            <div style={{ display: 'flex', gap: 8, background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 10, padding: '8px 12px', alignItems: 'center', marginBottom: 16 }}>
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.origin : 'https://dlh.ht'}
                style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.8125rem', color: '#0F172A', fontWeight: 700, outline: 'none' }}
              />
              <button
                type="button"
                onClick={copyInviteLink}
                style={{
                  background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6,
                  padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                Kopye Lyen
              </button>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Bonjou! M ap envite w itilize Delivery Lakay pou kòmande manje, famasi, ak pwovizyon nan tout Cap-Haïtien ak livrezon rapid: ${typeof window !== 'undefined' ? window.location.origin : 'https://dlh.ht'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#25D366', color: '#FFFFFF', padding: '12px 18px', borderRadius: 10,
                fontSize: '0.875rem', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
            >
              <IconWhatsApp size={18} color="#FFFFFF" />
              <span>Pataje sou WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* ── MODAL: Èd & Asistans ── */}
      {helpModalOpen && (
        <div
          className="product-modal-backdrop"
          onClick={() => setHelpModalOpen(false)}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) setHelpModalOpen(false)
          }}
        >
          <div
            ref={helpModalCardRef}
            className="product-modal-card"
            style={{ maxWidth: 460, padding: 24, cursor: 'default' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Sipò Kliyan 24/7</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>Sant Èd & Asistans DLH</h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="product-modal-close"
                style={{
                  position: 'static',
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#475569'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              Ekip sipò nou an baze nan Cap-Haïtien epi disponib 7 jou sou 7 pou ede w ak kòmand ou yo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <a
                href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mwen%20bezwen%20èd%20oswa%20asistans%20sou%20sit%20la."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: '#F0FDF4',
                  border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px', textDecoration: 'none'
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                  <IconWhatsApp size={18} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#14532D' }}>Ekri nou sou WhatsApp</div>
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>+509 40 55 36 36 · Repons rapid an kèk minit</div>
                </div>
              </a>

              <a
                href="tel:+50940553636"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', textDecoration: 'none'
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>Rele Dispatch Dirèk</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>+509 40 55 36 36 · 8:00 AM – 10:00 PM</div>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  setHelpModalOpen(false)
                  nav('orders')
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: '#FFF3EB',
                  border: '1px solid #FFEDD5', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FF6000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
                  <IconClipboard />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#9A3412' }}>Swiv Kòmann Ou</div>
                  <div style={{ fontSize: '0.75rem', color: '#C2410C' }}>Gade estati kòmand ou an tan reyèl</div>
                </div>
              </button>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', border: '1px solid #E2E8F0', marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Kesyon Moun Poze Souvan:</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.5 }}>
                • <strong>Pri livrezon:</strong> 150 HTG nan tout Cap-Haïtien.<br />
                • <strong>Mwayen Peman:</strong> MonCash, Natcash ak Espès lè kòmand rive.<br />
                • <strong>Delè livrezon:</strong> 20 pou rive 45 minit selon distans la.
              </div>
            </div>

            {/* Bouton Tounen nan Aplikasyon an */}
            <button
              type="button"
              onClick={() => setHelpModalOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0F172A')}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Tounen nan Aplikasyon an</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
