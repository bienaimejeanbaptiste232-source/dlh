import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  requestDeviceLocation,
  resolveLocationFromCoordinates,
  resolveLocationFromZoneId,
  type LocationResolveResult,
} from '../lib/locationResolver'
import { getClientCoverage, type ServiceArea } from '../lib/coverage'

// ── Icons ────────────────────────────────────────────────────────
const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

  // Login state
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPwd, setLoginPwd]     = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // Register state
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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
    if (!res.ok) setError(res.msg ?? 'Erè koneksyon. Verifye nimewo w ak modpas ou.')
  }

  const handleQuickDemoLogin = () => {
    setLoginPhone('37000007')
    setLoginPwd('kliyan123')
  }

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
    <div className="auth-ref-page">
      <div className="auth-ref-container">
        <div className="auth-ref-card">

          {/* ════ LEFT BRAND PANEL: Official Logo & Verified Delivery Haïti ════ */}
          <div className="auth-ref-left">
            <div className="auth-ref-left-content">
              {/* Return to Home link */}
              {onGoHome && (
                <button
                  type="button"
                  onClick={onGoHome}
                  className="auth-ref-back-link"
                >
                  <IconArrowLeft />
                  <span>Retounen nan Akèy</span>
                </button>
              )}

              {/* Official Brand Logo & Header */}
              <div className="auth-brand-badge">
                <div className="auth-brand-logo-box">
                  <img
                    src="/logo.png"
                    alt="Delivery Lakay"
                    className="auth-brand-logo-img"
                  />
                </div>
                <div>
                  <span className="auth-brand-meta-tag">🛵 Sèvis Ofisyèl Livrezon</span>
                  <div className="auth-brand-meta-name">Delivery Lakay</div>
                </div>
              </div>

              {/* Value proposition */}
              <h1 className="auth-ref-welcome">Byenvini!</h1>
              <div className="auth-ref-headline">KÒMANDE NAN TOUT OKAP & NÒ D AYITI</div>
              <p className="auth-ref-desc">
                Platfòm livrezon #1 nan Cap-Haïtien. Kòmande manje, pwovizyon ak machandiz nan pi bon etablisman yo avèk kourye verifye.
              </p>

              {/* Verified Value Props (Frosted Glassmorphism Tiles) */}
              <div className="auth-ref-features">
                <div className="auth-ref-feature-pill">
                  <span className="auth-ref-feat-icon">⚡</span>
                  <div>
                    <div className="auth-ref-feat-title">20–35 Minit</div>
                    <div className="auth-ref-feat-desc">Livrezon ekstrèmman rapid devan pòt ou.</div>
                  </div>
                </div>

                <div className="auth-ref-feature-pill">
                  <span className="auth-ref-feat-icon">🛵</span>
                  <div>
                    <div className="auth-ref-feat-title">Kourye Verifye</div>
                    <div className="auth-ref-feat-desc">100% kourye idantifye ak swivi GPS an tan reyèl.</div>
                  </div>
                </div>

                <div className="auth-ref-feature-pill">
                  <span className="auth-ref-feat-icon">💰</span>
                  <div>
                    <div className="auth-ref-feat-title">MonCash & Kach</div>
                    <div className="auth-ref-feat-desc">Peye fasilman lè kourye a delivre kòmand ou a.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant sign-up CTA at bottom */}
            {onGoMerchantRegister && (
              <div className="auth-ref-merchant-cta">
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 4 }}>
                  Ou se yon restoran oswa boutik?
                </div>
                <button
                  type="button"
                  onClick={onGoMerchantRegister}
                  className="auth-ref-merchant-btn"
                >
                  <span>Enskri kòm Machann Patnè sou Delivery Lakay →</span>
                </button>
              </div>
            )}
          </div>

          {/* ════ RIGHT FORM PANEL: Pure Frosted White Card ════ */}
          <div className="auth-ref-right">

            {/* Title & Subtitle */}
            <h2 className="auth-ref-title">
              {tab === 'login' ? 'Sign in' : 'Sign up'}
            </h2>
            <p className="auth-ref-subtitle">
              {tab === 'login'
                ? 'Konekte sou kont ou pou kòmande pi vit.'
                : 'Kreye yon kont pou w kòmanse kòmande nan Nò d Ayiti.'}
            </p>

            {/* Error Alert */}
            {error && (
              <div className="auth-ref-alert-error">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="auth-ref-alert-success">
                <IconCheck />
                <span>{success}</span>
              </div>
            )}

            {/* ════ VIEW: SIGN IN ════ */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                {/* Field 1: User / Phone Input */}
                <div className="auth-ref-input-box">
                  <span className="auth-ref-input-icon">
                    <IconUser />
                  </span>
                  <input
                    type="tel"
                    className="auth-ref-input"
                    placeholder="User Name / Nimewo telefòn"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>

                {/* Field 2: Password Input with SHOW Toggle */}
                <div className="auth-ref-input-box">
                  <span className="auth-ref-input-icon">
                    <IconLock />
                  </span>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="auth-ref-input"
                    placeholder="Password / Modpas"
                    value={loginPwd}
                    onChange={e => setLoginPwd(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-ref-show-btn"
                    onClick={() => setShowPwd(p => !p)}
                  >
                    {showPwd ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {/* Row: Remember me checkbox + Forgot Password? */}
                <div className="auth-ref-row">
                  <label className="auth-ref-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <a
                    href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mw%20bliye%20modpas%20kont%20mwen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth-ref-forgot"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Primary Button: Delivery Lakay Brand Orange */}
                <button
                  type="submit"
                  className="auth-ref-primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Ap konekte...' : 'Sign in'}
                </button>

                {/* Divider: "or" */}
                <div className="auth-ref-divider">
                  <span>or</span>
                </div>

                {/* Secondary Button: Demo quick test */}
                <button
                  type="button"
                  className="auth-ref-secondary-btn"
                  onClick={handleQuickDemoLogin}
                >
                  Sign in with demo (+509 3700-0007)
                </button>

                {/* Footer Switcher */}
                <div className="auth-ref-footer">
                  <span>Don't have an account?</span>
                  <span
                    className="auth-ref-switch-link"
                    onClick={() => switchTab('register')}
                  >
                    Sign up
                  </span>
                </div>
              </form>
            )}

            {/* ════ VIEW: SIGN UP (Registration with Haiti Coverage) ════ */}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                {/* Names */}
                <div className="auth-ref-grid-2">
                  <div>
                    <label className="auth-ref-label">Prenon *</label>
                    <div className="auth-ref-input-box" style={{ height: 44, marginBottom: 10 }}>
                      <span className="auth-ref-input-icon"><IconUser /></span>
                      <input
                        type="text"
                        className="auth-ref-input"
                        placeholder="Jean"
                        value={rFirst}
                        onChange={e => setRFirst(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="auth-ref-label">Non Fanmi *</label>
                    <div className="auth-ref-input-box" style={{ height: 44, marginBottom: 10 }}>
                      <span className="auth-ref-input-icon"><IconUser /></span>
                      <input
                        type="text"
                        className="auth-ref-input"
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
                  <label className="auth-ref-label">Nimewo Telefòn *</label>
                  <div className="auth-ref-input-box" style={{ height: 44, marginBottom: 10 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#FF6000', marginRight: 8 }}>+509</span>
                    <input
                      type="tel"
                      className="auth-ref-input"
                      placeholder="37 XX XX XX"
                      value={rPhone}
                      onChange={e => setRPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="auth-ref-label">Email (Opsyonèl)</label>
                  <div className="auth-ref-input-box" style={{ height: 44, marginBottom: 10 }}>
                    <span className="auth-ref-input-icon"><IconMail /></span>
                    <input
                      type="email"
                      className="auth-ref-input"
                      placeholder="kliyan@gmail.com"
                      value={rEmail}
                      onChange={e => setREmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="auth-ref-grid-2">
                  <div>
                    <label className="auth-ref-label">Modpas *</label>
                    <div className="auth-ref-input-box" style={{ height: 44, marginBottom: 10 }}>
                      <span className="auth-ref-input-icon"><IconLock /></span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className="auth-ref-input"
                        placeholder="••••••"
                        value={rPwd}
                        onChange={e => setRPwd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="auth-ref-label">Konfime *</label>
                    <div className="auth-ref-input-box" style={{ height: 44, marginBottom: 10 }}>
                      <span className="auth-ref-input-icon"><IconLock /></span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className="auth-ref-input"
                        placeholder="••••••"
                        value={rPwd2}
                        onChange={e => setRPwd2(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Coverage Selector */}
                <div className="auth-ref-loc-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                      <span style={{ color: '#FF6000' }}>📍</span>
                      <span>Lokalizasyon & Zòn Livrezon</span>
                    </div>

                    <button
                      type="button"
                      className="auth-ref-gps-btn"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? '📡 Ap detekte...' : '⚡ Detekte ak GPS'}
                    </button>
                  </div>

                  {gpsNotice && (
                    <div style={{ fontSize: '0.6875rem', color: '#B45309', background: '#FEF3C7', padding: '6px 8px', borderRadius: 6, marginBottom: 8 }}>
                      {gpsNotice}
                    </div>
                  )}

                  {/* Department & Zone Dropdowns */}
                  <div className="auth-ref-grid-2" style={{ marginBottom: 8 }}>
                    <div>
                      <label className="auth-ref-label">Depatman</label>
                      <select
                        className="auth-ref-select"
                        value={selectedDeptCode}
                        onChange={e => setSelectedDeptCode(e.target.value)}
                      >
                        <option value="HTI-N">Nord (Nò) — Aktif</option>
                        <option value="HTI-O" disabled>Ouest (Lwès) — Bento</option>
                        <option value="HTI-S" disabled>Sud (Sid) — Bento</option>
                        <option value="HTI-A" disabled>Artibonite — Bento</option>
                        <option value="HTI-C" disabled>Centre — Bento</option>
                      </select>
                    </div>

                    <div>
                      <label className="auth-ref-label">Zòn Sèvis (Okap)</label>
                      <select
                        className="auth-ref-select"
                        value={selectedZoneId}
                        onChange={e => handleZoneSelect(e.target.value)}
                      >
                        {allAreas.filter(a => a.type === 'ZONE').map(z => (
                          <option key={z.id} value={z.id}>
                            {z.name} {!z.isActive ? '(Dezaktive)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Coverage Feedback Badge */}
                  {detectedLocation && (
                    <div className={detectedLocation.isAvailable ? 'auth-ref-badge-available' : 'auth-ref-badge-unavailable'}>
                      <span>{detectedLocation.isAvailable ? '✅' : '⚠️'}</span>
                      <span>{detectedLocation.statusMessage}</span>
                    </div>
                  )}

                  {/* Street address */}
                  <div className="auth-ref-input-box" style={{ height: 40, marginBottom: 0, background: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                    <span className="auth-ref-input-icon"><IconMapPin /></span>
                    <input
                      type="text"
                      className="auth-ref-input"
                      placeholder="Lari, nimewo oswa repè (eg: Rue 18 L)"
                      value={rAddr}
                      onChange={e => setRAddr(e.target.value)}
                    />
                  </div>
                </div>

                {/* Terms */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px 0' }}>
                  <input
                    type="checkbox"
                    id="ref-terms"
                    checked={terms}
                    onChange={e => setTerms(e.target.checked)}
                    style={{ accentColor: '#FF6000', cursor: 'pointer' }}
                  />
                  <label htmlFor="ref-terms" style={{ fontSize: '0.6875rem', color: '#64748B', cursor: 'pointer' }}>
                    Mwen aksepte kondisyon sèvis ak règleman Delivery Lakay.
                  </label>
                </div>

                {/* Primary Register Button */}
                <button
                  type="submit"
                  className="auth-ref-primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Ap kreye kont...' : 'Sign up & Kòmanse'}
                </button>

                {/* Footer Switcher */}
                <div className="auth-ref-footer">
                  <span>Ou gen yon kont deja?</span>
                  <span
                    className="auth-ref-switch-link"
                    onClick={() => switchTab('login')}
                  >
                    Sign in
                  </span>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
