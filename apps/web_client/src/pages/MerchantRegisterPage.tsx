import { useState } from 'react'
import { apiRegisterMerchant } from '../lib/api'
import { showToast } from '../lib/toast'

interface MerchantRegisterPageProps {
  onGoHome: () => void
}

const CATEGORIES = [
  { value: 'RESTAURANT', label: 'Restoran & Manje Cho' },
  { value: 'FAST_FOOD', label: 'Fritay & Manje Rapid' },
  { value: 'SUPERMARKET', label: 'Sipèmache & Pwovizyon' },
  { value: 'PHARMACY', label: 'Famasi & Pwodwi Sante' },
  { value: 'CONSTRUCTION', label: 'Rad, Mòd & Akseswa' },
  { value: 'BEVERAGE_DEPOT', label: 'Soulye, Bwason & Depo' },
]

export default function MerchantRegisterPage({ onGoHome }: MerchantRegisterPageProps) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('RESTAURANT')
  const [address, setAddress] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
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
      showToast('Tanpri antre non restoran oswa boutik la', 'error')
      return
    }
    if (!address.trim()) {
      showToast('Tanpri antre adrès la nan Cap-Haïtien', 'error')
      return
    }
    if (!fullName.trim()) {
      showToast('Tanpri antre non responsab la', 'error')
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
      showToast('Tanpri aksepte kondisyon patenarya yo', 'error')
      return
    }

    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || 'Machann'
    const lastName = nameParts.slice(1).join(' ') || 'Lakay'

    setIsLoading(true)

    try {
      const res = await apiRegisterMerchant({
        businessName: businessName.trim(),
        businessType,
        ownerFirstName: firstName,
        ownerLastName: lastName,
        phoneNumber: phoneNumber.trim(),
        password,
        address: address.trim(),
      })

      if (res.ok) {
        setSubmittedBusinessName(businessName.trim())
        setIsSuccess(true)
      } else {
        showToast(res.msg || 'Erè pandan anrejistreman an. Tanpri eseye ankò.', 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Erè rezo pandan transmisyon an.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success State Screen ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="merchant-glass-page">
        <div className="merchant-glass-card success-card">
          <div className="merchant-success-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width="34" height="34">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="merchant-glass-title" style={{ marginTop: 18 }}>Demann Soumèt</h1>
          <p className="merchant-glass-subtitle">
            Etablisman <strong style={{ color: '#FFFFFF' }}>{submittedBusinessName}</strong> anrejistre avèk siksè.
          </p>

          <div className="merchant-phone-alert">
            <div className="merchant-phone-alert-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <div className="merchant-phone-alert-content">
              <div className="merchant-phone-alert-title">Koneksyon sou Aplikasyon Mobil la</div>
              <div className="merchant-phone-alert-text">
                Ekip Delivery Lakay ap verifye etablisman w lan anndan 24h. Lè kont lan fin valide, se sou aplikasyon mobil <strong>Delivery Lakay Machann</strong> sou telefòn ou w ap konekte ak nimewo <strong>{phoneNumber}</strong> pou jere kòmand ak lavant ou.
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
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z"/>
              </svg>
              <span>Kontakte Sipò sou WhatsApp pou Validasyon</span>
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
    )
  }

  // ── Registration Form (Matching Reference Image 1:1) ──────────────
  return (
    <div className="merchant-glass-page">
      <div className="merchant-glass-card">
        {/* Title & Subtitle */}
        <div className="merchant-glass-header">
          <h1 className="merchant-glass-title">Enskripsyon Machann</h1>
          <p className="merchant-glass-subtitle">
            Ranpli fòmilè a pou kòmanse vann sou Delivery Lakay
          </p>
        </div>

        {/* Clean Glassmorphic Phone Notice */}
        <div className="merchant-phone-alert">
          <div className="merchant-phone-alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div className="merchant-phone-alert-content">
            <div className="merchant-phone-alert-title">Koneksyon sou Telefòn</div>
            <div className="merchant-phone-alert-text">
              Apre verifikasyon etablisman w lan, se sou aplikasyon mobil Machann sou telefòn ou w ap konekte pou jere kòmand ou yo.
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="merchant-glass-form">
          {/* Non Etablisman */}
          <div className="merchant-input-wrapper">
            <input
              type="text"
              className="merchant-glass-input"
              placeholder="Non Etablisman an"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <span className="merchant-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M3 3h18v4H3z" />
                <path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
                <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
              </svg>
            </span>
          </div>

          {/* Kategori */}
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

          {/* Adrès nan Cap-Haïtien */}
          <div className="merchant-input-wrapper">
            <input
              type="text"
              className="merchant-glass-input"
              placeholder="Adrès nan Cap-Haïtien (eg. Rue 18 H, Sant-Vil)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <span className="merchant-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
          </div>

          {/* Non ak Prenon Responsab la */}
          <div className="merchant-input-wrapper">
            <input
              type="text"
              className="merchant-glass-input"
              placeholder="Non ak Prenon Responsab la"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <span className="merchant-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
          </div>

          {/* Nimewo Telefòn */}
          <div className="merchant-input-wrapper">
            <input
              type="tel"
              className="merchant-glass-input"
              placeholder="Nimewo Telefòn (+509 40 55 36 36)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <span className="merchant-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
          </div>

          {/* Modpas */}
          <div className="merchant-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="merchant-glass-input"
              placeholder="Modpas (omwen 6 karaktè)"
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          {/* Konfime Modpas */}
          <div className="merchant-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="merchant-glass-input"
              placeholder="Konfime Modpas la"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span className="merchant-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
          </div>

          {/* Checkbox (Style matching the reference image) */}
          <label className="merchant-checkbox-label">
            <input
              type="checkbox"
              className="merchant-checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>Mwen aksepte kondisyon patenarya yo</span>
          </label>

          {/* Submit Button (Matching the reference image) */}
          <button
            type="submit"
            disabled={isLoading}
            className="merchant-glass-submit-btn"
          >
            {isLoading ? 'Soumisyon ap fèt...' : 'Kreye Kont Machann'}
          </button>
        </form>

        {/* Footer Subtext */}
        <div className="merchant-glass-footer">
          <button
            type="button"
            onClick={onGoHome}
            className="merchant-glass-back-link"
          >
            Retounen sou paj akèy
          </button>
        </div>
      </div>
    </div>
  )
}
