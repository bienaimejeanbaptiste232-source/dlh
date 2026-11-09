import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useCart } from '../contexts/CartContext'
import {
  fetchMerchants,
  fetchProducts,
  fetchAllProducts,
  type Merchant,
  type Product
} from '../lib/api'
import { showToast } from '../lib/toast'

// ─── Inline SVG Icons (Crisp & High-Performance) ────────────────
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="#F59E0B" width="13" height="13">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="13" height="13">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="13" height="13">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="18" height="18">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="14" height="14">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconStore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────
const formatHTG = (n: number) => `${Math.round(n).toLocaleString('fr-HT')} HTG`

const TYPE_META: Record<string, { label: string }> = {
  RESTAURANT:      { label: 'Restoran & Bar' },
  GROCERY:         { label: 'Episri & Pwovizyon' },
  PHARMACY:        { label: 'Famasi & Sante' },
  SUPERMARKET:     { label: 'Sipèmache' },
  BAKERY:          { label: 'Boulanjri' },
  FAST_FOOD:       { label: 'Fast Food & Fritay' },
  CONSTRUCTION:    { label: 'Materyo Konstriksyon' },
  BEVERAGE_DEPOT:  { label: 'Dépôt Bwason & Dlo' },
}

const getMeta = (type: string) => TYPE_META[type?.toUpperCase()] ?? { label: type || 'Komès' }

function getMerchantBanner(m: Merchant) {
  if (m.bannerUrl) return m.bannerUrl
  if (m.logoUrl) return m.logoUrl
  if (m.type === 'PHARMACY') return 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1000&q=80'
  if (m.type === 'CONSTRUCTION') return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80'
  if (m.type === 'BEVERAGE_DEPOT') return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1000&q=80'
  if (m.type === 'SUPERMARKET' || m.type === 'GROCERY') return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&q=80'
  if (m.type === 'FAST_FOOD') return 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1000&q=80'
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80'
}

function getProductImage(product: Product, type = '') {
  if (product.imageUrl) return product.imageUrl
  const name = (product.name || '').toLowerCase()
  if (name.includes('bouyon') || name.includes('soup') || name.includes('joumou')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80'
  }
  if (name.includes('diri') || name.includes('riz') || name.includes('legim') || name.includes('pwa')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80'
  }
  if (name.includes('jus') || name.includes('bwason') || name.includes('grenadia') || name.includes('kowosol') || name.includes('dlo')) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
  }
  if (name.includes('pate') || name.includes('fritay') || name.includes('bannann') || name.includes('griot') || name.includes('tassot')) {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
  }
  if (type === 'PHARMACY') {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  }
  if (type === 'CONSTRUCTION') {
    return 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80'
  }
  if (type === 'BEVERAGE_DEPOT') {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80'
  }
  if (type === 'SUPERMARKET' || type === 'GROCERY') {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
  }
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
}

// ── Authentic Haitian Market Categories ─────────────────────────
const CATEGORY_ITEMS = [
  { key: 'ALL', label: 'Tout Kategori', icon: '🛍️' },
  { key: 'RESTAURANT', label: 'Restoran & Bar', icon: '🍽️' },
  { key: 'FAST_FOOD', label: 'Fast Food & Fritay', icon: '🍗' },
  { key: 'SUPERMARKET', label: 'Sipèmache & Pwovizyon', icon: '🛒' },
  { key: 'PHARMACY', label: 'Famasi & Sante', icon: '💊' },
  { key: 'CONSTRUCTION', label: 'Materyo Konstriksyon', icon: '🧱' },
  { key: 'BEVERAGE_DEPOT', label: 'Dépôt Bwason & Dlo', icon: '🥤' },
]

// ── Hero Promotional Slides (Maket Ayisyen 1:1 Reference) ────
const HERO_SLIDES = [
  {
    tag: 'PWOMOSYON',
    title: 'BIZNIS OU SE PA NOU',
    desc: 'Lanse, vann epi livre pwodwi w yo bay dè milye kliyan nan tout vil Okap ak tout katye yo.',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    filter: 'ALL',
    cta: 'Wè plis →'
  },
  {
    tag: 'LIVREZON OKAP',
    title: 'LIVREZON SOU TOUT VIL OKAP',
    desc: 'Kousye moto rapid devan baryè w anndan 20-30 minit. Manje cho, makèt ak pwodwi famasi.',
    img: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1200&q=80',
    filter: 'ALL',
    cta: 'Wè plis →'
  },
  {
    tag: 'PEMAN FASIL',
    title: 'MONCASH, NATCASH & KACH',
    desc: 'Peye an sekirite dirèk sou telefòn ou oswa lè kousye a livre koli a nan men w.',
    img: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=1200&q=80',
    filter: 'ALL',
    cta: 'Wè plis →'
  }
]

// ── Flash Countdown Timer Hook ──────────────────────────────────
function useFlashCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 15 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 4, minutes: 0, seconds: 0 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
}

export default function HomePage({
  initialFilter = 'ALL',
  initialStoreId = null,
  onSelectStore,
  onFilterChange
}: {
  initialFilter?: string
  initialStoreId?: string | null
  onSelectStore?: (id: string | null) => void
  onFilterChange?: (f: string) => void
}) {
  const { addItem, items, updateQty } = useCart()

  // ── States ────────────────────────────────────────────────────
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState(initialFilter)
  const [sortBy, setSortBy] = useState<'all' | 'open' | 'rating' | 'fast'>('all')
  const [error, setError] = useState<string | null>(null)

  // Store Detail View State
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [storeProducts, setStoreProducts] = useState<Product[]>([])
  const [storeProdLoading, setStoreProdLoading] = useState(false)
  const [activeMenuCat, setActiveMenuCat] = useState('Tout')

  // Global Product Preview Modal State (Full description, no image overflow)
  const [previewProduct, setPreviewProduct] = useState<{
    product: Product
    img: string
    storeName: string
    merchantId?: string
  } | null>(null)
  const [clickedId, setClickedId] = useState<string | null>(null)

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0)
  const sliderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const flashRailRef = useRef<HTMLDivElement>(null)
  const countdown = useFlashCountdown()

  const scrollFlashRail = (dir: 'left' | 'right') => {
    if (flashRailRef.current) {
      flashRailRef.current.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' })
    }
  }

  // ── Sync initial filter ───────────────────────────────────────
  useEffect(() => {
    setFilterType(initialFilter)
  }, [initialFilter])

  // ── Listen to custom navbar search event ──────────────────────
  useEffect(() => {
    const handleDlhSearch = (e: any) => {
      if (e.detail?.query !== undefined) {
        setSearch(e.detail.query)
        listRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    window.addEventListener('dlh:search', handleDlhSearch)
    return () => window.removeEventListener('dlh:search', handleDlhSearch)
  }, [])

  // ── Load Merchants and All Products from Supabase ─────────────
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([
      fetchMerchants(),
      fetchAllProducts(36)
    ])
      .then(([mList, pList]) => {
        if (!active) return
        setMerchants(mList)
        setAllProducts(pList)
        setLoading(false)
      })
      .catch(err => {
        if (!active) return
        console.error('Error loading data:', err)
        setError('Koneksyon an pran yon ti tan. N ap re-eseye...')
        setLoading(false)
      })

    return () => { active = false }
  }, [])

  // ── Sync selected store from URL / props ──────────────────────
  useEffect(() => {
    if (!initialStoreId) {
      if (selectedMerchant) {
        setSelectedMerchant(null)
        setStoreProducts([])
      }
      return
    }
    if (merchants.length > 0) {
      const found = merchants.find(m => m.id === initialStoreId)
      if (found) {
        setSelectedMerchant(found)
      }
    }
  }, [initialStoreId, merchants])

  // ── Fetch store products when merchant selected ───────────────
  useEffect(() => {
    if (!selectedMerchant) return
    let active = true
    setStoreProdLoading(true)

    fetchProducts(selectedMerchant.id)
      .then(prods => {
        if (!active) return
        setStoreProducts(prods)
        setStoreProdLoading(false)
      })
      .catch(() => {
        if (!active) return
        setStoreProdLoading(false)
      })

    return () => { active = false }
  }, [selectedMerchant])

  // ── Slider Autoplay ───────────────────────────────────────────
  useEffect(() => {
    sliderTimerRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)
    }, 5500)
    return () => {
      if (sliderTimerRef.current) clearInterval(sliderTimerRef.current)
    }
  }, [])

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  // ── Filtered Merchants ────────────────────────────────────────
  const filteredMerchants = useMemo(() => {
    let result = merchants.filter(m => {
      const matchType = filterType === 'ALL' || m.type?.toUpperCase() === filterType.toUpperCase()
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.address && m.address.toLowerCase().includes(search.toLowerCase()))
      return matchType && matchSearch
    })

    if (sortBy === 'open') {
      result = result.filter(m => m.isOpen)
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5))
    } else if (sortBy === 'fast') {
      result.sort((a, b) => (a.avgPrepTimeMinutes || 25) - (b.avgPrepTimeMinutes || 25))
    }
    return result
  }, [merchants, filterType, search, sortBy])

  // ── Popular / Trending Products (from allProducts) ───────────
  const trendingProducts = useMemo(() => {
    return allProducts.slice(0, 10)
  }, [allProducts])

  // Duplicated for seamless infinite marquee scrolling (Right to Left)
  const loopedTrendingProducts = useMemo(() => {
    if (trendingProducts.length === 0) return []
    let list = [...trendingProducts]
    while (list.length < 8) {
      list = [...list, ...trendingProducts]
    }
    return [...list, ...list]
  }, [trendingProducts])

  // ── Flash Deal Products (simulated discount & progress) ───────
  const flashProducts = useMemo(() => {
    return allProducts.slice(0, 6).map((p, idx) => ({
      ...p,
      discount: idx % 2 === 0 ? 20 : 15,
      oldPrice: Math.round(p.price * (idx % 2 === 0 ? 1.25 : 1.18)),
      soldPercent: 65 + (idx * 5) % 30
    }))
  }, [allProducts])

  // ── Find merchant name for a product ──────────────────────────
  const getStoreNameForProduct = (prod: Product): string => {
    if (selectedMerchant) return selectedMerchant.name
    if (prod.merchant?.name) return prod.merchant.name
    const found = merchants.find(m => m.id === prod.merchantId)
    return found ? found.name : 'Delivery Lakay'
  }

  // ── Cart helpers ──────────────────────────────────────────────
  const getQty = (prodId: string) => {
    const item = items.find(i => i.id === prodId)
    return item ? item.quantity : 0
  }

  const handleAddToCart = (product: Product, merchantName = 'Delivery Lakay') => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: getProductImage(product),
      restaurantId: product.merchantId || (selectedMerchant?.id ?? 'dlh-marketplace'),
      restaurantName: merchantName,
      restaurantCategory: product.category?.name || 'Pwodwi Lokal'
    })
    showToast(`Ajoute nan panyen: ${product.name}`, 'success')
  }

  // ── Open Product Modal ────────────────────────────────────────
  const openProductModal = (product: Product, storeName?: string) => {
    setClickedId(product.id)
    setTimeout(() => setClickedId(null), 400)
    const sName = storeName || getStoreNameForProduct(product)
    const img = getProductImage(product, selectedMerchant?.type || '')
    setPreviewProduct({
      product,
      img,
      storeName: sName,
      merchantId: product.merchantId || selectedMerchant?.id
    })
  }

  // ── Select Store from Modal or Card ───────────────────────────
  const handleSelectStoreById = (storeId?: string) => {
    if (!storeId) return
    const found = merchants.find(m => m.id === storeId)
    if (found) {
      setPreviewProduct(null)
      setSelectedMerchant(found)
      onSelectStore?.(found.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: STORE DETAIL / MENU VIEW (When a merchant is clicked)
  // ══════════════════════════════════════════════════════════════
  if (selectedMerchant) {
    const banner = getMerchantBanner(selectedMerchant)
    const meta = getMeta(selectedMerchant.type)

    // Extract categories
    const categories = ['Tout', ...Array.from(new Set(
      storeProducts
        .map(p => p.category?.name || 'Meni Jeneral')
        .filter(Boolean)
    ))]

    const displayedProducts = activeMenuCat === 'Tout'
      ? storeProducts
      : storeProducts.filter(p => (p.category?.name || 'Meni Jeneral') === activeMenuCat)

    const storeDesc = selectedMerchant.description ||
      `Byenvini nan ${selectedMerchant.name}! Nou ofri pi bon chwa nan ${meta.label.toLowerCase()} nan zòn Cap-Haïtien. Tout pwodwi nou yo prepare fre ak bon jan kalite pou delivre rapid devan pòt ou.`

    return (
      <div className="page" style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px 48px' }}>
        {/* Back Button */}
        <button
          onClick={() => {
            setSelectedMerchant(null)
            onSelectStore?.(null)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.8125rem',
            fontWeight: 800,
            color: '#1E293B',
            cursor: 'pointer',
            marginBottom: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <IconArrowLeft />
          <span>← Retounen nan Tout Boutik Yo</span>
        </button>

        {/* ── STORE HEADER CARD (Zero Image Overflow / Clean Separation) ── */}
        <div className="ma-store-header-card">
          {/* Banner Image Container */}
          <div className="ma-store-banner-wrap">
            <img
              src={banner}
              alt={selectedMerchant.name}
              className="ma-store-banner-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
              }}
            />
            {/* Overlay Badges */}
            <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
              <span style={{
                background: selectedMerchant.isOpen ? '#059669' : '#475569',
                color: '#FFFFFF',
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 6,
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {selectedMerchant.isOpen ? '● Ouvè Kounye a' : 'Fèmen pou Kounye a'}
              </span>
              <span style={{
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#FFFFFF',
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                backdropFilter: 'blur(4px)'
              }}>
                {meta.label}
              </span>
            </div>
          </div>

          {/* Store Info Content Section (Proper padding, zero text spill) */}
          <div className="ma-store-info-box">
            <div className="ma-store-title-row">
              <div>
                <h1 className="ma-store-name">{selectedMerchant.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <IconStar />
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>
                    {selectedMerchant.rating ? selectedMerchant.rating.toFixed(1) : '4.9'}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>
                    (Boutik Verifye pa Delivery Lakay)
                  </span>
                </div>
              </div>

              {selectedMerchant.phone && (
                <a
                  href={`https://wa.me/${selectedMerchant.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <span>💬 WhatsApp Boutik la</span>
                </a>
              )}
            </div>

            {/* Full Store Description */}
            <div className="ma-store-desc-box">
              <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.8125rem', marginBottom: 4 }}>
                Enfòmasyon & Deskripsyon Boutik la:
              </strong>
              <span>{storeDesc}</span>
            </div>

            {/* Key Facts Strip */}
            <div className="ma-store-meta-grid">
              {selectedMerchant.address && (
                <span className="ma-store-meta-item">
                  <IconMapPin />
                  <span>{selectedMerchant.address}</span>
                </span>
              )}
              <span className="ma-store-meta-item">
                <IconClock />
                <span>Preparasyon: {selectedMerchant.avgPrepTimeMinutes || 25}–{(selectedMerchant.avgPrepTimeMinutes || 25) + 15} min</span>
              </span>
              <span className="ma-store-meta-item" style={{ color: '#FF6000', fontWeight: 800 }}>
                🛵 Livrezon 150 HTG nan tout Cap-Haïtien
              </span>
              <span className="ma-store-meta-item">
                💳 MonCash, Natcash & Espès
              </span>
            </div>
          </div>
        </div>

        {/* Menu Categories Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20, scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveMenuCat(cat)}
              style={{
                flexShrink: 0,
                background: activeMenuCat === cat ? '#FF6000' : '#FFFFFF',
                color: activeMenuCat === cat ? '#FFFFFF' : '#334155',
                border: activeMenuCat === cat ? '1px solid #FF6000' : '1px solid #E2E8F0',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        {storeProdLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
            Chaje meni ak pwodwi yo...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748B'
          }}>
            Pa gen atik disponib nan kategori sa a pou kounye a.
          </div>
        ) : (
          <div className="ma-pc-grid">
            {displayedProducts.map(p => {
              const img = getProductImage(p, selectedMerchant.type)
              const qty = getQty(p.id)
              return (
                <div
                  key={p.id}
                  className={`ma-pc ${clickedId === p.id ? 'is-clicked' : ''}`}
                  onClick={() => openProductModal(p, selectedMerchant.name)}
                >
                  <div
                    className="ma-pc-media"
                  >
                    <img src={img} alt={p.name} className="ma-pc-img" />
                    <span className="ma-pc-badge">Detay</span>
                  </div>
                  <div className="ma-pc-body">
                    <div
                      className="ma-pc-title"
                    >
                      {p.name}
                    </div>
                    {p.description && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#64748B',
                        margin: '0 0 8px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4
                      }}>
                        {p.description}
                      </p>
                    )}
                    <div className="ma-pc-foot">
                      <div className="ma-pc-price">{formatHTG(p.price)}</div>
                      {qty > 0 ? (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF3EB', borderRadius: 8, padding: '3px 6px', border: '1px solid #FF6000' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => updateQty(p.id, qty - 1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex', alignItems: 'center' }}
                          >
                            <IconMinus />
                          </button>
                          <span style={{ fontWeight: 900, fontSize: '0.8125rem', color: '#FF6000', minWidth: 16, textAlign: 'center' }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQty(p.id, qty + 1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex', alignItems: 'center' }}
                          >
                            <IconPlus />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="ma-pc-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(p, selectedMerchant.name)
                          }}
                        >
                          <IconPlus />
                          <span>Ajoute</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Global Product Preview Modal rendered below */}
        {renderProductModal()}
      </div>
    )
  }

  // ── Render Global Product Modal ───────────────────────────────
  function renderProductModal() {
    if (!previewProduct) return null
    const { product, img, storeName, merchantId } = previewProduct
    const qty = getQty(product.id)
    const effectiveQty = qty > 0 ? qty : 1
    const totalItemPrice = product.price * effectiveQty

    const productFullDesc = product.description ||
      `Atik bon jan kalite espesyal ${product.name} prepare pa patnè nou an "${storeName}" nan Cap-Haïtien. Tout engredyan yo chwazi ak swen pou garanti fraîcheur ak gou otantik. Kòmande li kounye a pou livrezon dirèk devan baryè w.`

    return (
      <div
        className="product-modal-backdrop"
        onClick={() => setPreviewProduct(null)}
      >
        <div
          className="product-modal-card"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            className="product-modal-close"
            onClick={() => setPreviewProduct(null)}
            aria-label="Fèmen"
          >
            ✕
          </button>

          {/* Contained Image Frame (Zero Overflow) */}
          <div className="ma-prod-modal-wrap">
            <img
              src={img}
              alt={product.name}
              className="ma-prod-modal-img"
            />
            {product.category?.name && (
              <span style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: '#FF6000',
                color: '#FFFFFF',
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 6,
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                {product.category.name}
              </span>
            )}
          </div>

          {/* Modal Information Body */}
          <div style={{ padding: '14px 18px' }}>
            {/* Store link badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span
                onClick={() => handleSelectStoreById(merchantId)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#FF6000',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <IconStore />
                <span>{storeName}</span>
                <span style={{ textDecoration: 'underline' }}>Wè boutik la →</span>
              </span>

              <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 800 }}>
                ● Disponib
              </span>
            </div>

            {/* Title */}
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
              {product.name}
            </h3>

            {/* Price Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.1875rem', fontWeight: 900, color: '#0F172A' }}>
                {formatHTG(product.price)}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700 }}>
                ● Pri transparan · Livrezon rapid Okap
              </span>
            </div>

            {/* Clean Product Description */}
            <p style={{
              margin: '0 0 10px 0',
              fontSize: '0.8125rem',
              lineHeight: 1.45,
              color: '#475569',
              background: '#F8FAFC',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E2E8F0'
            }}>
              {product.description || `Pwodwi fre ak bon kalite prepare pa ${storeName}. Disponib pou livrezon rapid nan Cap-Haïtien.`}
            </p>

            {/* Delivery / Prep Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.6875rem',
              color: '#64748B',
              marginBottom: 14
            }}>
              <IconClock />
              <span>Tan preparasyon: <strong>20–30 minit</strong></span>
            </div>

            {/* Action Bar: Quantity Controls + Add To Cart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {qty > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FFF3EB',
                  border: '1.5px solid #FF6000',
                  borderRadius: 10,
                  padding: '6px 12px'
                }}>
                  <button
                    onClick={() => updateQty(product.id, qty - 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex' }}
                  >
                    <IconMinus />
                  </button>
                  <span style={{ fontWeight: 900, fontSize: '0.9375rem', color: '#FF6000', minWidth: 20, textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => updateQty(product.id, qty + 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex' }}
                  >
                    <IconPlus />
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  handleAddToCart(product, storeName)
                  setPreviewProduct(null)
                }}
                className="product-modal-add-btn"
                style={{ flex: 1 }}
              >
                <IconPlus />
                <span>
                  {qty > 0
                    ? `Ajoute Plis (${formatHTG(totalItemPrice)})`
                    : `Ajoute nan Panyen (${formatHTG(product.price)})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: MAIN HOME / CATALOGUE (Maket Ayisyen Layout + DLH Brand)
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="page" style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* ── 1. Hero 2-Card Split Layout (1:1 Maket Ayisyen Reference) ── */}
      <section className="ma-hero-maket" aria-label="Pwomosyon & Vandè Makèt Ayisyen">
        {/* Left Card: Promo Slider Card (~70% width) */}
        <div className="ma-hero-slider-card">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`ma-hero-slide-item ${idx === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.img})` }}
            >
              <div className="ma-hero-slide-overlay" />
              <div className="ma-hero-slide-content">
                <span className="ma-hero-promo-badge">
                  🏷️ {slide.tag}
                </span>
                <h1 className="ma-hero-slide-headline">{slide.title}</h1>
                <button
                  className="ma-hero-slide-cta-pill"
                  onClick={() => {
                    if (slide.filter !== 'ALL') {
                      setFilterType(slide.filter)
                      onFilterChange?.(slide.filter)
                    }
                    listRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <span>{slide.cta || 'Wè plis →'}</span>
                </button>
              </div>
            </div>
          ))}

          {/* Left / Right Circular Arrow Buttons ‹ and › */}
          <button className="ma-hero-arrow-btn left" onClick={prevSlide} aria-label="Anvan">‹</button>
          <button className="ma-hero-arrow-btn right" onClick={nextSlide} aria-label="Apre">›</button>

          {/* Slider Pagination (Active pill dash + round dots) */}
          <div className="ma-hero-dots-wrap">
            {HERO_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`ma-hero-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>

        {/* Right Card: Seller Card ("Vin vandè sou Maket") (~30% width) */}
        <div className="ma-hero-seller-card">
          <div className="ma-seller-icon-circle">
            <IconStore />
          </div>
          <span className="ma-seller-tag-pill">POU VANDÈ</span>
          <h2 className="ma-seller-card-title">Vin vandè sou Delivery Lakay</h2>
          <a
            href="https://wa.me/50940553636?text=Mwen%20vle%20vin%20vande%20sou%20Delivery%20Lakay"
            target="_blank"
            rel="noopener noreferrer"
            className="ma-seller-card-cta-btn"
          >
            Vin Vandè →
          </a>

          {/* Bottom Chat / Help Bubble (Exact Maket Ayisyen Widget) */}
          <div className="ma-seller-bottom-widget">
            <a
              href="https://wa.me/50940553636?text=Bonjou%20mwen%20bezwen%20ede"
              target="_blank"
              rel="noopener noreferrer"
              className="ma-seller-chat-bubble"
            >
              <span>How can we help? · Kijan nou ka ede w?</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. Trust Ribbon (Maket Ayisyen 4 Pillars) ── */}
      <section className="ma-trust-strip" aria-label="Garanti Delivery Lakay">
        <div className="ma-trust-item">
          <div className="ma-trust-icon">🔒</div>
          <div className="ma-trust-text">
            <span className="ma-trust-title">Peman Sekirize</span>
            <span className="ma-trust-sub">MonCash, Natcash & Kat</span>
          </div>
        </div>
        <div className="ma-trust-item">
          <div className="ma-trust-icon">✅</div>
          <div className="ma-trust-text">
            <span className="ma-trust-title">Vandè Verifye</span>
            <span className="ma-trust-sub">Biznis lokal sètifye</span>
          </div>
        </div>
        <div className="ma-trust-item">
          <div className="ma-trust-icon">🚚</div>
          <div className="ma-trust-text">
            <span className="ma-trust-title">Livrezon Rapid</span>
            <span className="ma-trust-sub">Cap-Haïtien nan kèk minit</span>
          </div>
        </div>
        <div className="ma-trust-item">
          <div className="ma-trust-icon">💬</div>
          <div className="ma-trust-text">
            <span className="ma-trust-title">Sipò 24/7</span>
            <span className="ma-trust-sub">WhatsApp dirèk Okap</span>
          </div>
        </div>

        {/* Haitian Payment Trust Badges */}
        <div className="ma-payment-badges-row">
          <span className="ma-pay-badge moncash">🔴 MonCash Aksepte</span>
          <span className="ma-pay-badge natcash">🟠 Natcash Aksepte</span>
          <span className="ma-pay-badge cash">🟢 Peye Lè Livrezon Rive (Kach)</span>
          <span className="ma-pay-badge card">💳 Kat Bankè Sekirize</span>
        </div>
      </section>

      {/* ── 4. ⚡ Ofri Flash (Live Countdown Deals Rail — Ultra-Clean) ── */}
      {flashProducts.length > 0 && (
        <section id="flash-offers" className="ma-flash-box" aria-label="Ofri Flash">
          <div className="ma-flash-header">
            <div className="ma-flash-title-wrap">
              <h2 className="ma-sec-title" style={{ margin: 0 }}>⚡ Ofri Flash</h2>
              <span className="ma-flash-badge">Rabè Espesyal</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="ma-flash-timer">
                <span className="ma-flash-timer-dot" />
                <span>Fini nan: {countdown}</span>
              </div>

              {/* Smooth Scroll Navigation Arrows */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="desktop-only">
                <button
                  className="ma-rail-nav-btn"
                  onClick={() => scrollFlashRail('left')}
                  aria-label="Anvan"
                >
                  ‹
                </button>
                <button
                  className="ma-rail-nav-btn"
                  onClick={() => scrollFlashRail('right')}
                  aria-label="Apre"
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="ma-flash-rail" ref={flashRailRef}>
            {flashProducts.map(fp => {
              const img = getProductImage(fp)
              const sName = getStoreNameForProduct(fp)
              const qty = getQty(fp.id)
              return (
                <div
                  key={fp.id}
                  className={`ma-pc ${clickedId === fp.id ? 'is-clicked' : ''}`}
                  style={{ width: 160, flexShrink: 0 }}
                  onClick={() => openProductModal(fp, sName)}
                >
                  <div
                    className="ma-pc-media"
                  >
                    <img src={img} alt={fp.name} className="ma-pc-img" />
                    <span className="ma-pc-badge">-{fp.discount}%</span>
                  </div>
                  <div className="ma-pc-body">
                    <div
                      className="ma-pc-title"
                    >
                      {fp.name}
                    </div>

                    {/* Sleek Minimal Stock Indicator */}
                    <div style={{ margin: '4px 0 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, marginBottom: 4 }}>
                        <span>⚡ Rete sèlman kèk</span>
                        <span style={{ color: '#FF6000' }}>{fp.soldPercent}% vann</span>
                      </div>
                      <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${fp.soldPercent}%`, height: '100%', background: '#FF6000', borderRadius: 2 }} />
                      </div>
                    </div>

                    <div className="ma-pc-foot">
                      <div className="ma-pc-price-wrap">
                        <span className="ma-pc-price">{formatHTG(fp.price)}</span>
                        <span className="ma-pc-old-price">{formatHTG(fp.oldPrice)}</span>
                      </div>
                      {qty > 0 ? (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFF3EB', borderRadius: 8, padding: '2px 5px', border: '1px solid #FF6000' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => updateQty(fp.id, qty - 1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex', padding: 2 }}
                          >
                            <IconMinus />
                          </button>
                          <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#FF6000', minWidth: 14, textAlign: 'center' }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQty(fp.id, qty + 1)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex', padding: 2 }}
                          >
                            <IconPlus />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="ma-pc-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(fp, sName)
                          }}
                        >
                          <IconPlus />
                          <span>Ajoute</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 5. 🔥 Pi popilè kounye a (Animated Smooth Marquee: Adwat pou Agoch) ── */}
      {trendingProducts.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="ma-sec-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className="ma-sec-title">🔥 Pi popilè kounye a</h2>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  background: '#FFF3EB',
                  color: '#FF6000',
                  padding: '2px 8px',
                  borderRadius: 12,
                  letterSpacing: '0.3px'
                }}>
                  ● An mouvman
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: 2 }}>
                Plat ak pwodwi ki pi popilè jodi a (pase sourit la pou kanpe li)
              </div>
            </div>
            <button
              className="ma-sec-link"
              onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Wè tout meni →
            </button>
          </div>

          {/* Continuous Infinite Animated Marquee (Right to Left) */}
          <div className="ma-popular-marquee-container">
            <div className="ma-popular-marquee-track">
              {loopedTrendingProducts.map((p, idx) => {
                const img = getProductImage(p)
                const qty = getQty(p.id)
                const sName = getStoreNameForProduct(p)
                return (
                  <div
                    key={`${p.id}-${idx}`}
                    className={`ma-pc ${clickedId === p.id ? 'is-clicked' : ''}`}
                    style={{ width: 165, flexShrink: 0 }}
                    onClick={() => openProductModal(p, sName)}
                  >
                    <div
                      className="ma-pc-media"
                    >
                      <img src={img} alt={p.name} className="ma-pc-img" />
                      {/* Clean Minimal Rating Pill in Top-Right */}
                      <div className="ma-pc-rating-pill">
                        <IconStar />
                        <span>4.9</span>
                      </div>
                    </div>
                    <div className="ma-pc-body">
                      <div
                        className="ma-pc-title"
                      >
                        {p.name}
                      </div>

                      <div className="ma-pc-meta-row">
                        <span>⏱ Livrezon Okap</span>
                        <span>·</span>
                        <span style={{ color: '#059669', fontWeight: 700 }}>Disponib</span>
                      </div>

                      <div className="ma-pc-foot">
                        <div className="ma-pc-price-wrap">
                          <span className="ma-pc-price">{formatHTG(p.price)}</span>
                        </div>
                        {qty > 0 ? (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFF3EB', borderRadius: 8, padding: '2px 5px', border: '1px solid #FF6000' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => updateQty(p.id, qty - 1)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex', padding: 2 }}
                            >
                              <IconMinus />
                            </button>
                            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#FF6000', minWidth: 14, textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQty(p.id, qty + 1)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6000', display: 'flex', padding: 2 }}
                            >
                              <IconPlus />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="ma-pc-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(p, sName)
                            }}
                          >
                            <IconPlus />
                            <span>Ajoute</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. 🏪 Boutik & Restoran Rekòmande (Stores Grid) ── */}
      <section ref={listRef} id="merchants-section" style={{ marginBottom: 40 }}>
        <div className="ma-sec-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2 className="ma-sec-title">
            🏪 {filterType === 'ALL' ? 'Boutik & Restoran Rekòmande' : getMeta(filterType).label}
          </h2>
          <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 700 }}>
            {filteredMerchants.length} etablisman disponib
          </div>
        </div>

        {/* Active Search Indicator (From Top Search) */}
        {search && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFF3EB',
            border: '1px solid #FF6000',
            borderRadius: 20,
            padding: '4px 12px',
            marginBottom: 14,
            fontSize: '0.8125rem',
            color: '#FF6000',
            fontWeight: 700
          }}>
            <span>Rechèch: « {search} »</span>
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: '#FF6000', cursor: 'pointer', fontWeight: 900, padding: 0 }}
              title="Efase rechèch"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Filter Buttons (All, Open, Rating, Fast) */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20, scrollbarWidth: 'none' }}>
          {[
            { key: 'all' as const, label: 'Tout Etablisman' },
            { key: 'open' as const, label: '● Ouvè Kounye a' },
            { key: 'rating' as const, label: '★ Pi Bon Nòt' },
            { key: 'fast' as const, label: '⏱ Livrezon Rapid' },
          ].map(item => {
            const active = sortBy === item.key
            return (
              <button
                key={item.key}
                onClick={() => setSortBy(item.key)}
                style={{
                  flexShrink: 0,
                  background: active ? '#FFF3EB' : '#FFFFFF',
                  color: active ? '#FF6000' : '#475569',
                  border: active ? '1.5px solid #FF6000' : '1px solid #E2E8F0',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Merchants Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
            Chaje etablisman yo...
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748B'
          }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B', marginBottom: 8 }}>
              Pa gen okenn etablisman ki koresponn ak rechèch ou a.
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: '#FF6000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                Efase Rechèch
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 18
          }}>
            {filteredMerchants.map(m => {
              const banner = getMerchantBanner(m)
              const meta = getMeta(m.type)
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMerchant(m)
                    onSelectStore?.(m.id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#FF6000'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ height: 140, position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={banner}
                      alt={m.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: m.isOpen ? '#059669' : '#475569',
                      color: '#FFFFFF',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 5,
                      textTransform: 'uppercase'
                    }}>
                      {m.isOpen ? '● Ouvè' : 'Fèmen'}
                    </div>
                    {m.rating && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '0.6875rem',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        <IconStar />
                        <span>{m.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 3 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
                      {m.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconClock />
                        <span>{m.avgPrepTimeMinutes || 25}–{(m.avgPrepTimeMinutes || 25) + 15} min</span>
                      </span>
                      <span style={{ color: '#FF6000', fontWeight: 700 }}>
                        Livrezon 150 HTG
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 7. ⭐ Temwayaj Kliyan Okap & Zòn Kouvri (Social Proof & Coverage) ── */}
      <section style={{ marginBottom: 40 }}>
        <div className="ma-sec-header">
          <div>
            <h2 className="ma-sec-title">⭐ Kliyan Okap yo bay avi yo</h2>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: 2 }}>
              Plis pase 10,000 kòmand livre ak satisfaksyon nan Nò a
            </div>
          </div>
          <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 800 }}>
            ★ 4.9 / 5 (850+ kòmantè)
          </span>
        </div>

        {/* 3 Review Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 20
        }}>
          {[
            {
              name: 'Patrick S.',
              zone: 'Vertières, Okap',
              stars: 5,
              text: 'Manje a te rive cho anndan 25 minit! Kousye a te trè politi. Mwen te peye ak MonCash san pyès tèt chaje.',
              avatar: 'PS',
              bg: '#FFF3EB',
              color: '#FF6000'
            },
            {
              name: 'Marie-Ange D.',
              zone: 'Carenage, Okap',
              stars: 5,
              text: 'Mwen te bezwen medikaman nan famasi ta lannwit pou pitit mwen. Livrè a te rive rapid devan baryè a. Yon vrè delivrans!',
              avatar: 'MD',
              bg: '#ECFDF5',
              color: '#059669'
            },
            {
              name: 'Jean-Baptiste F.',
              zone: 'Champ de Mars, Okap',
              stars: 5,
              text: 'Pi bon sèvis livrezon nan vil la. Pri yo klè, pa gen frè kache, epi kòmand la rive egzakteman sa m te mande a.',
              avatar: 'JF',
              bg: '#EFF6FF',
              color: '#2563EB'
            }
          ].map((t, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: t.bg,
                    color: t.color,
                    fontWeight: 900,
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0F172A' }}>{t.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{t.zone}</div>
                  </div>
                </div>
                <div style={{ color: '#F59E0B', fontSize: '0.8125rem', fontWeight: 800 }}>
                  {'★'.repeat(t.stars)}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, fontStyle: 'italic' }}>
                « {t.text} »
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: '0.6875rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✓ Kliyan Verifye Okap</span>
              </div>
            </div>
          ))}
        </div>

        {/* Cap-Haïtien Neighborhoods Coverage Strip */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#0F172A' }}>
              📍 Zòn & Katye Nou Kouvri nan Cap-Haïtien:
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 800 }}>
              ● Livrezon aktif 7/7
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              'Sant-Vil Okap',
              'Carenage',
              'Rival',
              'Barrière-Bouteille',
              'Madeline',
              'Vertières',
              'Champ de Mars',
              'Vaudreuil',
              'Quartier Morin',
              'Limonade',
              'Milot'
            ].map(zone => (
              <span
                key={zone}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                {zone}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. How It Works (4 Clean Steps) ── */}
      <section style={{ margin: '36px 0 20px', textAlign: 'center' }}>
        <h2 className="ma-sec-title" style={{ justifyContent: 'center', marginBottom: 24 }}>
          Kijan Sèvis la Travay
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20
        }}>
          {[
            { step: '01', title: 'Chwazi Meni Ou', desc: 'Eksplore pi bon restoran ak komès nan Cap-Haïtien', icon: '🍽️' },
            { step: '02', title: 'Pase Kòmand', desc: 'Chwazi MonCash, Natcash, oswa peye nan livrezon', icon: '📱' },
            { step: '03', title: 'Kousye an Wout', desc: 'Yon livrè dedye pran kòmand lan imedyatman', icon: '🛵' },
            { step: '04', title: 'Resevwa Lakay Ou', desc: 'Resevwa lòd ou cho e fre devan pòt ou', icon: '🏠' },
          ].map(s => (
            <div
              key={s.step}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '24px 18px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
              <div style={{ color: '#FF6000', fontWeight: 900, fontSize: '0.75rem', marginBottom: 4 }}>ETAP {s.step}</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{s.title}</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.4 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Global Product Preview Modal */}
      {renderProductModal()}
    </div>
  )
}
