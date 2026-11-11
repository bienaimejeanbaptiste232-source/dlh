import { useState } from 'react'
import { apiRegisterMerchant } from '../lib/api'
import { showToast } from '../lib/toast'

interface MerchantRegisterPageProps {
  onGoHome: () => void
}

const CATEGORIES = [
  { value: 'RESTAURANT', label: '🍽️ Restoran / Manje Cho & Gastronomi' },
  { value: 'FAST_FOOD', label: '🌶️ Fritay / Manje Rapid & Pate' },
  { value: 'SUPERMARKET', label: '🛒 Sipèmache, Episri & Pwovizyon' },
  { value: 'PHARMACY', label: '💊 Famasi & Pwodwi Sante' },
  { value: 'CONSTRUCTION', label: '👕 Rad, Mòd & Akseswa' },
  { value: 'BEVERAGE_DEPOT', label: '👟 Soulye, Bwason & Depo' },
]

export default function MerchantRegisterPage({ onGoHome }: MerchantRegisterPageProps) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('RESTAURANT')
  const [address, setAddress] = useState('')
  const [ownerFirstName, setOwnerFirstName] = useState('')
  const [ownerLastName, setOwnerLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedBusinessName, setSubmittedBusinessName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessName.trim()) {
      showToast('Tanpri antre non restoran oswa boutik ou a', 'error')
      return
    }
    if (!address.trim()) {
      showToast('Tanpri antre adrès etablisman w lan nan Cap-Haïtien', 'error')
      return
    }
    if (!ownerFirstName.trim() || !ownerLastName.trim()) {
      showToast('Tanpri antre non ak prenon responsab la', 'error')
      return
    }
    if (!phoneNumber.trim()) {
      showToast('Tanpri antre nimewo telefòn ou', 'error')
      return
    }
    if (password.length < 6) {
      showToast('Modpas la dwe gen omwen 6 karaktè', 'error')
      return
    }
    if (password !== confirmPassword) {
      showToast('Modpas yo pa koresponn', 'error')
      return
    }
    if (!agreeTerms) {
      showToast('Ou dwe aksepte kondisyon patenarya yo pou kontinye', 'error')
      return
    }

    setIsLoading(true)

    try {
      const res = await apiRegisterMerchant({
        businessName: businessName.trim(),
        businessType,
        ownerFirstName: ownerFirstName.trim(),
        ownerLastName: ownerLastName.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        email: email.trim() || undefined,
        address: address.trim(),
      })

      if (res.ok) {
        setSubmittedBusinessName(businessName.trim())
        setIsSuccess(true)
        showToast('Demann enskripsyon an soumèt avèk siksè !', 'success')
      } else {
        showToast(res.msg || 'Erè pandan anrejistreman an. Tanpri eseye ankò.', 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Erè rezo pandan transmisyon demann lan.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success State Screen ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="merchant-glass-page">
        <div className="merchant-glass-container">
          <div className="merchant-glass-card success-card">
            {/* Success Icon Badge */}
            <div className="merchant-success-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 className="merchant-glass-title" style={{ marginTop: 16 }}>Demann Soumèt !</h1>
            <p className="merchant-glass-subtitle">
              Felisitasyon, demann pou <strong style={{ color: '#FF6000' }}>{submittedBusinessName}</strong> anrejistre nan sistèm nan.
            </p>

            {/* Crucial Info Box: Notice about mobile login */}
            <div className="merchant-phone-alert">
              <div className="merchant-phone-alert-icon">📱</div>
              <div className="merchant-phone-alert-content">
                <div className="merchant-phone-alert-title">Koneksyon sou Telefòn Sèlman</div>
                <div className="merchant-phone-alert-text">
                  Ekip <strong>Delivery Lakay</strong> ap verifye etablisman w lan anndan <strong>24h</strong>. Lè l fin valide, se sou aplikasyon mobil <strong>Delivery Lakay Machann</strong> sou telefòn ou w ap ka konekte ak nimewo <strong>{phoneNumber}</strong> ansanm ak modpas ou a pou jere kòmand, meni ak lavant ou.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, width: '100%' }}>
              <a
                href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mwen%20fèk%20soumèt%20enskripsyon%20etablisman%20mwen%20an%20pou%20vin%20vandè.%20Èske%20nou%20ka%20ede%20m%20verifye%20li%20rapidman?"
                target="_blank"
                rel="noopener noreferrer"
                className="merchant-glass-submit-btn"
                style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', textDecoration: 'none' }}
              >
                <span>💬 Kontakte Sipò sou WhatsApp pou Validasyon Rapid</span>
              </a>

              <button
                type="button"
                onClick={onGoHome}
                className="merchant-glass-secondary-btn"
              >
                Retounen sou Paj Akèy la
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Registration Form ─────────────────────────────────────────────
  return (
    <div className="merchant-glass-page">
      <div className="merchant-glass-container">
        <div className="merchant-glass-card">
          {/* Header with App Logo */}
          <div className="merchant-glass-header">
            <div className="merchant-glass-logo">
              <img src="/logo.png" alt="Delivery Lakay" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
            </div>
            <h1 className="merchant-glass-title">Vin Vandè</h1>
            <p className="merchant-glass-subtitle">
              Kreye kont etablisman w lan pou kòmanse resevwa kòmand nan tout Cap-Haïtien
            </p>
          </div>

          {/* Important Glassmorphic Notice about mobile app login */}
          <div className="merchant-phone-alert">
            <div className="merchant-phone-alert-icon">📱</div>
            <div className="merchant-phone-alert-content">
              <div className="merchant-phone-alert-title">Avi sou Koneksyon an</div>
              <div className="merchant-phone-alert-text">
                Fòmilè sa a se pou soumèt enskripsyon w. Lè kont ou fin verifye pa administrasyon an, se <strong>sou aplikasyon mobil Delivery Lakay Machann sou telefòn ou</strong> w ap ka konekte.
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="merchant-glass-form">
            {/* Section 1: Business Details */}
            <div className="merchant-form-section-title">
              1. Enfòmasyon Etablisman an
            </div>

            <div className="merchant-input-group">
              <label className="merchant-label">Non Etablisman an / Biznis la *</label>
              <div className="merchant-input-wrapper">
                <input
                  type="text"
                  className="merchant-glass-input"
                  placeholder="eg. Restoran Lakay, Boutik Stil Okap..."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
                <span className="merchant-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M3 3h18v4H3z" />
                    <path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
                    <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="merchant-input-group">
              <label className="merchant-label">Kategori Biznis la *</label>
              <div className="merchant-input-wrapper">
                <select
                  className="merchant-glass-input merchant-glass-select"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} style={{ background: '#0F172A', color: '#FFFFFF' }}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <span className="merchant-input-icon" style={{ pointerEvents: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="merchant-input-group">
              <label className="merchant-label">Adrès Etablisman an nan Cap-Haïtien *</label>
              <div className="merchant-input-wrapper">
                <input
                  type="text"
                  className="merchant-glass-input"
                  placeholder="eg. Rue 18 H, Sant-Vil Okap..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <span className="merchant-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Section 2: Owner Contact & Security */}
            <div className="merchant-form-section-title" style={{ marginTop: 20 }}>
              2. Responsab & Sekirite
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="merchant-input-group">
                <label className="merchant-label">Prenon *</label>
                <div className="merchant-input-wrapper">
                  <input
                    type="text"
                    className="merchant-glass-input"
                    placeholder="Jean"
                    value={ownerFirstName}
                    onChange={(e) => setOwnerFirstName(e.target.value)}
                    required
                  />
                  <span className="merchant-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="merchant-input-group">
                <label className="merchant-label">Non Fanmi *</label>
                <div className="merchant-input-wrapper">
                  <input
                    type="text"
                    className="merchant-glass-input"
                    placeholder="Baptiste"
                    value={ownerLastName}
                    onChange={(e) => setOwnerLastName(e.target.value)}
                    required
                  />
                  <span className="merchant-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            <div className="merchant-input-group">
              <label className="merchant-label">Nimewo Telefòn (pou kontak & koneksyon) *</label>
              <div className="merchant-input-wrapper">
                <input
                  type="tel"
                  className="merchant-glass-input"
                  placeholder="+509 40 55 36 36 oswa 40553636"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <span className="merchant-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="merchant-input-group">
              <label className="merchant-label">Imèl (opsyonèl)</label>
              <div className="merchant-input-wrapper">
                <input
                  type="email"
                  className="merchant-glass-input"
                  placeholder="restoran@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="merchant-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="merchant-input-group">
                <label className="merchant-label">Modpas *</label>
                <div className="merchant-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="merchant-glass-input"
                    placeholder="Omwen 6 karaktè"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="merchant-input-icon-btn"
                    onClick={() => setShowPassword(prev => !prev)}
                    title={showPassword ? 'Kache modpas' : 'Montre modpas'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="merchant-input-group">
                <label className="merchant-label">Konfime Modpas *</label>
                <div className="merchant-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="merchant-glass-input"
                    placeholder="Repete modpas la"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span className="merchant-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <label className="merchant-checkbox-label">
              <input
                type="checkbox"
                className="merchant-checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                Mwen konfime enfòmasyon sa yo kòrèk e mwen aksepte kondisyon patenarya Delivery Lakay yo.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="merchant-glass-submit-btn"
            >
              {isLoading ? (
                <span>Soumisyon ap fèt...</span>
              ) : (
                <span>SOUMÈT DEMANN ENSKRIPSYON AN</span>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="merchant-glass-footer">
            <button
              type="button"
              onClick={onGoHome}
              className="merchant-glass-back-link"
            >
              ← Retounen sou Paj Akèy Delivery Lakay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

