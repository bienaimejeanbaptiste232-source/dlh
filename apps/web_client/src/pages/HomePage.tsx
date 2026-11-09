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

// ── Hero Promotional Slides ─────────────────────────────────────
const HERO_SLIDES = [
  {
    tag: '🇭🇹 Delivery Lakay',
    title: 'Pi gwo mache ak livrezon anliy ann Ayiti.',
    desc: 'Kòmande manje cho, pwovizyon, medikaman ak pwodwi lokal — livrezon rapid nan tout Cap-Haïtien ak tout zòn yo.',
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    filter: 'ALL',
    cta: 'Kòmanse Kòmande →'
  },
  {
    tag: 'Restoran & Gastronomi',
    title: 'Pi bon tab Okap delivre cho devan pòt ou.',
    desc: 'Griyad, diri djon-djon, pitza, fritay ak espesyalite kreyòl pare nan 20-30 minit.',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    filter: 'RESTAURANT',
    cta: 'Wè Meni Restoran Yo →'
  },
  {
    tag: 'Sipèmache & Pwovizyon',
    title: 'Tout pwovizyon lakay ou san deplase.',
    desc: 'Episri, bwason, dlo trete ak tout nesesite kay la delivre dirèk devan baryè w.',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    filter: 'SUPERMARKET',
    cta: 'Fè Pwovizyon Kounye a →'
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
  const [previewProduct, setPreviewProduct] = useState<{ product: Product; img: string } | null>(null)

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0)
  const sliderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const countdown = useFlashCountdown()

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
    return allProducts.slice(0, 8)
  }, [allProducts])

  // ── Flash Deal Products (simulated discount & progress) ───────
  const flashProducts = useMemo(() => {
    return allProducts.slice(0, 6).map((p, idx) => ({
      ...p,
      discount: idx % 2 === 0 ? 20 : 15,
      oldPrice: Math.round(p.price * (idx % 2 === 0 ? 1.25 : 1.18)),
      soldPercent: 65 + (idx * 5) % 30
    }))
  }, [allProducts])

  // ── Cart helper ───────────────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════
  // VIEW: STORE DETAIL / MENU VIEW (When a merchant is opened)
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

    return (
      <div className="page" style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px 40px' }}>
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <IconArrowLeft />
          <span>Retounen nan Mache a</span>
        </button>

        {/* Store Header Banner */}
        <div style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ height: 220, position: 'relative' }}>
            <img
              src={banner}
              alt={selectedMerchant.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(10,25,47,0.88) 100%)' }} />
          </div>

          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 24,
            right: 24,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  background: selectedMerchant.isOpen ? '#059669' : '#475569',
                  color: '#FFFFFF',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 5,
                  textTransform: 'uppercase'
                }}>
                  {selectedMerchant.isOpen ? '● Ouvè Kounye a' : 'Fèmen'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>
                  {meta.label}
                </span>
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.5px' }}>
                {selectedMerchant.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#CBD5E1', fontSize: '0.8125rem', marginTop: 4 }}>
                {selectedMerchant.address && <span>📍 {selectedMerchant.address}</span>}
                <span>⏱ 25–35 min</span>
                <span>🛵 Livrezon 150 HTG</span>
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <span>Kontakte Vandè a</span>
              </a>
            )}
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
            Chaje meni an...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
            Pa gen atik disponib nan kategori sa a pou kounye a.
          </div>
        ) : (
          <div className="ma-pc-grid">
            {displayedProducts.map(p => {
              const img = getProductImage(p, selectedMerchant.type)
              const qty = getQty(p.id)
              return (
                <div key={p.id} className="ma-pc">
                  <div className="ma-pc-media" onClick={() => setPreviewProduct({ product: p, img })}>
                    <img src={img} alt={p.name} className="ma-pc-img" />
                    <span className="ma-pc-badge">{selectedMerchant.name.slice(0, 16)}</span>
                  </div>
                  <div className="ma-pc-body">
                    <div className="ma-pc-store">{p.category?.name || meta.label}</div>
                    <div className="ma-pc-title" onClick={() => setPreviewProduct({ product: p, img })}>{p.name}</div>
                    {p.description && (
                      <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 8px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </p>
                    )}
                    <div className="ma-pc-foot">
                      <div className="ma-pc-price">{formatHTG(p.price)}</div>
                      {qty > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF3EB', borderRadius: 8, padding: '3px 6px', border: '1px solid #FF6000' }}>
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
                          onClick={() => handleAddToCart(p, selectedMerchant.name)}
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

        {/* Product Preview Modal */}
        {previewProduct && (
          <div
            onClick={() => setPreviewProduct(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                maxWidth: 480,
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ height: 220, position: 'relative' }}>
                <img src={previewProduct.img} alt={previewProduct.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => setPreviewProduct(null)}
                  style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                  {previewProduct.product.name}
                </h3>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FF6000', marginBottom: 12 }}>
                  {formatHTG(previewProduct.product.price)}
                </div>
                {previewProduct.product.description && (
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
                    {previewProduct.product.description}
                  </p>
                )}
                <button
                  onClick={() => {
                    handleAddToCart(previewProduct.product, selectedMerchant.name)
                    setPreviewProduct(null)
                  }}
                  style={{
                    width: '100%',
                    background: '#FF6000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(255,96,0,0.3)'
                  }}
                >
                  Ajoute nan Panyen ({formatHTG(previewProduct.product.price)})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW: MAIN HOME / CATALOGUE (Maket Ayisyen Layout + DLH Brand)
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="page" style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* ── 1. Hero Split Top: Promo Carousel + Vin Vandè Aside ── */}
      <section className="ma-hero-top" aria-label="Pwomosyon ak Reklam">
        {/* Left: Carousel */}
        <div className="ma-slider">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`ma-slide ${idx === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.img})` }}
            >
              <div className="ma-slide-overlay" />
              <div className="ma-slide-body">
                <span className="ma-slide-tag">{slide.tag}</span>
                <h2 className="ma-slide-title">{slide.title}</h2>
                <p className="ma-slide-desc">{slide.desc}</p>
                <button
                  className="ma-slide-cta"
                  onClick={() => {
                    if (slide.filter !== 'ALL') {
                      setFilterType(slide.filter)
                      onFilterChange?.(slide.filter)
                    }
                    listRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <span>{slide.cta}</span>
                </button>
              </div>
            </div>
          ))}

          {/* Slider Arrows */}
          <div className="ma-slider-nav">
            <button className="ma-nav-btn" onClick={prevSlide} aria-label="Anvan">‹</button>
            <button className="ma-nav-btn" onClick={nextSlide} aria-label="Apre">›</button>
          </div>

          {/* Slider Dots */}
          <div className="ma-slider-dots">
            {HERO_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`ma-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>

        {/* Right: Side Column (Vin Vandè + Mini Cards) */}
        <div className="ma-side-col">
          {/* Vin Vandè Aside Card */}
          <aside className="ma-sell-card">
            <span className="ma-sell-badge">
              <IconStore />
              <span>Pou vandè ak komèsan</span>
            </span>
            <h3 className="ma-sell-title">Vin vandè sou Delivery Lakay</h3>
            <p className="ma-sell-desc">
              Louvri boutik ou gratis epi kòmanse vann bay dè milye kliyan ann Ayiti.
            </p>
            <ul className="ma-sell-list">
              <li>
                <IconCheck />
                <span>Boutik ou pare nan kèk minit</span>
              </li>
              <li>
                <IconCheck />
                <span>Peman sekirize (MonCash, Natcash, Kat)</span>
              </li>
              <li>
                <IconCheck />
                <span>Kousye nou yo pran swen tout livrezon</span>
              </li>
            </ul>
            <a
              href="https://wa.me/50940553636?text=Mwen%20vle%20vin%20vande%20sou%20Delivery%20Lakay"
              target="_blank"
              rel="noopener noreferrer"
              className="ma-sell-btn"
            >
              <span>Vin Vandè Kounye a →</span>
            </a>
          </aside>

          {/* Mini Action Cards */}
          <div className="ma-mini-cards">
            <a
              href="https://wa.me/50940553636?text=Mwen%20vle%20voye%20yon%20Kat%20Kado%20bay%20fanmi%20m"
              target="_blank"
              rel="noopener noreferrer"
              className="ma-mini-card"
            >
              <span className="ma-mini-icon">🎁</span>
              <strong className="ma-mini-title">Kat Kado</strong>
              <span className="ma-mini-sub">Voye bay fanmi w</span>
            </a>

            <div
              onClick={() => {
                const trackInput = document.getElementById('merchant-search')
                trackInput?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="ma-mini-card"
            >
              <span className="ma-mini-icon">📦</span>
              <strong className="ma-mini-title">Swiv Kòmann</strong>
              <span className="ma-mini-sub">Kote koli ou ye</span>
            </div>
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
      </section>

      {/* ── 3. Achte pa Kategori (Horizontal Category Rail) ── */}
      <section style={{ marginBottom: 32 }}>
        <div className="ma-sec-header">
          <h2 className="ma-sec-title">Achte pa kategori</h2>
          <button
            className="ma-sec-link"
            onClick={() => {
              setFilterType('ALL')
              onFilterChange?.('ALL')
            }}
          >
            Tout kategori →
          </button>
        </div>

        <div className="ma-cat-rail">
          {CATEGORY_ITEMS.map(c => {
            const isActive = filterType === c.key
            return (
              <button
                key={c.key}
                className={`ma-cat-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setFilterType(c.key)
                  onFilterChange?.(c.key)
                  listRef.current?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <span className="ma-cat-pill-icon">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 4. ⚡ Ofri Flash (Live Countdown Deals Rail) ── */}
      {flashProducts.length > 0 && (
        <section id="flash-offers" className="ma-flash-box" aria-label="Ofri Flash">
          <div className="ma-flash-header">
            <div className="ma-flash-title-wrap">
              <h2 className="ma-sec-title" style={{ margin: 0 }}>⚡ Ofri Flash</h2>
              <span className="ma-flash-badge">Tan Limite</span>
            </div>
            <div className="ma-flash-timer">
              <span className="ma-flash-timer-dot" />
              <span>Fini nan: {countdown}</span>
            </div>
          </div>

          <div className="ma-flash-rail">
            {flashProducts.map(fp => {
              const img = getProductImage(fp)
              return (
                <div
                  key={fp.id}
                  className="ma-pc"
                  style={{ width: 220, flexShrink: 0 }}
                >
                  <div className="ma-pc-media">
                    <img src={img} alt={fp.name} className="ma-pc-img" />
                    <span className="ma-pc-badge">⚡ -{fp.discount}%</span>
                    <span className="ma-pc-discount">Flash</span>
                  </div>
                  <div className="ma-pc-body">
                    <div className="ma-pc-store">{fp.category?.name || 'Ofri Espesyal'}</div>
                    <div className="ma-pc-title">{fp.name}</div>

                    {/* Stock Progress Bar */}
                    <div style={{ margin: '6px 0 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#64748B', fontWeight: 700, marginBottom: 3 }}>
                        <span>Vann: {fp.soldPercent}%</span>
                        <span style={{ color: '#FF6000' }}>Rete kèk</span>
                      </div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${fp.soldPercent}%`, height: '100%', background: '#FF6000', borderRadius: 3 }} />
                      </div>
                    </div>

                    <div className="ma-pc-foot">
                      <div className="ma-pc-price-wrap">
                        <span className="ma-pc-price">{formatHTG(fp.price)}</span>
                        <span className="ma-pc-old-price">{formatHTG(fp.oldPrice)}</span>
                      </div>
                      <button
                        className="ma-pc-btn"
                        onClick={() => handleAddToCart(fp, 'Ofri Flash')}
                      >
                        <IconPlus />
                        <span>Ajoute</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 5. 🔥 Pi popilè kounye a (Maket Ayisyen .pc Cards) ── */}
      {trendingProducts.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="ma-sec-header">
            <h2 className="ma-sec-title">🔥 Pi popilè kounye a</h2>
            <button
              className="ma-sec-link"
              onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Wè plis →
            </button>
          </div>

          <div className="ma-pc-grid">
            {trendingProducts.map(p => {
              const img = getProductImage(p)
              const qty = getQty(p.id)
              return (
                <div key={p.id} className="ma-pc">
                  <div className="ma-pc-media">
                    <img src={img} alt={p.name} className="ma-pc-img" />
                    <span className="ma-pc-badge">🔥 Popilè</span>
                  </div>
                  <div className="ma-pc-body">
                    <div className="ma-pc-store">{p.category?.name || 'Pwodwi Lokal'}</div>
                    <div className="ma-pc-title">{p.name}</div>
                    <div className="ma-pc-rating">
                      <IconStar />
                      <span>4.9 (120+ kòmand)</span>
                    </div>
                    <div className="ma-pc-foot">
                      <div className="ma-pc-price">{formatHTG(p.price)}</div>
                      {qty > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF3EB', borderRadius: 8, padding: '3px 6px', border: '1px solid #FF6000' }}>
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
                          onClick={() => handleAddToCart(p, 'Delivery Lakay')}
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

        {/* Search Bar in Catalogue */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <IconSearch />
          <input
            id="merchant-search"
            type="text"
            placeholder="Chèche yon restoran, boutik, famasi nan Cap-Haïtien..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.875rem',
              color: '#0F172A',
              background: 'transparent'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          )}
        </div>

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

      {/* ── 7. Merchant Recruitment Bottom Banner (Maket Ayisyen) ── */}
      <section className="ma-cta-banner">
        <div className="ma-cta-content">
          <span className="ma-cta-eyebrow">🇭🇹 Fè Kòb Ak Biznis Ou</span>
          <h2 className="ma-cta-title">Ou gen yon boutik oswa yon restoran? Vann li!</h2>
          <p className="ma-cta-sub">
            Plis pase 10,000 kliyan nan Cap-Haïtien ap chèche sa w genyen. Nou jere livrezon, kousye ak peman pou ou.
          </p>
        </div>
        <a
          href="https://wa.me/50940553636?text=Mwen%20vle%20louvri%20boutik%20mwen%20sou%20Delivery%20Lakay"
          target="_blank"
          rel="noopener noreferrer"
          className="ma-cta-btn"
        >
          Louvri Boutik Ou Gratis →
        </a>
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
    </div>
  )
}
