import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  requestDeviceLocation,
  resolveLocationFromCoordinates,
  resolveLocationFromZoneId,
  type LocationResolveResult,
} from '../lib/locationResolver'
import { getClientCoverage, type ServiceArea } from '../lib/coverage'

// ── SVG Icons ──────────────────────────────────────────────────
const IconTruck = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
    <rect x="9" y="11" width="14" height="10" rx="2"/>
    <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
  </svg>
)

const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconEye = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

export interface AuthPageProps {
  onGoHome?: () => void
  onGoMerchantRegister?: () => void
}

export default function AuthPage({ onGoHome, onGoMerchantRegister }: AuthPageProps) {
  const { login, register } = useAuth()

  const [tab, setTab]         = useState<'login' | 'register'>('login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Login fields
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPwd, setLoginPwd]     = useState('')

  // Register fields
  const [rFirst, setRFirst]     = useState('')
  const [rLast, setRLast]       = useState('')
  const [rPhone, setRPhone]     = useState('')
  const [rEmail, setREmail]     = useState('')
  const [rPwd, setRPwd]         = useState('')
  const [rPwd2, setRPwd2]       = useState('')
  const [rAddr, setRAddr]       = useState('')
  const [rLang, setRLang]       = useState('ht')
  const [terms, setTerms]       = useState(true)

  // Location during registration state
  const [allAreas, setAllAreas]                 = useState<ServiceArea[]>([])
  const [selectedDeptCode, setSelectedDeptCode] = useState('HTI-N')
  const [selectedZoneId, setSelectedZoneId]     = useState('')
  const [detectedLocation, setDetectedLocation] = useState<LocationResolveResult | null>(null)
  const [gpsLoading, setGpsLoading]             = useState(false)
  const [gpsNotice, setGpsNotice]               = useState<string | null>(null)

  useEffect(() => {
    getClientCoverage().then(({ areas }) => {
      setAllAreas(areas)
      // Pick first active delivery zone in Nord as default
      const defaultZone = areas.find(a => a.type === 'ZONE' && a.isActive)
      if (defaultZone) {
        setSelectedZoneId(defaultZone.id)
        resolveLocationFromZoneId(defaultZone.id).then(setDetectedLocation).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const handleDetectGPS = async () => {
    setGpsLoading(true)
    setGpsNotice(null)
    const result = await requestDeviceLocation()
    setGpsLoading(false)

    if (!result.ok || result.latitude === undefined || result.longitude === undefined) {
      setGpsNotice(result.error || 'Lokalizasyon GPS pa t posib. Tanpri chwazi zòn ou manyèlman.')
      return
    }

    // Resolve GPS coordinates to nearest coverage zone
    const resolved = await resolveLocationFromCoordinates(result.latitude, result.longitude)
    setDetectedLocation(resolved)
    if (resolved.area) {
      setSelectedZoneId(resolved.area.id)
      if (resolved.department) setSelectedDeptCode(resolved.department.code)
      if (!rAddr.trim()) setRAddr(`${resolved.area.name}, Cap-Haïtien`)
      setGpsNotice(null)
    }
  }

  const handleZoneSelect = async (zoneId: string) => {
    setSelectedZoneId(zoneId)
    const resolved = await resolveLocationFromZoneId(zoneId)
    setDetectedLocation(resolved)
    if (resolved.area && !rAddr.trim()) {
      setRAddr(`${resolved.area.name}, Cap-Haïtien`)
    }
  }

  const switchTab = (t: 'login' | 'register') => {
    setTab(t)
    setError(null)
    setSuccess(null)
  }

  const handleLogin = async () => {
    if (loginPhone.replace(/\D/g, '').length < 8) {
      setError('Mete yon nimewo telefòn valab (omwen 8 chif).')
      return
    }
    if (loginPwd.length < 6) {
      setError('Modpas la dwe gen omwen 6 karaktè.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await login(loginPhone, loginPwd)
    setLoading(false)
    if (!res.ok) setError(res.msg ?? 'Erè koneksyon.')
  }

  const handleQuickDemoLogin = () => {
    setLoginPhone('37000007')
    setLoginPwd('kliyan123')
  }

  const handleRegister = async () => {
    if (!rFirst || !rLast) {
      setError('Tanpri antre prenon ak non fanmi ou.')
      return
    }
    if (rPhone.replace(/\D/g, '').length < 8) {
      setError('Nimewo telefòn pa valab.')
      return
    }
    if (rPwd.length < 6) {
      setError('Modpas la dwe gen omwen 6 karaktè.')
      return
    }
    if (rPwd !== rPwd2) {
      setError('Modpas yo pa idantik.')
      return
    }
    if (!terms) {
      setError('Ou dwe aksepte kondisyon itilizasyon yo.')
      return
    }

    if (!selectedZoneId && !rAddr.trim()) {
      setError('Tanpri chwazi zòn livrezon ou oswa detekte pozisyon w.')
      return
    }

    setLoading(true)
    setError(null)
    const res = await register({
      firstName: rFirst,
      lastName: rLast,
      phoneNumber: rPhone,
      password: rPwd,
      email: rEmail || undefined,
      languagePreference: rLang,
      address: rAddr.trim() || (detectedLocation?.area ? `${detectedLocation.area.name}, Cap-Haïtien` : undefined),
      zoneId: selectedZoneId || undefined,
      latitude: detectedLocation?.latitude,
      longitude: detectedLocation?.longitude,
      departmentCode: selectedDeptCode,
    })
    setLoading(false)

    if (!res.ok) {
      setError(res.msg ?? 'Erè enskripyon.')
    } else {
      if (detectedLocation?.area?.name) {
        try {
          localStorage.setItem('dlh_zone', detectedLocation.area.name)
          window.dispatchEvent(new CustomEvent('dlh:zone-change', { detail: { zone: detectedLocation.area.name } }))
        } catch (_) {}
      }
      setSuccess(`Byenvini ${rFirst}! Kont ou kreye avèk siksè.`)
    }
  }

  return (
    <div className="auth-pro-page">
      <div className="auth-pro-container">
        <div className="auth-pro-grid">

          {/* ════ LEFT COLUMN: Brand & Trust Showcase ════ */}
          <div className="auth-pro-showcase">
            <div>
              {/* Back to Home Button */}
              {onGoHome && (
                <button
                  type="button"
                  onClick={onGoHome}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#E2E8F0',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 24,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                >
                  <IconArrowLeft />
                  <span>Retounen nan Akèy</span>
                </button>
              )}

              {/* Verified Badge */}
              <div className="auth-pro-showcase-badge">
                <span>🛵</span>
                <span>Platfòm Livrezon #1 nan Okap</span>
              </div>

              {/* Hero Title */}
              <h1 className="auth-pro-showcase-title">
                Konekte pou w kòmande tout sa w renmen pi vit
              </h1>

              <p className="auth-pro-showcase-desc">
                Chwazi nan pi bon restoran, sipèmache ak boutik nan Cap-Haïtien.
                Kourye verifye livre dirèk devan pòt ou an tan reyèl.
              </p>

              {/* 4 Feature Highlights */}
              <div className="auth-pro-features-grid">
                <div className="auth-pro-feat-card">
                  <div className="auth-pro-feat-icon">⚡</div>
                  <div className="auth-pro-feat-title">20–35 Minit</div>
                  <div className="auth-pro-feat-sub">Livrezon ekstrèmman rapid nan tout zòn kouvri.</div>
                </div>

                <div className="auth-pro-feat-card">
                  <div className="auth-pro-feat-icon">🛵</div>
                  <div className="auth-pro-feat-title">Kourye Verifye</div>
                  <div className="auth-pro-feat-sub">100% kourye fòme ak swivi GPS an dirèk.</div>
                </div>

                <div className="auth-pro-feat-card">
                  <div className="auth-pro-feat-icon">💰</div>
                  <div className="auth-pro-feat-title">MonCash & Kach</div>
                  <div className="auth-pro-feat-sub">Peye an sekirite ak MonCash oswa lè livrezon an rive.</div>
                </div>

                <div className="auth-pro-feat-card">
                  <div className="auth-pro-feat-icon">📍</div>
                  <div className="auth-pro-feat-title">Tout Okap Kouvri</div>
                  <div className="auth-pro-feat-sub">Sant Vil, Vil Wouj, Madanm Kolo, Bwavè & Haut du Cap.</div>
                </div>
              </div>

              {/* Social Proof Quote */}
              <div className="auth-pro-quote-card">
                <div style={{ fontSize: '1.75rem' }}>⭐️</div>
                <div>
                  <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '0.875rem' }}>
                    4.9 / 5 Zetwal • +15,000 Kòmand Livre
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: 2 }}>
                    Plis pase 8,500 kliyan satisfè nan Gran Nò peyi d Ayiti.
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant / Partner invitation */}
            {onGoMerchantRegister && (
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: 6 }}>
                  Ou se yon pwopriyetè restoran oswa yon komèsan?
                </div>
                <button
                  type="button"
                  onClick={onGoMerchantRegister}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FF8A00',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Enskri kòm Machann Patnè sou Delivery Haïti →</span>
                </button>
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN: Interactive Form ════ */}
          <div className="auth-pro-form-col">
            <div className="auth-pro-header">
              <div className="auth-pro-logo-badge">
                <div className="auth-pro-logo-icon">
                  <IconTruck />
                </div>
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#FF6000' }}>
                    Eksperyans Kliyan
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                    Delivery Haïti
                  </div>
                </div>
              </div>

              <h2 className="auth-pro-title">
                {tab === 'login' ? 'Bon Retou!' : 'Kreye Kont Kliyan'}
              </h2>
              <p className="auth-pro-subtitle">
                {tab === 'login'
                  ? 'Antre nimewo telefòn ou ak modpas ou pou jwenn aksè.'
                  : 'Ranpli ti fòmilè sa a pou w kòmanse kòmande manje ak machandiz.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="auth-pro-tabs">
              <button
                type="button"
                className={`auth-pro-tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => switchTab('login')}
              >
                <span>🔐</span>
                <span>Konekte</span>
              </button>
              <button
                type="button"
                className={`auth-pro-tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => switchTab('register')}
              >
                <span>👤</span>
                <span>Kreye yon Kont</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#16A34A',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                <IconCheck />
                <span>{success}</span>
              </div>
            )}

            {/* ─── TAB: LOGIN ─── */}
            {tab === 'login' && (
              <form onSubmit={e => { e.preventDefault(); handleLogin() }}>
                {/* Demo Quick Login Assist */}
                <div style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: '#FFF7ED',
                      border: '1px dashed #FDBA74',
                      color: '#C2410C',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFEDD5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#FFF7ED')}
                  >
                    <span>🔑</span>
                    <span>Ranpli rapid ak kont demonstrasyon (+509 3700-0007)</span>
                  </button>
                </div>

                <div style={{ marginBottom: 4 }}>
                  <label htmlFor="login-phone" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Nimewo Telefòn
                  </label>
                  <div className="auth-pro-input-wrap">
                    <div className="auth-pro-prefix">
                      <span style={{ fontSize: '1.1rem' }}>🇭🇹</span>
                      <span>+509</span>
                    </div>
                    <input
                      id="login-phone"
                      type="tel"
                      placeholder="37 XX XX XX"
                      value={loginPhone}
                      onChange={e => setLoginPhone(e.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label htmlFor="login-password" style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#334155' }}>
                      Modpas
                    </label>
                    <a
                      href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Haiti,%20mw%20bliye%20modpas%20kont%20mwen"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#FF6000', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Bliye modpas?
                    </a>
                  </div>

                  <div className="auth-pro-input-wrap">
                    <div style={{ paddingLeft: 14, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                      <IconLock />
                    </div>
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPwd}
                      onChange={e => setLoginPwd(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(p => !p)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0 14px',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={showPwd ? 'Kache modpas' : 'Montre modpas'}
                    >
                      <IconEye off={showPwd} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-pro-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#FFFFFF' }} />
                      <span>Ap konekte...</span>
                    </span>
                  ) : (
                    <span>Konekte sou Kont Mwen →</span>
                  )}
                </button>
              </form>
            )}

            {/* ─── TAB: REGISTER ─── */}
            {tab === 'register' && (
              <form onSubmit={e => { e.preventDefault(); handleRegister() }}>
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label htmlFor="reg-first" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                      Prenon *
                    </label>
                    <div className="auth-pro-input-wrap">
                      <div style={{ paddingLeft: 12, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                        <IconUser />
                      </div>
                      <input
                        id="reg-first"
                        type="text"
                        placeholder="Jean"
                        value={rFirst}
                        onChange={e => setRFirst(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-last" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                      Non Fanmi *
                    </label>
                    <div className="auth-pro-input-wrap">
                      <div style={{ paddingLeft: 12, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                        <IconUser />
                      </div>
                      <input
                        id="reg-last"
                        type="text"
                        placeholder="Baptiste"
                        value={rLast}
                        onChange={e => setRLast(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="reg-phone" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Nimewo Telefòn *
                  </label>
                  <div className="auth-pro-input-wrap">
                    <div className="auth-pro-prefix">
                      <span style={{ fontSize: '1rem' }}>🇭🇹</span>
                      <span>+509</span>
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      placeholder="37 XX XX XX"
                      value={rPhone}
                      onChange={e => setRPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                    Email (Opsyonèl)
                  </label>
                  <div className="auth-pro-input-wrap">
                    <div style={{ paddingLeft: 12, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                      <IconMail />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="oumenm@gmail.com"
                      value={rEmail}
                      onChange={e => setREmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label htmlFor="reg-pwd" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                      Modpas * (6+ karaktè)
                    </label>
                    <div className="auth-pro-input-wrap">
                      <div style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                        <IconLock />
                      </div>
                      <input
                        id="reg-pwd"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={rPwd}
                        onChange={e => setRPwd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-pwd2" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                      Konfime Modpas *
                    </label>
                    <div className="auth-pro-input-wrap">
                      <div style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                        <IconLock />
                      </div>
                      <input
                        id="reg-pwd2"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={rPwd2}
                        onChange={e => setRPwd2(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Coverage Section */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                      <span style={{ color: '#FF6000' }}>📍</span>
                      <span>Lokalizasyon & Zòn Livrezon</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                      style={{
                        background: '#FFF7ED',
                        border: '1px solid #FF8A00',
                        color: '#EA580C',
                        padding: '4px 9px',
                        borderRadius: 8,
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{gpsLoading ? '📡 Ap detekte...' : '⚡ Detekte ak GPS'}</span>
                    </button>
                  </div>

                  {gpsNotice && (
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: '#B45309',
                        background: '#FFFBEB',
                        padding: '6px 10px',
                        borderRadius: 8,
                        marginBottom: 8,
                        border: '1px solid #FDE68A',
                        lineHeight: 1.4,
                      }}
                    >
                      {gpsNotice}
                    </div>
                  )}

                  {/* Department & Zone Selectors */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label htmlFor="reg-dept" style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, marginBottom: 4 }}>
                        Depatman
                      </label>
                      <select
                        id="reg-dept"
                        value={selectedDeptCode}
                        onChange={e => setSelectedDeptCode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: 8,
                          border: '1.5px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#0F172A',
                          outline: 'none',
                        }}
                      >
                        <option value="HTI-N">Nord (Nò) — Aktif</option>
                        <option value="HTI-O" disabled>Ouest (Lwès) — Bento</option>
                        <option value="HTI-S" disabled>Sud (Sid) — Bento</option>
                        <option value="HTI-A" disabled>Artibonite — Bento</option>
                        <option value="HTI-C" disabled>Centre — Bento</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="reg-zone" style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', fontWeight: 700, marginBottom: 4 }}>
                        Zòn Sèvis (Okap)
                      </label>
                      <select
                        id="reg-zone"
                        value={selectedZoneId}
                        onChange={e => handleZoneSelect(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: 8,
                          border: '1.5px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#0F172A',
                          outline: 'none',
                        }}
                      >
                        {allAreas.filter(a => a.type === 'ZONE').map(z => (
                          <option key={z.id} value={z.id}>
                            {z.name} {!z.isActive ? '(Dezaktive)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Real-time Coverage Feedback Pill */}
                  {detectedLocation && (
                    <div
                      style={{
                        padding: '7px 10px',
                        borderRadius: 8,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: detectedLocation.isAvailable ? '#ECFDF5' : '#FEF2F2',
                        color: detectedLocation.isAvailable ? '#065F46' : '#991B1B',
                        border: `1px solid ${detectedLocation.isAvailable ? '#A7F3D0' : '#FECACA'}`,
                      }}
                    >
                      <span>{detectedLocation.isAvailable ? '✅' : '⚠️'}</span>
                      <span>{detectedLocation.statusMessage}</span>
                    </div>
                  )}

                  {/* Street Address / Landmark */}
                  <div className="auth-pro-input-wrap" style={{ marginBottom: 0 }}>
                    <div style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                      <IconMapPin />
                    </div>
                    <input
                      id="reg-addr"
                      type="text"
                      placeholder="Lari, nimewo oswa repè (eg: Boulevard, Rue 18 L)"
                      value={rAddr}
                      onChange={e => setRAddr(e.target.value)}
                      style={{ height: 38, fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                {/* Language Preference */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Preferans Lang
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setRLang('ht')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: 10,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: rLang === 'ht' ? '2px solid #FF6000' : '1.5px solid #CBD5E1',
                        background: rLang === 'ht' ? '#FFF7ED' : '#FFFFFF',
                        color: rLang === 'ht' ? '#C2410C' : '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 900 }}>🇭🇹</span>
                      <span>Kreyòl Ayisyen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRLang('fr')}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: 10,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: rLang === 'fr' ? '2px solid #FF6000' : '1.5px solid #CBD5E1',
                        background: rLang === 'fr' ? '#FFF7ED' : '#FFFFFF',
                        color: rLang === 'fr' ? '#C2410C' : '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 900 }}>🇫🇷</span>
                      <span>Français</span>
                    </button>
                  </div>
                </div>

                {/* Terms and conditions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '12px 0 16px' }}>
                  <input
                    id="reg-terms"
                    type="checkbox"
                    checked={terms}
                    onChange={e => setTerms(e.target.checked)}
                    style={{ marginTop: 2, accentColor: '#FF6000', cursor: 'pointer' }}
                  />
                  <label htmlFor="reg-terms" style={{ fontSize: '0.6875rem', color: '#64748B', lineHeight: 1.4, cursor: 'pointer' }}>
                    Mwen aksepte kondisyon sèvis ak règleman konfidansyalite Delivery Haïti.
                  </label>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  className="auth-pro-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#FFFFFF' }} />
                      <span>Ap kreye kont ou...</span>
                    </span>
                  ) : (
                    <span>Kreye Kont Mwen & Kòmanse →</span>
                  )}
                </button>
              </form>
            )}

            {/* Direct WhatsApp Support Pill */}
            <a
              href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Haiti,%20mw%20bezwen%20yon%20ti%20èd%20pou%20konekte"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-pro-support-pill"
            >
              <span>💬</span>
              <span>Bezwen èd rapid? Ekri nou sou WhatsApp (+509 4055-3636)</span>
            </a>

            {/* Bottom Security / Trust indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 14,
                fontSize: '0.6875rem',
                color: '#94A3B8',
                fontWeight: 600,
              }}
            >
              <span>🔒</span>
              <span>Done w yo an sekirite • Chifreman 256-bit SSL</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
