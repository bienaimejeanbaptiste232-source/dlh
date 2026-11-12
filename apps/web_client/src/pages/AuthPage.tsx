import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  requestDeviceLocation,
  resolveLocationFromCoordinates,
  resolveLocationFromZoneId,
  type LocationResolveResult,
} from '../lib/locationResolver'
import { getClientCoverage, type ServiceArea } from '../lib/coverage'

// ── SVG Icons (inline, no extra dep) ────────────────────────────
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
    <rect x="9" y="11" width="14" height="10" rx="2"/>
    <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
  </svg>
)

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z"/>
  </svg>
)

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconEye = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

export default function AuthPage() {
  const { login, register } = useAuth()

  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

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
  const [allAreas, setAllAreas] = useState<ServiceArea[]>([])
  const [selectedDeptCode, setSelectedDeptCode] = useState('HTI-N')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [detectedLocation, setDetectedLocation] = useState<LocationResolveResult | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsNotice, setGpsNotice] = useState<string | null>(null)

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
      setGpsNotice(result.error || 'Lokalizasyon GPS pa t posib. Tanpri chwazi zòn ou anba a.')
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
    setTab(t); setError(null); setSuccess(null)
  }

  const handleLogin = async () => {
    if (loginPhone.replace(/\D/g, '').length < 8) {
      setError('Mete yon nimewo telefòn valab (omwen 8 chif).'); return
    }
    if (loginPwd.length < 6) { setError('Modpas la dwe gen omwen 6 karaktè.'); return }
    setLoading(true); setError(null)
    const res = await login(loginPhone, loginPwd)
    setLoading(false)
    if (!res.ok) setError(res.msg ?? 'Erè koneksyon.')
  }

  const handleRegister = async () => {
    if (!rFirst || !rLast) { setError('Tanpri antre prenon ak non fanmi ou.'); return }
    if (rPhone.replace(/\D/g, '').length < 8) { setError('Nimewo telefòn pa valab.'); return }
    if (rPwd.length < 6) { setError('Modpas la dwe gen omwen 6 karaktè.'); return }
    if (rPwd !== rPwd2) { setError('Modpas yo pa idantik.'); return }
    if (!terms) { setError('Ou dwe aksepte kondisyon itilizasyon yo.'); return }

    // Check location
    if (!selectedZoneId && !rAddr.trim()) {
      setError('Tanpri chwazi zòn livrezon ou oswa detekte pozisyon w.');
      return;
    }

    setLoading(true); setError(null)
    const res = await register({
      firstName: rFirst, lastName: rLast,
      phoneNumber: rPhone, password: rPwd,
      email: rEmail || undefined, languagePreference: rLang,
      address: rAddr.trim() || (detectedLocation?.area ? `${detectedLocation.area.name}, Cap-Haïtien` : undefined),
      zoneId: selectedZoneId || undefined,
      latitude: detectedLocation?.latitude,
      longitude: detectedLocation?.longitude,
      departmentCode: selectedDeptCode,
    })
    setLoading(false)
    if (!res.ok) setError(res.msg ?? 'Erè enskripyon.')
    else {
      // Synchronize active zone across app
      if (detectedLocation?.area?.name) {
        try {
          localStorage.setItem('dlh_zone', detectedLocation.area.name);
          window.dispatchEvent(new CustomEvent('dlh:zone-change', { detail: { zone: detectedLocation.area.name } }));
        } catch (_) {}
      }
      setSuccess(`Byenvini ${rFirst}! Kont ou kreye avèk siksè.`)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <IconTruck />
          </div>
          <h1 className="auth-title">Delivery Haïti</h1>
          <p className="auth-subtitle">
            {tab === 'login'
              ? 'Konekte pou kòmande manje rapidman'
              : 'Kreye kont gratis ou pou kòmanse kòmande'}
          </p>
        </div>

        {/* Tabs */}
        <div className="tab-switcher">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
            Konekte
          </button>
          <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
            Kreye yon Kont
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-error">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <>
            <label className="field-label">Nimewo Telefòn</label>
            <div className="input-wrap">
              <div className="phone-prefix">
                <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "#FF6000" }}>HT</span>
                <span>+509</span>
              </div>
              <input
                id="login-phone"
                className="input-field"
                type="tel"
                placeholder="37 XX XX XX"
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
              />
            </div>

            <label className="field-label">Modpas</label>
            <div className="input-wrap">
              <div className="input-icon"><IconLock /></div>
              <input
                id="login-password"
                className="input-field"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginPwd}
                onChange={e => setLoginPwd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button className="input-suffix-btn" onClick={() => setShowPwd(p => !p)}>
                <IconEye off={showPwd} />
              </button>
            </div>

            <button className="btn-submit" onClick={handleLogin} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Konekte sou Kont Mwen'}
            </button>
          </>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <>
            <div className="row-fields">
              <div>
                <label className="field-label">Prenon *</label>
                <div className="input-wrap">
                  <div className="input-icon"><IconUser /></div>
                  <input id="reg-first" className="input-field" placeholder="Jean" value={rFirst} onChange={e => setRFirst(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="field-label">Non Fanmi *</label>
                <div className="input-wrap">
                  <div className="input-icon"><IconUser /></div>
                  <input id="reg-last" className="input-field" placeholder="Baptiste" value={rLast} onChange={e => setRLast(e.target.value)} />
                </div>
              </div>
            </div>

            <label className="field-label">Nimewo Telefòn *</label>
            <div className="input-wrap">
              <div className="phone-prefix">
                <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "#FF6000" }}>HT</span>
                <span>+509</span>
              </div>
              <input id="reg-phone" className="input-field" type="tel" placeholder="37 XX XX XX" value={rPhone} onChange={e => setRPhone(e.target.value)} />
            </div>

            <label className="field-label">Email (Opsyonèl)</label>
            <div className="input-wrap">
              <div className="input-icon"><IconMail /></div>
              <input id="reg-email" className="input-field" type="email" placeholder="kliyan@gmail.com" value={rEmail} onChange={e => setREmail(e.target.value)} />
            </div>

            <label className="field-label">Modpas * (omwen 6 karaktè)</label>
            <div className="input-wrap">
              <div className="input-icon"><IconLock /></div>
              <input id="reg-pwd" className="input-field" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={rPwd} onChange={e => setRPwd(e.target.value)} />
              <button className="input-suffix-btn" onClick={() => setShowPwd(p => !p)}><IconEye off={showPwd} /></button>
            </div>

            <label className="field-label">Konfime Modpas *</label>
            <div className="input-wrap">
              <div className="input-icon"><IconLock /></div>
              <input id="reg-pwd2" className="input-field" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={rPwd2} onChange={e => setRPwd2(e.target.value)} />
            </div>

            {/* Location & Coverage during Registration */}
            <div style={{ marginTop: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="field-label" style={{ marginBottom: 0 }}>Lokalizasyon & Zòn Livrezon *</label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={gpsLoading}
                  style={{
                    background: 'none',
                    border: '1px solid #FF6000',
                    color: '#FF6000',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{gpsLoading ? '📡 Ap detekte...' : '📍 Detekte ak GPS'}</span>
                </button>
              </div>

              {gpsNotice && (
                <div style={{ fontSize: '0.6875rem', color: '#B45309', background: '#FFFBEB', padding: '6px 10px', borderRadius: 8, marginBottom: 8, border: '1px solid #FDE68A' }}>
                  {gpsNotice}
                </div>
              )}

              {/* Department & Zone Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4 }}>
                    Depatman
                  </div>
                  <select
                    value={selectedDeptCode}
                    onChange={e => setSelectedDeptCode(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8125rem', borderRadius: 8 }}
                  >
                    <option value="HTI-N">Nord (Nò) — Aktif</option>
                    <option value="HTI-O" disabled>Ouest (Lwès) — Bento</option>
                    <option value="HTI-S" disabled>Sud (Sid) — Bento</option>
                    <option value="HTI-A" disabled>Artibonite — Bento</option>
                    <option value="HTI-C" disabled>Centre — Bento</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4 }}>
                    Zòn Sèvis (Okap)
                  </div>
                  <select
                    value={selectedZoneId}
                    onChange={e => handleZoneSelect(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '0.8125rem', borderRadius: 8 }}
                  >
                    {allAreas.filter(a => a.type === 'ZONE').map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} {!z.isActive ? '(Dezaktive)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Coverage & Pricing Feedback */}
              {detectedLocation && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginBottom: 8,
                    background: detectedLocation.isAvailable ? '#ECFDF5' : '#FEF2F2',
                    color: detectedLocation.isAvailable ? '#065F46' : '#991B1B',
                    border: `1px solid ${detectedLocation.isAvailable ? '#A7F3D0' : '#FECACA'}`,
                  }}
                >
                  {detectedLocation.statusMessage}
                </div>
              )}

              {/* Specific Street Address / Repère */}
              <div className="input-wrap">
                <div className="input-icon"><IconMapPin /></div>
                <input
                  id="reg-addr"
                  className="input-field"
                  placeholder="Lari, nimewo kay oswa repè (eg: Boulevard, Rue 18 L)"
                  value={rAddr}
                  onChange={e => setRAddr(e.target.value)}
                />
              </div>
            </div>

            <label className="field-label" style={{ marginBottom: 8 }}>Preferans Lang</label>
            <div className="lang-selector">
              <button className={`lang-opt ${rLang === 'ht' ? 'selected' : ''}`} onClick={() => setRLang('ht')}>
                <span className="lang-badge">HT</span>Kreyòl
              </button>
              <button className={`lang-opt ${rLang === 'fr' ? 'selected' : ''}`} onClick={() => setRLang('fr')}>
                <span className="lang-badge">FR</span>Français
              </button>
            </div>

            <div className="terms-row">
              <input id="terms" className="terms-checkbox" type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
              <label htmlFor="terms" className="terms-text">
                Mwen aksepte kondisyon itilizasyon ak règleman konfidansyalite Delivery Haïti.
              </label>
            </div>

            <button className="btn-submit" onClick={handleRegister} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Kreye Kont Mwen & Kòmanse'}
            </button>
          </>
        )}

        {/* Trust footer */}
        <div className="auth-trust">
          <IconShield />
          <span>Peman Sekirize • MonCash & Cash Aksepte</span>
        </div>
      </div>
    </div>
  )
}
