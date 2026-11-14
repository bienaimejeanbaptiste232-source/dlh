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
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const IconAlert = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
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

  const [loginPhone, setLoginPhone] = useState('')
  const [loginPwd, setLoginPwd]     = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const [rFirst, setRFirst] = useState('')
  const [rLast, setRLast]   = useState('')
  const [rPhone, setRPhone] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPwd, setRPwd]     = useState('')
  const [rPwd2, setRPwd2]   = useState('')
  const [rAddr, setRAddr]   = useState('')
  const [rLang, setRLang]   = useState('ht')
  const [terms, setTerms]   = useState(true)

  const [allAreas, setAllAreas]                 = useState<ServiceArea[]>([])
  const [selectedDeptCode, setSelectedDeptCode] = useState('HTI-N')
  const [selectedZoneId, setSelectedZoneId]     = useState('')
  const [detectedLocation, setDetectedLocation] = useState<LocationResolveResult | null>(null)
  const [gpsLoading, setGpsLoading]             = useState(false)
  const [gpsNotice, setGpsNotice]               = useState<string | null>(null)

  useEffect(() => {
    getClientCoverage().then(({ areas }) => {
      setAllAreas(areas)
      const def = areas.find(a => a.type === 'ZONE' && a.isActive)
      if (def) {
        setSelectedZoneId(def.id)
        resolveLocationFromZoneId(def.id).then(setDetectedLocation).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const handleDetectGPS = async () => {
    setGpsLoading(true); setGpsNotice(null)
    const result = await requestDeviceLocation()
    setGpsLoading(false)
    if (!result.ok || result.latitude === undefined || result.longitude === undefined) {
      setGpsNotice(result.error || 'GPS pa disponib. Chwazi zòn ou manyèlman.')
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
    if (resolved.area && !rAddr.trim()) setRAddr(`${resolved.area.name}, Cap-Haïtien`)
  }

  const switchTab = (t: 'login' | 'register') => { setTab(t); setError(null); setSuccess(null) }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (loginPhone.replace(/\D/g, '').length < 8) { setError('Nimewo telefòn pa valab.'); return }
    if (loginPwd.length < 6) { setError('Modpas la dwe gen omwen 6 karaktè.'); return }
    setLoading(true); setError(null)
    const res = await login(loginPhone, loginPwd)
    setLoading(false)
    if (!res.ok) setError(res.msg ?? 'Nimewo oswa modpas pa kòrèk.')
  }

  const handleQuickDemo = () => { setLoginPhone('37000007'); setLoginPwd('kliyan123') }

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!rFirst || !rLast) { setError('Prenon ak non fanmi yo obligatwa.'); return }
    if (rPhone.replace(/\D/g, '').length < 8) { setError('Nimewo telefòn pa valab.'); return }
    if (rPwd.length < 6) { setError('Modpas la dwe gen omwen 6 karaktè.'); return }
    if (rPwd !== rPwd2) { setError('Modpas yo pa menm.'); return }
    if (!terms) { setError('Ou dwe aksepte kondisyon yo.'); return }
    if (!selectedZoneId && !rAddr.trim()) { setError('Chwazi zòn livrezon ou tanpri.'); return }

    setLoading(true); setError(null)
    const res = await register({
      firstName: rFirst, lastName: rLast, phoneNumber: rPhone, password: rPwd,
      email: rEmail || undefined, languagePreference: rLang,
      address: rAddr.trim() || (detectedLocation?.area ? `${detectedLocation.area.name}, Cap-Haïtien` : undefined),
      zoneId: selectedZoneId || undefined,
      latitude: detectedLocation?.latitude, longitude: detectedLocation?.longitude,
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

  // ─── Shared input style object ─────────────────────────────────
  const inputSm: React.CSSProperties = { height: 42, marginBottom: 10 }

  return (
    <div className="auth-ref-page">
      <div className="auth-ref-container">

        {/* ── Back to home (above card) ── */}
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="auth-ref-back-link"
            style={{ marginBottom: 12 }}
          >
            <IconArrowLeft />
            <span>Retounen nan Akèy</span>
          </button>
        )}

        <div className="auth-ref-card">

          {/* ── Brand Header ── */}
          <div className="auth-brand-header">
            <div className="auth-brand-logo-box">
              <img src="/logo.png" alt="Delivery Lakay" className="auth-brand-logo-img" />
            </div>
            <div>
              <div className="auth-brand-name">Delivery Lakay</div>
              <div className="auth-brand-tagline">Livrezon · Cap-Haïtien · Gran Nò</div>
            </div>
          </div>

          {/* ── Page Title ── */}
          <h1 className="auth-ref-title">
            {tab === 'login' ? 'Konekte' : 'Kreye kont'}
          </h1>
          <p className="auth-ref-subtitle">
            {tab === 'login'
              ? 'Mete nimewo telefòn ou ak modpas pou jwenn aksè.'
              : 'Ranpli fòmilè sa a pou kòmanse kòmande.'}
          </p>

          {/* ── Alerts ── */}
          {error && (
            <div className="auth-ref-alert-error">
              <IconAlert /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="auth-ref-alert-success">
              <IconCheck /><span>{success}</span>
            </div>
          )}

          {/* ═══ LOGIN FORM ═══ */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>

              {/* Phone */}
              <label className="auth-ref-label" htmlFor="login-phone">Nimewo telefòn</label>
              <div className="auth-ref-input-box">
                <span className="auth-ref-input-icon"><IconUser /></span>
                <input
                  id="login-phone"
                  type="tel"
                  className="auth-ref-input"
                  placeholder="37 XX XX XX"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>

              {/* Password */}
              <label className="auth-ref-label" htmlFor="login-pwd">Modpas</label>
              <div className="auth-ref-input-box">
                <span className="auth-ref-input-icon"><IconLock /></span>
                <input
                  id="login-pwd"
                  type={showPwd ? 'text' : 'password'}
                  className="auth-ref-input"
                  placeholder="Modpas ou"
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
                  {showPwd ? 'Kache' : 'Montre'}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="auth-ref-row">
                <label className="auth-ref-remember">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  <span>Sonje mwen</span>
                </label>
                <a
                  href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mw%20bliye%20modpas%20kont%20mwen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-ref-forgot"
                >
                  Bliye modpas?
                </a>
              </div>

              {/* Submit */}
              <button type="submit" className="auth-ref-primary-btn" disabled={loading}>
                {loading ? 'Ap konekte…' : 'Konekte'}
              </button>

              {/* Demo */}
              <div className="auth-ref-divider"><span>oswa</span></div>
              <button type="button" className="auth-ref-secondary-btn" onClick={handleQuickDemo}>
                Itilize kont demo (+509 3700-0007)
              </button>

              {/* Switch */}
              <div className="auth-ref-footer">
                Ou poko gen kont?
                <span className="auth-ref-switch-link" onClick={() => switchTab('register')}>
                  Kreye kont
                </span>
              </div>
            </form>
          )}

          {/* ═══ REGISTER FORM ═══ */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>

              {/* Names */}
              <div className="auth-ref-grid-2">
                <div>
                  <label className="auth-ref-label" htmlFor="r-first">Prenon *</label>
                  <div className="auth-ref-input-box" style={inputSm}>
                    <span className="auth-ref-input-icon"><IconUser /></span>
                    <input id="r-first" type="text" className="auth-ref-input" placeholder="Jean"
                      value={rFirst} onChange={e => setRFirst(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="auth-ref-label" htmlFor="r-last">Non Fanmi *</label>
                  <div className="auth-ref-input-box" style={inputSm}>
                    <span className="auth-ref-input-icon"><IconUser /></span>
                    <input id="r-last" type="text" className="auth-ref-input" placeholder="Baptiste"
                      value={rLast} onChange={e => setRLast(e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <label className="auth-ref-label" htmlFor="r-phone">Telefòn *</label>
              <div className="auth-ref-input-box" style={inputSm}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FF6000', marginRight: 8 }}>+509</span>
                <input id="r-phone" type="tel" className="auth-ref-input" placeholder="37 XX XX XX"
                  value={rPhone} onChange={e => setRPhone(e.target.value)} required />
              </div>

              {/* Email */}
              <label className="auth-ref-label" htmlFor="r-email">Email <span style={{ color: '#AAA', fontWeight: 400 }}>(opsyonèl)</span></label>
              <div className="auth-ref-input-box" style={inputSm}>
                <span className="auth-ref-input-icon"><IconMail /></span>
                <input id="r-email" type="email" className="auth-ref-input" placeholder="kliyan@gmail.com"
                  value={rEmail} onChange={e => setREmail(e.target.value)} />
              </div>

              {/* Passwords */}
              <div className="auth-ref-grid-2">
                <div>
                  <label className="auth-ref-label" htmlFor="r-pwd">Modpas *</label>
                  <div className="auth-ref-input-box" style={inputSm}>
                    <span className="auth-ref-input-icon"><IconLock /></span>
                    <input id="r-pwd" type={showPwd ? 'text' : 'password'} className="auth-ref-input"
                      placeholder="6+ karaktè" value={rPwd} onChange={e => setRPwd(e.target.value)} required />
                    <button type="button" className="auth-ref-show-btn" onClick={() => setShowPwd(p => !p)}>
                      {showPwd ? 'Kache' : 'Wè'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="auth-ref-label" htmlFor="r-pwd2">Konfime *</label>
                  <div className="auth-ref-input-box" style={inputSm}>
                    <span className="auth-ref-input-icon"><IconLock /></span>
                    <input id="r-pwd2" type={showPwd ? 'text' : 'password'} className="auth-ref-input"
                      placeholder="Retype" value={rPwd2} onChange={e => setRPwd2(e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="auth-ref-loc-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#333', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: '#FF6000' }}>📍</span> Zòn livrezon
                  </span>
                  <button type="button" className="auth-ref-gps-btn" onClick={handleDetectGPS} disabled={gpsLoading}>
                    {gpsLoading ? '📡 Ap detekte…' : '⚡ Detekte GPS'}
                  </button>
                </div>

                {gpsNotice && (
                  <div style={{ fontSize: '0.6875rem', color: '#B45309', background: '#FFFBEB', padding: '6px 8px', borderRadius: 6, marginBottom: 8, border: '1px solid #FDE68A' }}>
                    {gpsNotice}
                  </div>
                )}

                <div className="auth-ref-grid-2" style={{ marginBottom: 8 }}>
                  <div>
                    <label className="auth-ref-label">Depatman</label>
                    <select className="auth-ref-select" value={selectedDeptCode} onChange={e => setSelectedDeptCode(e.target.value)}>
                      <option value="HTI-N">Nord — Aktif</option>
                      <option value="HTI-O" disabled>Ouest — Byento</option>
                      <option value="HTI-S" disabled>Sud — Byento</option>
                      <option value="HTI-A" disabled>Artibonite — Byento</option>
                    </select>
                  </div>
                  <div>
                    <label className="auth-ref-label">Zòn (Okap)</label>
                    <select className="auth-ref-select" value={selectedZoneId} onChange={e => handleZoneSelect(e.target.value)}>
                      {allAreas.filter(a => a.type === 'ZONE').map(z => (
                        <option key={z.id} value={z.id}>{z.name}{!z.isActive ? ' ⚠' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {detectedLocation && (
                  <div className={detectedLocation.isAvailable ? 'auth-ref-badge-available' : 'auth-ref-badge-unavailable'}>
                    <span>{detectedLocation.isAvailable ? '✓' : '⚠'}</span>
                    <span>{detectedLocation.statusMessage}</span>
                  </div>
                )}

                <div className="auth-ref-input-box" style={{ height: 40, marginBottom: 0, background: '#fff' }}>
                  <span className="auth-ref-input-icon"><IconMapPin /></span>
                  <input type="text" className="auth-ref-input" placeholder="Lari, nimewo, repè…"
                    value={rAddr} onChange={e => setRAddr(e.target.value)} />
                </div>
              </div>

              {/* Terms */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '10px 0 16px' }}>
                <input type="checkbox" id="r-terms" checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  style={{ accentColor: '#FF6000', marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
                <label htmlFor="r-terms" style={{ fontSize: '0.75rem', color: '#777', cursor: 'pointer', lineHeight: 1.4 }}>
                  Mwen aksepte kondisyon sèvis ak règleman konfidansyalite Delivery Lakay.
                </label>
              </div>

              {/* Submit */}
              <button type="submit" className="auth-ref-primary-btn" disabled={loading}>
                {loading ? 'Ap kreye kont…' : 'Kreye kont'}
              </button>

              {/* Switch */}
              <div className="auth-ref-footer">
                Ou gen yon kont deja?
                <span className="auth-ref-switch-link" onClick={() => switchTab('login')}>
                  Konekte
                </span>
              </div>

              {/* Merchant CTA */}
              {onGoMerchantRegister && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ECEAE7', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>Ou se yon restoran oswa boutik? </span>
                  <button type="button" onClick={onGoMerchantRegister}
                    style={{ background: 'none', border: 'none', color: '#FF6000', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Enskri kòm machann →
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Security badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 20, fontSize: '0.6875rem', color: '#BBB' }}>
            <span>🔒</span>
            <span>Koneksyon sekirize · SSL 256-bit</span>
          </div>

        </div>
      </div>
    </div>
  )
}
