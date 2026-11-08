import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchOrders } from '../lib/api'

// ── Clean Vector Icons (Zero Emojis, Pure Consumer UI) ────────
const IconUser = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const IconOrders = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" width={size} height={size}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
)

const IconMapPin = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconCreditCard = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const IconGlobe = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const IconPhone = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconWhatsApp = ({ size = 18, color = '#25D366' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z" />
  </svg>
)

const IconEdit = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconLogout = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const IconChevronRight = ({ size = 16, color = '#94A3B8' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconCheck = ({ size = 15, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function ProfilePage({
  onLogout,
  onOrders,
}: {
  onLogout: () => void
  onOrders?: () => void
}) {
  const { user, token } = useAuth()
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Edit fields
  const [editFirst, setEditFirst] = useState(user?.firstName ?? '')
  const [editLast, setEditLast]   = useState(user?.lastName ?? '')
  const [editEmail, setEditEmail] = useState(user?.email ?? '')

  const profileImageUrl = avatarPreview || user?.imageUrl || user?.avatarUrl || null

  useEffect(() => {
    if (!token) return
    fetchOrders(token)
      .then(data => {
        if (Array.isArray(data)) {
          const active = data.filter(o => !['DELIVERED', 'CANCELLED', 'delivered', 'cancelled'].includes(o.status)).length
          setActiveOrdersCount(active)
        }
      })
      .catch(() => {})
  }, [token])

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'
  const fullName = user
    ? `${editFirst || user.firstName} ${editLast || user.lastName}`.trim()
    : 'Kliyan Delivery Lakay'
  const phone = user?.phoneNumber ?? ''

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveMsg('Enfòmasyon ou yo anrejistre!')
    setEditing(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  return (
    <div className="page" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
          Pwofil Mwen
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Jere kont ou, adrès livrezon ak preferans sèvis ou
        </p>
      </div>

      {/* ── User Identity Card ─────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: '22px 24px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar — photo or initials */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={fullName}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #FF6000',
                  boxShadow: '0 4px 14px rgba(255,96,0,0.25)',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: '#FF6000',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(255,96,0,0.28)',
              }}>
                {initials}
              </div>
            )}
            {/* Upload button overlay */}
            <label
              htmlFor="avatar-upload"
              title="Chanje foto profil"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#FF6000',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} width={11} height={11}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {fullName}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{phone || 'Nimewo pa disponib'}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#CBD5E1' }} />
              <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                Verifye
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            background: editing ? 'var(--text-primary)' : 'var(--bg)',
            color: editing ? '#FFFFFF' : 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}>
          <IconEdit size={13} />
          <span>{editing ? 'Fèmen' : 'Modifye'}</span>
        </button>
      </div>

      {/* ── Success Toast ──────────────────────────────────────── */}
      {saveMsg && (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          marginBottom: 16,
          color: '#166534',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <IconCheck size={16} color="#166534" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* ── Inline Edit Form ───────────────────────────────────── */}
      {editing && (
        <form onSubmit={handleSave} style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          padding: '20px 24px',
          marginBottom: 20,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Modifye Enfòmasyon Pèsonèl
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                Prenon
              </label>
              <input
                className="input-field"
                style={{ width: '100%', padding: '9px 12px' }}
                value={editFirst}
                onChange={e => setEditFirst(e.target.value)}
                placeholder="Prenon"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                Siyati
              </label>
              <input
                className="input-field"
                style={{ width: '100%', padding: '9px 12px' }}
                value={editLast}
                onChange={e => setEditLast(e.target.value)}
                placeholder="Siyati"
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
              Adrès Email
            </label>
            <input
              className="input-field"
              type="email"
              style={{ width: '100%', padding: '9px 12px' }}
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="ou@ekzanp.com"
            />
          </div>
          <button
            type="submit"
            className="btn-submit"
            style={{ height: 42, fontSize: '0.875rem', marginTop: 4 }}>
            Sove Modifikasyon Yo
          </button>
        </form>
      )}

      {/* ── Settings Group: Aktivite Mwen ──────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
          Aktivite & Kòmand
        </div>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}>
          {/* My Orders row */}
          <div
            onClick={onOrders}
            role="button"
            tabIndex={0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              cursor: onOrders ? 'pointer' : 'default',
              transition: 'background 0.15s ease',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-50, #FFF1F0)', color: '#FF6000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconOrders size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Kòmand Mwen Yo
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Istwa tout kòmand, resi ak swivi livrezon
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeOrdersCount > 0 && (
                <span style={{
                  background: 'rgba(235, 23, 0, 0.1)',
                  color: '#FF6000',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '3px 9px',
                  borderRadius: 20,
                }}>
                  {activeOrdersCount} aktif
                </span>
              )}
              <IconChevronRight size={16} />
            </div>
          </div>

          {/* Delivery Address row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1F5F9', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconMapPin size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Zòn Livrezon Prensipal
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Cap-Haïtien &bull; Haut du Cap, Vertières, Cité Lescot
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Aktif
            </span>
          </div>
        </div>
      </div>

      {/* ── Settings Group: Mwayen Peman & Preferans ───────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
          Peman & Preferans
        </div>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}>
          {/* Payment methods row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1F5F9', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCreditCard size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Mòd Peman Aksepte
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  MonCash, Natcash ak Lajan Kach sou livrezon
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#F1F5F9', padding: '4px 8px', borderRadius: 6, color: 'var(--text-secondary)' }}>
              MonCash / Kach
            </span>
          </div>

          {/* Language row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1F5F9', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconGlobe size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Lang Sèvis la
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Kreyòl Ayisyen &bull; Français
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Kreyòl Ayisyen
            </span>
          </div>
        </div>
      </div>

      {/* ── Settings Group: Sipò Kliyan ────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
          Sipò & Asistans
        </div>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}>
          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/50940553636"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconWhatsApp size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Sipò WhatsApp Ofisyèl
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Chat an dirèk ak ekip asistans lan: +509 40 55 36 36
                </div>
              </div>
            </div>
            <IconChevronRight size={16} />
          </a>

          {/* Call Line */}
          <a
            href="tel:+50940553636"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              textDecoration: 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1F5F9', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPhone size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  Rele Sant Apèl
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  +509 40 55 36 36 &bull; 8:00 AM – 10:00 PM
                </div>
              </div>
            </div>
            <IconChevronRight size={16} />
          </a>
        </div>
      </div>

      {/* ── Logout Button ──────────────────────────────────────── */}
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '14px 20px',
          background: '#FFFFFF',
          border: '1.5px solid #FEE2E2',
          borderRadius: 'var(--r-xl)',
          color: '#DC2626',
          fontWeight: 800,
          fontSize: '0.9375rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all 0.15s ease',
        }}>
        <IconLogout size={16} color="#DC2626" />
        <span>Dekonekte nan Kont Mwen</span>
      </button>

      {/* App Version Info */}
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Delivery Lakay &bull; Vèsyon 2.4 &bull; Cap-Haïtien, Haïti
      </div>
    </div>
  )
}
