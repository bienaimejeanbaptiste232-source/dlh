import { useState } from 'react'

type NavPage = 'home' | 'checkout' | 'profile' | 'auth' | 'orders'

interface FooterProps {
  onNavigate: (p: NavPage) => void
  user: any
}

// ── Icons ────────────────────────────────────────────────────
const IconWhatsApp = ({ size = 15, color = '#25D366' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z" />
  </svg>
)

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" width={18} height={18}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default function Footer({ onNavigate, user }: FooterProps) {
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null)

  return (
    <footer style={{ background: '#17191C', color: '#9CA3AF', paddingTop: 48, paddingBottom: 24, borderTop: '4px solid #FF6000' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 36,
          paddingBottom: 40,
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          {/* Brand Col */}
          <div>
            <div
              onClick={() => onNavigate('home')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}
            >
              <img src="/logo.png" alt="Delivery Lakay" style={{ height: 38 }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' }}>Delivery Lakay</span>
            </div>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: '#9CA3AF', marginBottom: 16 }}>
              Premye platfòm livrezon pwofesyonèl nan Cap-Haïtien. Manje, famasi, sipèmache ak kago delivre rapid devan pòt ou.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8125rem' }}>
              <a
                href="https://wa.me/50940553636"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontWeight: 600 }}
              >
                <IconWhatsApp size={16} color="#25D366" />
                <span>WhatsApp: +509 40 55 36 36</span>
              </a>
              <a
                href="tel:+50940553636"
                style={{ color: '#E5E7EB', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontWeight: 500 }}
              >
                <IconPhone />
                <span>Dispatch: +509 40 55 36 36</span>
              </a>
            </div>
          </div>

          {/* Sèvis & Kategori */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kategori Sèvis
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem' }}>
              <li><button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0 }}>Restoran & Gastronomi</button></li>
              <li><button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0 }}>Sipèmache & Pwovizyon</button></li>
              <li><button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0 }}>Famasi & Medikaman</button></li>
              <li><button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0 }}>Materyo Konstriksyon</button></li>
              <li><button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0 }}>Dépôt Bwason & Dlo</button></li>
            </ul>
          </div>

          {/* Patenarya & Kont */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Patenarya & Kont
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem' }}>
              <li>
                <a
                  href="https://wa.me/50940553636?text=Mwen%20vle%20enskri%20komes%20mwen"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#D1D5DB', textDecoration: 'none' }}
                >
                  Enskri Kòmès Ou
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/50940553636?text=Mwen%20vle%20livre%20pou%20nou"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#D1D5DB', textDecoration: 'none' }}
                >
                  Vin Chofè Kousye
                </a>
              </li>
              <li>
                {user ? (
                  <button onClick={() => onNavigate('orders')} style={{ background: 'none', border: 'none', color: '#FF6000', cursor: 'pointer', padding: 0, fontWeight: 700 }}>
                    Kòmand Mwen Yo
                  </button>
                ) : (
                  <button onClick={() => onNavigate('auth')} style={{ background: 'none', border: 'none', color: '#FF6000', cursor: 'pointer', padding: 0, fontWeight: 700 }}>
                    Konekte sou Kont Ou
                  </button>
                )}
              </li>
            </ul>
          </div>

          {/* Peman & Zòn */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Peman & Zòn Livrezon
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span style={{ background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                MonCash
              </span>
              <span style={{ background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                Natcash
              </span>
              <span style={{ background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                Cash sou Livrezon
              </span>
            </div>
            <p style={{ fontSize: '0.78125rem', color: '#9CA3AF', lineHeight: 1.5 }}>
              Kouvèti: Sant-Vil Cap-Haïtien, Barrière-Bouteille,Petit-Anse,Madeline, Quartier Morin, Limonade, Milot.
            </p>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div style={{
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '0.75rem',
          color: '#6B7280'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Delivery Lakay Haïti. Tout dwa rezève.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setModalType('terms')}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
            >
              Kondisyon Itilizasyon
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setModalType('privacy')}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
            >
              Règleman Vi Prive
            </button>
            <span>&bull;</span>
            <span style={{ color: '#FF6000', fontWeight: 700 }}>Cap-Haïtien, Haïti</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div
          onClick={() => setModalType(null)}
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
              borderRadius: 12,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              color: '#17191C',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E8E8E8', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>
                {modalType === 'terms' ? 'Kondisyon Itilizasyon' : 'Règleman sou Vi Prive'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <IconX />
              </button>
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#4B5563', maxHeight: 300, overflowY: 'auto' }}>
              {modalType === 'terms' ? (
                <>
                  <p><strong>1. Sèvis:</strong> Delivery Lakay se yon platfòm livrezon an tan reyèl nan Cap-Haïtien ki konekte kliyan, patnè komèsyal ak kousye dedye.</p>
                  <p><strong>2. Kòmand:</strong> Chak kòmand trete san pèdi tan. Pri livrezon kalkile dapre distans ak volim.</p>
                  <p><strong>3. Peman:</strong> Nou aksepte MonCash, Natcash ak lajan kach lè livrezon an rive.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Done Kliyan:</strong> Done w yo (non, adrès, telefòn) itilize sèlman pou asire livrezon an rive nan bon men.</p>
                  <p><strong>2. Konfidansyalite:</strong> Nou respekte vi prive tout itilizatè nou yo. Done w yo pa janm vann oswa transfere bay twazyèm pati.</p>
                  <p><strong>3. Sipò:</strong> Pou sipò teknik oswa kesyon sou kont ou, kontakte liy ofisyèl WhatsApp la.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
