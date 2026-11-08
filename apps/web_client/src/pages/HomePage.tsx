import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useCart } from '../contexts/CartContext'
import { fetchMerchants, fetchProducts, fetchPlatformSettings, resolveMediaUrl, type Merchant, type Product } from '../lib/api'

// ─── Inline Icons ─────────────────────────────────────────────
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="rating-star" width="14" height="14">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="14" height="14">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="14" height="14">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="20" height="20">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z"/>
  </svg>
)
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="16" height="16">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width="16" height="16">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconFire = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width="18" height="18">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

// ─── Crisp Line Icons for Categories (Zero Emojis) ─────────────
const IconCatAll = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
const IconCatRestaurant = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <path d="M18 2v20M18 2a4 4 0 0 0-4 4v4h4M6 2v6a3 3 0 0 0 6 0V2M9 8v14" />
  </svg>
)
const IconCatFastFood = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <path d="M4 11h16a1 1 0 0 0 1-1 7 7 0 0 0-14 0 1 1 0 0 0 1 1z" />
    <path d="M4 15h16" />
    <rect x="3" y="17" width="18" height="4" rx="2" />
  </svg>
)
const IconCatSupermarket = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)
const IconCatPharmacy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)
const IconCatConstruction = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)
const IconCatBeverage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
    <path d="M7 2h10l-1 9a4 4 0 0 1-8 0L7 2z" />
    <line x1="12" y1="15" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
)

// ─── Hero Carousel Slides — Authentic Cap-Haïtien data ──────────
const HERO_SLIDES = [
  {
    id: 1,
    tag: 'Restoran \u2022 Cap-Ha\u00ebtien',
    title: 'Pi bon tab Okap,\nlivre cho nan adrès ou',
    sub: 'Griyad, diri ak djon-djon, pitza ak espesyalite lokal nan pwen ou ye a.',
    bg: 'linear-gradient(135deg, #0D0812 0%, #1A0A24 50%, #6D1240 100%)',
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=85',
    cta: 'Wè Meni Restoran Yo',
    filter: 'RESTAURANT',
    accent: '#E11D48',
    stat: { val: '25', unit: 'min', label: 'livrezon' },
  },
  {
    id: 2,
    tag: 'Famasi \u2022 Cap-Ha\u00ebtien',
    title: 'Medikaman ijans ak\npreskripsyon livrezon rapid',
    sub: 'Koneksyon direk ak famasi verifye — konfidansyèl, san deplase.',
    bg: 'linear-gradient(135deg, #03111F 0%, #061B38 50%, #0C4A8A 100%)',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1400&q=85',
    cta: 'Eksplore Famasi Yo',
    filter: 'PHARMACY',
    accent: '#0EA5E9',
    stat: { val: '30', unit: 'min', label: 'livrezon' },
  },
  {
    id: 3,
    tag: 'Makèt \u2022 Cap-Ha\u00ebtien',
    title: 'Tout pwovizyon lakay ou\nen yon sèl kòmand',
    sub: 'Episri, bwason, dlo trete ak tout nesesite kay la san deplase.',
    bg: 'linear-gradient(135deg, #021A10 0%, #042A1C 50%, #065F36 100%)',
    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85',
    cta: 'Kòmanse Pwovizyon',
    filter: 'GROCERY',
    accent: '#10B981',
    stat: { val: '40', unit: 'min', label: 'livrezon' },
  },
]

// ─── Value Propositions (Trust Strip) ─────────────────────────
const VALUE_PROPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FF6000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    title: 'Peman Sekirize & Fasil',
    desc: 'MonCash, Natcash, oswa Espès (Cash) dirèkteman sou livrezon.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FF6000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Livrezon Express 25–35 Min',
    desc: 'Kousye dedye ak swivi kòmand an tan reyèl depi restoran an.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FF6000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={22} height={22}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: 'Sipò Kliyan Lokal nan Okap',
    desc: 'Asistans telefòn ak WhatsApp disponib 7 jou sou 7 pou tout kòmand.',
  },
]

// ─── Type map: merchant type → label (Clean & Professional) ──
const TYPE_META: Record<string, { label: string }> = {
  RESTAURANT:      { label: 'Restoran' },
  GROCERY:         { label: 'Episri & Pwovizyon' },
  PHARMACY:        { label: 'Famasi & Sante' },
  SUPERMARKET:     { label: 'Sipèmache' },
  BAKERY:          { label: 'Boulanjri' },
  FAST_FOOD:       { label: 'Fast Food' },
  CONSTRUCTION:    { label: 'Materyo & Zouti' },
  BEVERAGE_DEPOT:  { label: 'Dépôt Bwason' },
}

const getMeta = (type: string) => TYPE_META[type?.toUpperCase()] ?? { label: type || 'Komès' }
const formatHTG  = (n: number) => `${n.toLocaleString('fr-HT')} Gdes`

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

function getProductImage(product: Product, type: string) {
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

// ─── Hero Carousel Component — Cinematic & Professional ──────────
function HeroCarousel({ onFilterChange, customSlide }: { onFilterChange: (f: string) => void; customSlide?: any }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [contentVisible, setContentVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({})

  const s1 = customSlide?.slide1 || customSlide
  const s2 = customSlide?.slide2
  const s3 = customSlide?.slide3

  const slides = [
    {
      ...HERO_SLIDES[0],
      title: s1?.title || HERO_SLIDES[0].title,
      sub: s1?.sub || HERO_SLIDES[0].sub,
      tag: s1?.tag || HERO_SLIDES[0].tag,
      img: s1?.img || HERO_SLIDES[0].img,
      cta: s1?.cta || HERO_SLIDES[0].cta,
    },
    {
      ...HERO_SLIDES[1],
      title: s2?.title || HERO_SLIDES[1].title,
      sub: s2?.sub || HERO_SLIDES[1].sub,
      tag: s2?.tag || HERO_SLIDES[1].tag,
      img: s2?.img || HERO_SLIDES[1].img,
      cta: s2?.cta || HERO_SLIDES[1].cta,
    },
    {
      ...HERO_SLIDES[2],
      title: s3?.title || HERO_SLIDES[2].title,
      sub: s3?.sub || HERO_SLIDES[2].sub,
      tag: s3?.tag || HERO_SLIDES[2].tag,
      img: s3?.img || HERO_SLIDES[2].img,
      cta: s3?.cta || HERO_SLIDES[2].cta,
    },
  ]

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      transitionTo((prev: number) => (prev + 1) % slides.length, 'right')
    }, 6000)
  }

  const transitionTo = (getNext: (c: number) => number, dir: 'left' | 'right') => {
    if (animating) return
    setAnimating(true)
    setDirection(dir)
    setContentVisible(false)
    setTimeout(() => {
      setCurrent(c => getNext(c))
      setTimeout(() => {
        setAnimating(false)
        setContentVisible(true)
      }, 80)
    }, 340)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slides.length])

  const goTo = (idx: number) => {
    const dir = idx > current ? 'right' : 'left'
    transitionTo(() => idx, dir)
    resetTimer()
  }
  const prev = () => { transitionTo(c => (c - 1 + slides.length) % slides.length, 'left'); resetTimer() }
  const next = () => { transitionTo(c => (c + 1) % slides.length, 'right'); resetTimer() }

  // Touch swipe gesture for phones
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const diff = touchStartX.current - touchEndX.current
    if (diff > 45) {
      next()
    } else if (diff < -45) {
      prev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  const slide = slides[current]

  return (
    <div
      className="hero-carousel"
      style={{ background: slide.bg }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Preload all images ───────── */}
      {slides.map((s, i) => (
        <img key={i} src={s.img} alt="" style={{ display: 'none' }} onLoad={() => setImgLoaded(p => ({ ...p, [i]: true }))} />
      ))}

      {/* ── Background image with cinematic pan ── */}
      <div
        key={`bg-${current}`}
        className={`hero-bg-layer hero-bg-${direction}`}
        style={{ backgroundImage: `url(${slide.img})` }}
      />

      {/* ── Rich gradient overlay ─── */}
      <div className="hero-overlay-rich" />

      {/* ── Grain texture (pro film look) ─── */}
      <div className="hero-grain" />

      {/* ── Right-side decorative image panel ─── */}
      <div
        key={`side-${current}`}
        className={`hero-side-panel hero-bg-${direction}`}
        style={{ backgroundImage: `url(${slide.img})` }}
      />

      {/* ── Content ─────────────────── */}
      <div className={`hero-content-wrap ${contentVisible ? 'hero-content-in' : 'hero-content-out'}`}>

        {/* Live indicator pill */}
        <div className="hero-live-pill">
          <span className="hero-live-dot" />
          <span>{slide.tag}</span>
        </div>

        {/* Title */}
        <h1 className="hero-headline">
          {slide.title.split('\n').map((line: string, i: number) => (
            <span key={i} style={{ display: 'block', animationDelay: `${i * 60}ms` }}>
              {line}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p className="hero-sub">{slide.sub}</p>

        {/* CTA row */}
        <div className="hero-actions">
          <button
            className="hero-btn-primary"
            onClick={() => onFilterChange(slide.filter as any)}
          >
            <span>{slide.cta}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={15} height={15}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Delivery stat chip */}
          {'stat' in slide && (
            <div className="hero-stat-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <strong>{(slide as any).stat.val}</strong>
              <span>{(slide as any).stat.unit} {(slide as any).stat.label}</span>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="hero-trust-row">
          {[
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={12} height={12}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Kousye Verifye' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={12} height={12}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: 'MonCash & Natcash' },
            { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={12} height={12}><polyline points="20 6 9 17 4 12"/></svg>, label: 'Cash sou livrezon' },
          ].map((b, i) => (
            <div key={i} className="hero-trust-badge">
              {b.icon}
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nav arrows ──────────────── */}
      <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Slide anvan">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={16} height={16}>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Slide apre">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={16} height={16}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {/* ── Progress dots ─────────── */}
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'hero-dot-active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Slide counter ─────────── */}
      <div className="hero-counter">
        <span className="hero-counter-current">{String(current + 1).padStart(2, '0')}</span>
        <span className="hero-counter-sep"> / </span>
        <span className="hero-counter-total">{String(slides.length).padStart(2, '0')}</span>
      </div>
    </div>
  )
}

// ─── Featured Merchant Card (horizontal scroll) ───────────────
function FeaturedCard({ m, onClick }: { m: Merchant; onClick: () => void }) {
  const meta = getMeta(m.type)
  const banner = getMerchantBanner(m)
  const prepMin = m.avgPrepTimeMinutes ?? 25
  return (
    <div className="featured-card" onClick={onClick} style={{ cursor: m.isOpen ? 'pointer' : 'not-allowed', filter: m.isOpen ? 'none' : 'grayscale(40%)' }}>
      <div className="featured-card-img-wrap">
        <img
          src={banner}
          alt={m.name}
          className="featured-card-img"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80' }}
        />
        {/* "Pi Popilè" badge */}
        <div className="featured-card-badge">
          <svg viewBox="0 0 24 24" fill="white" width={11} height={11}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>Pi Popilè</span>
        </div>
        {m.rating && (
          <div className="featured-card-rating">
            <svg viewBox="0 0 24 24" fill="#F59E0B" width={11} height={11}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>{m.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="featured-card-body">
        <div className="featured-card-name">{m.name}</div>
        <div className="featured-card-meta">
          <span>{meta.label}</span>
          <span>·</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={11} height={11}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>{(prepMin ?? 25) + 10}–{(prepMin ?? 25) + 25} min</span>
        </div>
        {m.address && (
          <div className="featured-card-addr">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={10} height={10}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {m.address.length > 26 ? m.address.slice(0, 26) + '…' : m.address}
          </div>
        )}
        <div className="featured-card-status">
          {m.isOpen ? (
            <span className="badge badge-open" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6875rem' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'inline-block' }} />
              Louvri
            </span>
          ) : (
            <span className="badge badge-closed" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6875rem' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'inline-block' }} />
              Fèmen
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton loader row ─────────────────────────────────────
const RestoSkeleton = () => (
  <>
    {[1,2,3,4,5,6].map(i => (
      <div key={i} style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'white' }}>
        <div className="skeleton" style={{ height: 160 }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <div className="skeleton" style={{ height: 20, marginBottom: 8, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
        </div>
      </div>
    ))}
  </>
)

const FeaturedSkeleton = () => (
  <>
    {[1,2,3].map(i => (
      <div key={i} className="featured-card" style={{ flexShrink: 0 }}>
        <div className="skeleton" style={{ height: 140, borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }} />
        <div style={{ padding: '12px 14px' }}>
          <div className="skeleton" style={{ height: 16, marginBottom: 8, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
        </div>
      </div>
    ))}
  </>
)

// ── Merchant Card ─────────────────────────────────────────────
function MerchantCard({ m, onClick }: { m: Merchant; onClick: () => void }) {
  const meta = getMeta(m.type)
  const prepMin = m.avgPrepTimeMinutes ?? 25
  const delivMin = 10
  const timeRange = `${prepMin + delivMin}–${prepMin + delivMin + 15}`
  const banner = getMerchantBanner(m)

  return (
    <div
      id={`merchant-${m.id}`}
      className="resto-card"
      onClick={() => m.isOpen && onClick()}
      style={{ cursor: m.isOpen ? 'pointer' : 'not-allowed', filter: m.isOpen ? 'none' : 'grayscale(40%)' }}>

      {/* Image zone */}
      <div style={{ position: 'relative', height: 172, overflow: 'hidden' }}>
        <img
          src={banner}
          alt={m.name}
          className="resto-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
          }}
        />
        {/* Bottom fade for legibility */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.38))',
          pointerEvents: 'none',
        }} />

        {/* Top-left: open/closed + unverified */}
        <div className="resto-badges">
          {m.isOpen ? (
            <span className="badge badge-open" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#059669', color: '#FFFFFF', fontWeight: 800, padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block', boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
              Louvri Kounye a
            </span>
          ) : (
            <span className="badge badge-closed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#475569', color: '#FFFFFF', fontWeight: 700, padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }} />
              Fèmen pou Kounye a
            </span>
          )}
          {!m.isVerified && <span className="badge badge-new">En atant</span>}
        </div>

        {/* Top-right: rating */}
        {m.rating && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,0.93)',
            color: '#0F172A', fontSize: '0.75rem', fontWeight: 900,
            padding: '4px 9px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <svg viewBox="0 0 24 24" fill="#F59E0B" width={11} height={11}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>{m.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom-left: type label on image */}
        <div style={{
          position: 'absolute', bottom: 9, left: 12,
          color: 'rgba(255,255,255,0.9)', fontSize: '0.72rem', fontWeight: 700,
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>
          {meta.label}
        </div>
      </div>

      {/* Body */}
      <div className="resto-body">
        <div className="resto-name">{m.name}</div>
        <div className="resto-meta">
          <span className="resto-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {timeRange} min
          </span>
          {m.address && (
            <span className="resto-meta-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {m.address.length > 22 ? m.address.slice(0, 22) + '…' : m.address}
            </span>
          )}
        </div>
        <div className="resto-delivery-info">
          <span className="delivery-free" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#FF6000', fontWeight: 700 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={13} height={13}>
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>Livrezon 150 HTG</span>
          </span>
          {m.zone && (
            <span style={{
              fontSize: '0.72rem', color: '#64748B', fontWeight: 700,
              background: '#F1F5F9', padding: '2px 8px', borderRadius: 6,
              border: '1px solid #E2E8F0',
            }}>
              {m.zone.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Filter chips (Pure SVGs, Zero Emojis) ────────────────────
import { showToast } from '../lib/toast'

const FILTERS = [
  { key: 'ALL',            label: 'Tout',          icon: <IconCatAll /> },
  { key: 'RESTAURANT',     label: 'Restwo',        icon: <IconCatRestaurant /> },
  { key: 'FAST_FOOD',      label: 'Fast Food',     icon: <IconCatFastFood /> },
  { key: 'SUPERMARKET',    label: 'Sipèmache',     icon: <IconCatSupermarket /> },
  { key: 'PHARMACY',       label: 'Famasi',        icon: <IconCatPharmacy /> },
  { key: 'CONSTRUCTION',   label: 'Materyo',       icon: <IconCatConstruction /> },
  { key: 'BEVERAGE_DEPOT', label: 'Dépôt Bwason',  icon: <IconCatBeverage /> },
]

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

  // ── State ──────────────────────────────────────────────────
  const [merchants, setMerchants]     = useState<Merchant[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterType, setFilterType]   = useState(initialFilter)
  const [sortBy, setSortBy]           = useState<'all' | 'open' | 'rating' | 'fast'>('all')
  const [error, setError]             = useState<string | null>(null)

  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [products, setProducts]       = useState<Product[]>([])
  const [prodLoading, setProdLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Tout')
  const [previewProduct, setPreviewProduct] = useState<{ product: Product; img: string } | null>(null)
  const [customBanner, setCustomBanner] = useState<any>(null)

  // Ref for scroll-to-list when hero CTA clicked
  const listRef = useRef<HTMLDivElement>(null)

  // ── Sync filter from Navbar Tier 3 ─────────────────────────
  useEffect(() => {
    setFilterType(initialFilter)
  }, [initialFilter])

  // ── Auto-select store from URL routing (/store/:id) ─────────
  useEffect(() => {
    if (!initialStoreId) {
      if (selectedMerchant) {
        setSelectedMerchant(null)
        setProducts([])
      }
      return
    }

    if (merchants.length > 0) {
      const found = merchants.find(m => m.id === initialStoreId)
      if (found) {
        setSelectedMerchant(found)
      } else {
        // Fetch specific merchant directly if not in initial list
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pftolmslhhceomknlqii.supabase.co'
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdG9sbXNsaGhjZW9ta25scWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzQxNjEsImV4cCI6MjA1NjgxMDE2MX0.g9JgG7-P_O1Q9nE-wX1N8t7mFf9I4K0xJ3r9Q1rE_3k'
        fetch(`${SUPABASE_URL}/rest/v1/merchants?id=eq.${initialStoreId}&select=*`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        })
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data) && data[0]) {
              setSelectedMerchant(data[0])
            }
          })
          .catch(() => {})
      }
    }
  }, [initialStoreId, merchants])

  // ── Load dynamic banner settings from Backend ──────────────
  useEffect(() => {
    const host = window.location.hostname || 'localhost'
    const resolveImg = (raw?: string) => {
      if (!raw) return undefined
      let clean = String(raw).trim()
      if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1)
      }
      return clean.replace(/https?:\/\/(localhost|127\.0\.0\.1):4000/g, `http://${host}:4000`)
    }

    fetch(`http://${host}:4000/api/v1/platform-settings/category/web_client`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const d = res.data
          setCustomBanner({
            slide1: {
              title: d.web_hero_title,
              sub: d.web_hero_subtitle,
              tag: d.web_hero_tag,
              img: resolveImg(d.web_hero_image),
              cta: d.web_hero_cta,
            },
            slide2: {
              title: d.web_hero_slide2_title,
              sub: d.web_hero_slide2_subtitle,
              tag: d.web_hero_slide2_tag,
              img: resolveImg(d.web_hero_slide2_image),
              cta: d.web_hero_slide2_cta,
            },
            slide3: {
              title: d.web_hero_slide3_title,
              sub: d.web_hero_slide3_subtitle,
              tag: d.web_hero_slide3_tag,
              img: resolveImg(d.web_hero_slide3_image),
              cta: d.web_hero_slide3_cta,
            },
          })
        }
      })
      .catch(() => {})
  }, [])

  // ── Load merchants from Supabase ───────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchMerchants()
      .then(data => {
        if (data.length === 0) {
          setError('Sipabase konekte men pa gen boutik aktif pou moman an. Kontakte admin pou ajoute boutik yo.')
        }
        setMerchants(data)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setError('Erè koneksyon avèk Supabase. Verifye koneksyon entènèt ou.')
        setLoading(false)
      })
  }, [])

  // ── Load products when merchant selected ──────────────────
  useEffect(() => {
    if (!selectedMerchant) return
    setProdLoading(true)
    setProducts([])
    setActiveCategory('Tout')
    fetchProducts(selectedMerchant.id)
      .then(data => {
        setProducts(data)
        setProdLoading(false)
      })
      .catch(() => setProdLoading(false))
  }, [selectedMerchant])

  // ── Filtering & Smart Sorting ─────────────────────────────
  const filtered = merchants
    .filter(m => {
      const matchSearch = !search
        || m.name.toLowerCase().includes(search.toLowerCase())
        || m.address?.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'ALL' || m.type?.toUpperCase() === filterType
      const matchOpen = sortBy === 'open' ? m.isOpen : true
      return matchSearch && matchType && matchOpen
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sortBy === 'fast') return (a.avgPrepTimeMinutes ?? 25) - (b.avgPrepTimeMinutes ?? 25)
      // default: open establishments prioritized
      if (a.isOpen && !b.isOpen) return -1
      if (!a.isOpen && b.isOpen) return 1
      return 0
    })

  // ── Featured merchants (top-rated open ones) ───────────────
  const featured = merchants
    .filter(m => m.isOpen && m.rating && m.rating >= 4.0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6)

  // ── Categories from products ───────────────────────────────
  const categories = selectedMerchant
    ? ['Tout', ...Array.from(new Set(products.map(p => p.category?.name ?? 'Lòt')))]
    : []

  const filteredProducts = activeCategory === 'Tout'
    ? products
    : products.filter(p => (p.category?.name ?? 'Lòt') === activeCategory)

  const getQty = useCallback((id: string) =>
    items.find(i => i.id === id)?.quantity ?? 0
  , [items])

  // ── MERCHANT DETAIL VIEW ───────────────────────────────────
  if (selectedMerchant) {
    const meta = getMeta(selectedMerchant.type)
    const prepMin = selectedMerchant.avgPrepTimeMinutes ?? 25
    const bannerImg = getMerchantBanner(selectedMerchant)
    const storeShareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/store/${selectedMerchant.id}`
      : `/store/${selectedMerchant.id}`

    const handleCopyStoreLink = () => {
      try {
        navigator.clipboard.writeText(storeShareUrl)
        showToast('Lyen meni boutik la kopye! Ou ka voye l bay zanmi w.', 'success')
      } catch {
        showToast('Pa ka kopye lyen an otomatikman', 'error')
      }
    }

    return (
      <div className="page" style={{ maxWidth: 1024 }}>
        {/* Navigation & Action Bar above Store */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          {/* Back button */}
          <button
            id="back-to-list"
            onClick={() => { setSelectedMerchant(null); setProducts([]); onSelectStore?.(null) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)',
              padding: '7px 14px', borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF6000'; (e.currentTarget as HTMLButtonElement).style.color = '#FF6000' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
          >
            <IconArrowLeft />
            <span>Retounen nan tout boutik yo</span>
          </button>

          {/* Share & Contact Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleCopyStoreLink}
              title="Kopye lyen meni an pou pataje"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.8125rem', color: '#0F172A',
                padding: '7px 12px', borderRadius: 10,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={15} height={15}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Pataje Lyen Boutik</span>
            </button>

            {selectedMerchant.phone && (
              <a
                href={`https://wa.me/${selectedMerchant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjou ${selectedMerchant.name}! Mwen sou sit Delivery Haïti ap gade meni nou.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: 'none', background: '#25D366', color: 'white', textDecoration: 'none',
                  fontWeight: 800, fontSize: '0.8125rem',
                  padding: '7px 14px', borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(37,211,102,0.3)',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}>
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.84-1.56 1.56-3.64 2.41-5.83 2.41-1.46 0-2.88-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.19-.31A8.204 8.204 0 0 1 3.79 11.9c0-4.55 3.69-8.23 8.26-8.23m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12 0 1.25.91 2.46 1.04 2.63.13.17 1.8 2.75 4.36 3.86.61.26 1.09.42 1.46.54.61.2 1.17.17 1.61.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z"/>
                </svg>
                <span>WhatsApp Boutik</span>
              </a>
            )}
          </div>
        </div>

        {/* ── Hero Header Card ── */}
        <div className="restaurant-header">
          {/* Cover image with gradient overlay */}
          <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
            <img
              src={bannerImg}
              alt={selectedMerchant.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80'
              }}
            />
            {/* Rich gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
            }} />
            {/* Name on cover (Talabat style) */}
            <div style={{
              position: 'absolute', bottom: 18, left: 24, right: 24,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900,
                  color: '#FFFFFF', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.15,
                  textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}>
                  {selectedMerchant.name}
                </h1>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.82)', fontWeight: 600, marginTop: 4 }}>
                  {meta.label}
                </div>
              </div>
              {/* Status badge on cover */}
              {selectedMerchant.isOpen
                ? <span className="badge badge-open" style={{ fontSize: '0.8125rem', padding: '5px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Louvri</span>
                : <span className="badge badge-closed" style={{ fontSize: '0.8125rem', padding: '5px 12px' }}>Fèmen</span>
              }
            </div>
          </div>

          {/* Info bar pills */}
          <div className="restaurant-info">
            <div className="restaurant-info-bar">
              {selectedMerchant.rating && (
                <span className="restaurant-info-pill">
                  <svg viewBox="0 0 24 24" fill="#F59E0B" width={13} height={13}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {selectedMerchant.rating.toFixed(1)} notation
                </span>
              )}
              <span className="restaurant-info-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {prepMin + 10}–{prepMin + 25} min
              </span>
              {selectedMerchant.address && (
                <span className="restaurant-info-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {selectedMerchant.address.length > 32 ? selectedMerchant.address.slice(0, 32) + '…' : selectedMerchant.address}
                </span>
              )}
              {selectedMerchant.phone && (
                <span className="restaurant-info-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {selectedMerchant.phone}
                </span>
              )}
              {selectedMerchant.zone && (
                <span className="restaurant-info-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  {selectedMerchant.zone.name}
                </span>
              )}
              {!selectedMerchant.isOpen && (
                <span className="restaurant-info-pill" style={{ background: '#FEF9C3', borderColor: '#FDE047', color: '#854D0E' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Fèmen kounye a
                </span>
              )}
            </div>

            {/* Delivery assurance strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
            }}>
              {[
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.2} width={14} height={14}><polyline points="20 6 9 17 4 12"/></svg>, label: 'Livrezon disponib' },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2.2} width={14} height={14}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: 'MonCash · Natcash · Cash' },
                { icon: <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2.2} width={14} height={14}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Kalite garantie' },
              ].map((item, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {item.icon}
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="menu-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Section label ── */}
        {!prodLoading && filteredProducts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.0625rem', color: 'var(--text-primary)', margin: 0, borderLeft: '3px solid #FF6000', paddingLeft: 10 }}>
              {activeCategory === 'Tout' ? 'Tout pwodwi' : activeCategory}
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {filteredProducts.length} atikèl
            </span>
          </div>
        )}

        {/* Products */}
        {prodLoading ? (
          <div className="menu-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #EFF2F5', background: 'white' }}>
                <div className="skeleton" style={{ height: 150 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 18, marginBottom: 8, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 6, marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF3EB', color: '#FF6000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={32} height={32}>
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
              {products.length === 0
                ? 'Boutik sa a pa gen pwodwi aktif pou moman an.'
                : 'Pa gen atikèl nan kategori sa a.'}
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredProducts.map(product => {
              const qty = getQty(product.id)
              const prodImg = getProductImage(product, selectedMerchant.type)
              return (
                <div key={product.id} className="menu-item-pro">
                  <div
                    className="menu-item-media"
                    onClick={() => setPreviewProduct({ product, img: prodImg })}
                    title="Klike pou wè detay ak foto pwodui an gwo"
                  >
                    <img
                      src={prodImg}
                      alt={product.name}
                      className="menu-item-img-pro"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
                      }}
                    />
                    <div className="menu-item-zoom-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={13} height={13}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                      <span>Agrandir</span>
                    </div>
                  </div>

                  <div className="menu-item-body-pro">
                    <div
                      className="menu-item-name-pro"
                      onClick={() => setPreviewProduct({ product, img: prodImg })}
                    >
                      {product.name}
                    </div>

                    {product.description && (
                      <div className="menu-item-desc-pro">{product.description}</div>
                    )}

                    {product.category?.name && (
                      <div className="menu-item-cat-tag">
                        {product.category.name}
                      </div>
                    )}

                    <div className="menu-item-footer-pro">
                      <span className="menu-item-price-pro">{formatHTG(product.price)}</span>
                      {qty === 0 ? (
                        <button
                          id={`add-${product.id}`}
                          className="add-btn-pro"
                          disabled={!selectedMerchant.isOpen}
                          onClick={() => addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            imageUrl: prodImg,
                            restaurantId: selectedMerchant.id,
                            restaurantName: selectedMerchant.name,
                          })}>
                          <IconPlus />Ajoute
                        </button>
                      ) : (
                        <div className="qty-control">
                          <button className="qty-btn minus" onClick={() => updateQty(product.id, qty - 1)}><IconMinus /></button>
                          <span className="qty-val">{qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(product.id, qty + 1)}><IconPlus /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Product Zoom Modal ── */}
        {previewProduct && (
          <div
            className="product-modal-backdrop"
            onClick={() => setPreviewProduct(null)}
          >
            <div
              className="product-modal-card"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="product-modal-close"
                onClick={() => setPreviewProduct(null)}
                aria-label="Fèmen"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={16} height={16}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>

              <div className="product-modal-image-wrap">
                <img
                  src={previewProduct.img}
                  alt={previewProduct.product.name}
                  className="product-modal-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
                  }}
                />
              </div>

              <div className="product-modal-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <h3 className="product-modal-title">{previewProduct.product.name}</h3>
                  <span className="product-modal-price">{formatHTG(previewProduct.product.price)}</span>
                </div>

                {previewProduct.product.category?.name && (
                  <span className="menu-item-cat-tag" style={{ marginTop: 6, display: 'inline-block' }}>
                    {previewProduct.product.category.name}
                  </span>
                )}

                <p className="product-modal-desc">
                  {previewProduct.product.description || 'Pwodui fre prepare avèk tout swen pa etablisman an nan Cap-Haïtien.'}
                </p>

                <div className="product-modal-action-bar">
                  {getQty(previewProduct.product.id) === 0 ? (
                    <button
                      className="product-modal-add-btn"
                      disabled={!selectedMerchant.isOpen}
                      onClick={() => {
                        addItem({
                          id: previewProduct.product.id,
                          name: previewProduct.product.name,
                          price: previewProduct.product.price,
                          imageUrl: previewProduct.img,
                          restaurantId: selectedMerchant.id,
                          restaurantName: selectedMerchant.name,
                        })
                      }}
                    >
                      <IconPlus />
                      <span>Ajoute nan Panye — {formatHTG(previewProduct.product.price)}</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748B' }}>Kantite nan panye :</span>
                      <div className="qty-control" style={{ transform: 'scale(1.1)' }}>
                        <button className="qty-btn minus" onClick={() => updateQty(previewProduct.product.id, getQty(previewProduct.product.id) - 1)}><IconMinus /></button>
                        <span className="qty-val">{getQty(previewProduct.product.id)}</span>
                        <button className="qty-btn" onClick={() => updateQty(previewProduct.product.id, getQty(previewProduct.product.id) + 1)}><IconPlus /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── HOME / CATALOGUE ─────────────────────────────────────────
  return (
    <div className="page page-home">
      {/* ── Hero Carousel ─────────────────────────────────── */}
      <HeroCarousel
        customSlide={customBanner}
        onFilterChange={(f) => {
          setFilterType(f)
          // Scroll to merchant list section smoothly
          setTimeout(() => {
            listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 80)
        }}
      />

      {/* ── Value Proposition Strip ───────────────────────── */}
      <div className="promo-strip">
        {VALUE_PROPS.map((b, i) => (
          <div key={i} className="promo-banner">
            <div className="promo-banner-icon-wrap">{b.icon}</div>
            <div className="promo-banner-content">
              <div className="promo-banner-title">{b.title}</div>
              <div className="promo-banner-desc">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Featured / Pi Popilè ───────────────────────────── */}
      {(loading || featured.length > 0) && (
        <div className="featured-section">
          <div className="section-header">
            <h2 className="section-title">Pi Popilè</h2>
            <span className="section-link">Wè Tout <IconChevronRight /></span>
          </div>
          <div className="featured-scroll">
            {loading
              ? <FeaturedSkeleton />
              : featured.map(m => (
                <FeaturedCard key={m.id} m={m} onClick={() => { setSelectedMerchant(m); onSelectStore?.(m.id) }} />
              ))
            }
          </div>
        </div>
      )}

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="search-bar" ref={listRef} id="merchants-section">
        <IconSearch />
        <input
          id="merchant-search"
          className="search-input"
          type="text"
          placeholder="Chèche yon boutik, restwo, manje..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 8px', color: 'var(--text-muted)' }}>
            ✕
          </button>
        )}
      </div>

      {/* ── Quick Smart Filters (DoorDash / UberEats style) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {[
          { key: 'all' as const,    label: 'Tout Etablisman' },
          { key: 'open' as const,   label: 'Ouvè Kounye a', isGreen: true },
          { key: 'rating' as const, label: 'Pi Bon Nòt ★' },
          { key: 'fast' as const,   label: 'Livrezon Rapid ⏱' },
        ].map(item => {
          const isActive = sortBy === item.key
          return (
            <button
              key={item.key}
              onClick={() => setSortBy(item.key)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                border: isActive ? '1.5px solid #FF6000' : '1px solid #E5E7EB',
                background: isActive ? '#FFF3EB' : '#FFFFFF',
                color: isActive ? '#FF6000' : '#4B5563',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {item.isGreen && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
              )}
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>


      {/* ── Error banner ──────────────────────────────────── */}
      {error && !loading && (
        <div className="alert-error" style={{ marginBottom: 20 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={18} height={18}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Grid header ───────────────────────────────────── */}
      <div className="section-header">
        <h2 className="section-title">
          {filterType === 'ALL' ? 'Boutik & Etablisman Disponib' : getMeta(filterType).label}
        </h2>
        {!loading && (
          <span className="section-link">{filtered.length} rezilta</span>
        )}
      </div>

      {/* ── Merchant Grid ─────────────────────────────────── */}
      {loading ? (
        <div className="resto-grid"><RestoSkeleton /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'var(--text-muted)',
          }}>
            <IconSearch />
          </div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>
            {error
              ? 'Koneksyon Supabase echwe — recharge paj la.'
              : 'Pa gen boutik ki koresponn ak rechèch ou.'}
          </p>
          {search && (
            <button
              className="btn-secondary"
              style={{ margin: '16px auto', display: 'block', width: 'auto', padding: '10px 24px' }}
              onClick={() => setSearch('')}>
              Efase rechèch la
            </button>
          )}
        </div>
      ) : (
        <div className="resto-grid">
          {filtered.map(m => (
            <MerchantCard
              key={m.id}
              m={m}
              onClick={() => { setSelectedMerchant(m); onSelectStore?.(m.id) }}
            />
          ))}
        </div>
      )}

      {/* ── How it works (Modern & Professional) ───────────── */}
      <div className="how-it-works">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,96,0,0.12)', color: '#FF6000',
            fontSize: '0.75rem', fontWeight: 800, padding: '4px 14px',
            borderRadius: 'var(--r-full)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Etap Senp
          </span>
          <h2 className="section-title" style={{ margin: 0 }}>
            Kijan Sèvis la Travay
          </h2>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={22} height={22}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FF6000', marginTop: 4 }}>01</div>
            <div className="how-step-title">Chwazi Meni Ou</div>
            <div className="how-step-desc">Eksplore pi bon restoran ak komès nan Cap-Haïtien</div>
          </div>
          <div className="how-step-arrow">→</div>
          <div className="how-step">
            <div className="how-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={22} height={22}>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FF6000', marginTop: 4 }}>02</div>
            <div className="how-step-title">Pase Kòmand</div>
            <div className="how-step-desc">Chwazi MonCash, Natcash, oswa peye nan livrezon</div>
          </div>
          <div className="how-step-arrow">→</div>
          <div className="how-step">
            <div className="how-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={22} height={22}>
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                <rect x="9" y="11" width="14" height="10" rx="2"/>
                <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              </svg>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FF6000', marginTop: 4 }}>03</div>
            <div className="how-step-title">Kousye an Wout</div>
            <div className="how-step-desc">Yon livrè dedye pran kòmand lan imedyatman</div>
          </div>
          <div className="how-step-arrow">→</div>
          <div className="how-step">
            <div className="how-step-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={22} height={22}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FF6000', marginTop: 4 }}>04</div>
            <div className="how-step-title">Resevwa Lakay Ou</div>
            <div className="how-step-desc">Resevwa lòd ou cho e fre devan pòt ou</div>
          </div>
        </div>
      </div>
    </div>
  )
}
