import { useState, useEffect } from 'react'

interface LegalPageProps {
  initialTab?: 'terms' | 'privacy'
  onGoHome: () => void
  onSwitchTab?: (tab: 'terms' | 'privacy') => void
}

// ── Crisp Inline SVG Icons (Zero Emojis) ────────────────────────
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const IconPrinter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const IconWhatsApp = ({ size = 15, color = '#25D366' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z" />
  </svg>
)

const IconCheckmark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function LegalPage({ initialTab = 'terms', onGoHome, onSwitchTab }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [initialTab])

  const handleTabChange = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab)
    onSwitchTab?.(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="legal-page-container" style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 20px 80px', color: '#1E293B' }}>
      {/* ── Top Navigation Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <button
          onClick={onGoHome}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.875rem',
            fontWeight: 700,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}
        >
          <IconArrowLeft />
          <span>Retounen nan Paj Akèy</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handlePrint}
            className="desktop-only"
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <IconPrinter />
            <span>Enprime Dokiman an</span>
          </button>

          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            <span>Akèy</span>
            <span style={{ margin: '0 6px' }}>/</span>
            <span style={{ color: '#0F172A', fontWeight: 800 }}>
              {activeTab === 'terms' ? 'Kondisyon Itilizasyon' : 'Règleman Vi Prive'}
            </span>
          </span>
        </div>
      </div>

      {/* ── Header Masthead (Authoritative & Clean Commercial Style) ── */}
      <header style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '28px 32px',
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 900,
            letterSpacing: '0.8px',
            color: '#475569',
            textTransform: 'uppercase',
            background: '#F1F5F9',
            padding: '3px 10px',
            borderRadius: 6
          }}>
            DELIVERY LAKAY HAÏTI · CAP-HAÏTIEN
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
            Dokiman Ofisyèl Ref: DLH-LEG-2026-v2
          </span>
        </div>

        <h1 style={{
          margin: '0 0 12px 0',
          fontSize: '1.875rem',
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '-0.5px',
          lineHeight: 1.2
        }}>
          {activeTab === 'terms'
            ? 'Kondisyon Jeneral pou Itilizasyon ak Livrezon'
            : 'Règleman sou Pwoteksyon Done Pèsonèl ak Vi Prive'}
        </h1>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: '0.8125rem',
          color: '#64748B',
          paddingTop: 12,
          borderTop: '1px solid #F1F5F9'
        }}>
          <span><strong>Dat Dènye Revizyon :</strong> 1e Novanm 2026</span>
          <span>•</span>
          <span><strong>Jiridiksyon :</strong> Tribinal Cap-Haïtien, Haïti</span>
          <span>•</span>
          <span><strong>Estati :</strong> An Vigè pou Tout Itilizatè</span>
        </div>
      </header>

      {/* ── Document Switcher Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        <button
          onClick={() => handleTabChange('terms')}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 800,
            cursor: 'pointer',
            border: activeTab === 'terms' ? '2px solid #0F172A' : '1px solid #CBD5E1',
            background: activeTab === 'terms' ? '#0F172A' : '#FFFFFF',
            color: activeTab === 'terms' ? '#FFFFFF' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          Kondisyon Jeneral (Itilizasyon & Livrezon)
        </button>

        <button
          onClick={() => handleTabChange('privacy')}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 800,
            cursor: 'pointer',
            border: activeTab === 'privacy' ? '2px solid #0F172A' : '1px solid #CBD5E1',
            background: activeTab === 'privacy' ? '#0F172A' : '#FFFFFF',
            color: activeTab === 'privacy' ? '#FFFFFF' : '#475569',
            transition: 'all 0.15s ease'
          }}
        >
          Règleman sou Vi Prive & Done
        </button>
      </div>

      {/* ── 2-Column Corporate Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' }} className="legal-grid-layout">
        {/* Left Sticky Sidebar: Table of Contents & Contact Details */}
        <aside style={{ position: 'sticky', top: 90 }} className="desktop-only">
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#0F172A',
              marginBottom: 14,
              paddingBottom: 8,
              borderBottom: '1px solid #F1F5F9'
            }}>
              Somè Dokiman an
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8125rem' }}>
              {activeTab === 'terms' ? (
                <>
                  <button onClick={() => scrollToSection('sec-1')} style={navLinkStyle}>1. Kad Juridik & Sèvis</button>
                  <button onClick={() => scrollToSection('sec-2')} style={navLinkStyle}>2. Enskripsyon & Kont Kliyan</button>
                  <button onClick={() => scrollToSection('sec-3')} style={navLinkStyle}>3. Kòmand, Pri & Monwa</button>
                  <button onClick={() => scrollToSection('sec-4')} style={navLinkStyle}>4. Modalite Livrezon nan Okap</button>
                  <button onClick={() => scrollToSection('sec-5')} style={navLinkStyle}>5. Peman MonCash & Natcash</button>
                  <button onClick={() => scrollToSection('sec-6')} style={navLinkStyle}>6. Anilasyon & Ranbousman</button>
                  <button onClick={() => scrollToSection('sec-7')} style={navLinkStyle}>7. Responsablite & Fòs Majè</button>
                  <button onClick={() => scrollToSection('sec-8')} style={navLinkStyle}>8. Lwa Aplikab & Litij</button>
                </>
              ) : (
                <>
                  <button onClick={() => scrollToSection('p-sec-1')} style={navLinkStyle}>1. Angajman DLH sou Done</button>
                  <button onClick={() => scrollToSection('p-sec-2')} style={navLinkStyle}>2. Done Nou Kolekte</button>
                  <button onClick={() => scrollToSection('p-sec-3')} style={navLinkStyle}>3. Itilizasyon Enfòmasyon yo</button>
                  <button onClick={() => scrollToSection('p-sec-4')} style={navLinkStyle}>4. Pataje ak Kousye yo</button>
                  <button onClick={() => scrollToSection('p-sec-5')} style={navLinkStyle}>5. Sekirite & Kominikasyon</button>
                  <button onClick={() => scrollToSection('p-sec-6')} style={navLinkStyle}>6. Dwa Kliyan & Efase Kont</button>
                </>
              )}
            </nav>
          </div>

          {/* Quick Legal Help Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '18px 20px'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#0F172A', marginBottom: 4 }}>
              Biwo Dispatch Okap
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.5, marginBottom: 12 }}>
              Delivery Lakay Haïti<br />
              Cap-Haïtien, Haïti<br />
              Sèvis Kliyan: 7j / 7 (8 AM – 10 PM)
            </div>
            <a
              href="https://wa.me/50940553636?text=Bonjou,%20mwen%20gen%20yon%20kesyon%20legal%20sou%20Delivery%20Lakay"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.75rem',
                color: '#16A34A',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              <IconWhatsApp size={14} color="#16A34A" />
              <span>WhatsApp: +509 40 55 36 36</span>
            </a>
          </div>
        </aside>

        {/* Right Main Column: Substantive Legal Provisions */}
        <main style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '36px 36px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          fontSize: '0.9375rem',
          lineHeight: 1.75,
          color: '#334155'
        }}>
          {activeTab === 'terms' ? (
            <div>
              {/* Seksyon 1 */}
              <section id="sec-1" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>1. Kad Juridik & Prezantasyon Sèvis la</h2>
                <p>
                  Sèvis Delivery Lakay Haïti (ki deziyen anba tèks sa a kòm « DLH » oswa « Platfòm nan ») se yon platfòm teknolojik entèmedyè ki fasilite koneksyon ant konsomatè (« Kliyan »), etablisman komèsyal patnè (« Machann » tankou restoran, makèt, famasi, depo bwason, magazen materyo konstriksyon), ak livrè moto endepandan verifye (« Kousye »).
                </p>
                <p>
                  Sèvis la opere prensipalman nan vil Cap-Haïtien ak tout komin ki nan depatman Nò a. Lè w kreye yon kont, browse katalòg la, oswa konfime yon kòmand sou sit entènèt la, ou aksepte fòmèlman tout kloz ki nan kontra sa a.
                </p>
              </section>

              {/* Seksyon 2 */}
              <section id="sec-2" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>2. Enskripsyon, Kont Kliyan & Otantifikasyon</h2>
                <p>
                  Pou w ka benefisye sèvis livrezon an, ou dwe gen omwen 18 lane oswa gen otorizasyon paran w. Lè w ap anrejistre :
                </p>
                <div style={clauseBoxStyle}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>2.1 Verifikasyon Nimewo Telefòn :</strong> Ou dwe bay yon nimewo telefòn aktif nan peyi d Ayiti (Digicel oswa Natcom). Nimewo sa a sèvi pou verifye idantite w ak kowòdone livrezon an devan pòt ou.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>2.2 Egzaktitid Adrès :</strong> Kliyan an responsab totalman pou enfòmasyon ak repè jewografik li bay sou katye Okap li ye a (Sant-Vil, Carenage, Rival, Barrière-Bouteille, Vertières, elatriye).</p>
                  <p style={{ margin: 0 }}><strong>2.3 Konfidansyalite Kont :</strong> Kliyan an dwe kenbe enfòmasyon aksè li yo an sekirite. Nenpòt kòmand ki pase sou kont li konsidere kòm kòmand li menm li otorize.</p>
                </div>
              </section>

              {/* Seksyon 3 */}
              <section id="sec-3" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>3. Pwosesis Kòmand, Pri & Monwa Aplikab</h2>
                <p>
                  Tout pri atik ki sou sit la afiche an <strong>Gourdes Ayisyen (HTG)</strong>. Pri sa yo reflete pri ofisyèl Machann nan fikse nan etablisman li.
                </p>
                <div style={clauseBoxStyle}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>3.1 Valè Kòmand :</strong> Pri total ki parèt nan panyen w lan gen ladan l : pri pwodwi yo, taks aplikab yo, plis frè livrezon kousye a.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>3.2 Disponiblite Stock :</strong> Si yon atik ou te chwazi ta fini nan envantè Machann nan pandan preparasyon an, dispatch DLH ap rele w sou WhatsApp oswa telefòn dirèk pou pwopoze w yon ranplasan oswa anile atik sa a san penalite.</p>
                  <p style={{ margin: 0 }}><strong>3.3 Transparans :</strong> Pa gen okenn frè sipriz ki ka ajoute sou kòmand la apre konfimasyon final la.</p>
                </div>
              </section>

              {/* Seksyon 4 */}
              <section id="sec-4" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>4. Modalite Livrezon nan Cap-Haïtien & Zòn Kouvri</h2>
                <p>
                  Livrezon yo fèt sou moto pa kousye ki ekipe ak bwat ak sak tèmik pou asire manje yo rete cho e bwason yo rete fre.
                </p>
                <div style={clauseBoxStyle}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>4.1 Frè Livrezon Estanda :</strong> Frè debaz la se <strong>150 HTG</strong> pou tout livrezon anndan perimèt Sant-Vil Cap-Haïtien ak katye pre yo.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>4.2 Zòn Périphériques :</strong> Pou zòn ki pi lwen yo (tankou Madeline, Quartier Morin, Limonade, Vaudreuil, Milot), yon ti ajisteman distans kalkile otomatikman nan kès la anvan w valide.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>4.3 Livrezon Devan Baryè :</strong> Kousye a livre devan baryè oswa antre adrès ou endike a. Lè kousye a rive, li notifye w pa apèl oswa mesaj.</p>
                  <p style={{ margin: 0 }}><strong>4.4 Tan Datant Maksimòm :</strong> Kousye a ap tann ou pandan yon maksimòm 10 minit devan baryè a. Si apre tan sa a kliyan an pa reponn e pa prezante, livrezon an konsidere kòm echwe pou absans kliyan.</p>
                </div>
              </section>

              {/* Seksyon 5 */}
              <section id="sec-5" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>5. Mòd Peman Otorize & Pwoteksyon Tranzaksyon</h2>
                <p>
                  Pou garanti sekirite tout moun nan vil la, DLH sipòte 3 mòd peman otorize :
                </p>
                <ul style={{ paddingLeft: 20, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>MonCash (Digicel) :</strong> Transfè dirèk sou kont machann ofisyèl DLH la.</li>
                  <li><strong>Natcash (Natcom) :</strong> Transfè sou nimewo dispatch verifye nou an.</li>
                  <li><strong>Lajan Kach (Espès) :</strong> Peye kousye a dirèkteman lè li remèt ou pake w la devan baryè a.</li>
                </ul>
                <div style={{
                  background: '#F8FAFC',
                  borderLeft: '4px solid #0F172A',
                  padding: '14px 18px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.875rem'
                }}>
                  <strong>Règ Sekirite Enpòtan :</strong> Okenn anplwaye oswa kousye Delivery Lakay pa gen dwa mande w kòd sekrè PIN MonCash oswa Natcash ou. Si yon moun ta mande w sa, refize imedyatman epi rapòte sa nan dispatch santral la.
                </div>
              </section>

              {/* Seksyon 6 */}
              <section id="sec-6" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>6. Politik Anilasyon, Retou & Ranbousman</h2>
                <p>
                  Nou respekte dwa tout kliyan pou yo jwenn sa yo te kòmande a nan bon kondisyon.
                </p>
                <div style={clauseBoxStyle}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>6.1 Anilasyon pa Kliyan an :</strong> Ou ka anile yon kòmand gratis si Machann nan poko kòmanse prepare l. Si preparasyon an deja kòmanse (sitou pou manje cho restoran), anilasyon an pa posib ankò.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>6.2 Pwodwi ki Pa Koresponn oswa ki Andomaje :</strong> Si pake ou resevwa a pa sa w te mande a oswa si li andomaje pandan transpò a, ou dwe fè kousye a wè sa sou plas oswa voye yon foto bay dispatch nou sou WhatsApp anndan yon delè 30 minit apre livrezon an.</p>
                  <p style={{ margin: 0 }}><strong>6.3 Ranbousman Rapid :</strong> Lè yon reklamasyon valide, DLH ranbouse montan an sou kont MonCash oswa Natcash ou anndan mwens pase 15 minit.</p>
                </div>
              </section>

              {/* Seksyon 7 */}
              <section id="sec-7" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>7. Limit Responsablite & Ka Fòs Majè</h2>
                <p>
                  DLH pran tout dispozisyon pou asire kòmand yo rive alè (an jeneral 20 a 35 minit). Sepandan, DLH pa ka responsab reta ki koze pa :
                </p>
                <ul style={{ paddingLeft: 20, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Gwo lapli, inondasyon oswa move tan nan vil Okap ki rann wout moto yo danjere;</li>
                  <li>Blokus lari, manifestasyon, oswa baryè sekirite enprevi;</li>
                  <li>Pann rezo telekominikasyon jeneral (Digicel / Natcom);</li>
                  <li>Adrès oswa nimewo telefòn kliyan an ki pa kòrèk.</li>
                </ul>
              </section>

              {/* Seksyon 8 */}
              <section id="sec-8">
                <h2 style={sectionHeadingStyle}>8. Lwa Aplikab & Règleman Litij</h2>
                <p>
                  Kondisyon sa yo reji pa lwa Repiblik d Ayiti. Nan ka ta gen nenpòt dezakò oswa kontestasyon ant yon kliyan ak DLH, de pati yo angaje yo pou chèche yon solisyon amikal an premye atravè sèvis mediyasyon kliyan nou an. Si pa gen antant, se Tribinal Konpetan vil Cap-Haïtien ki responsab pou jije afè a.
                </p>
              </section>
            </div>
          ) : (
            <div>
              {/* Privacy Seksyon 1 */}
              <section id="p-sec-1" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>1. Angajman DLH sou Pwoteksyon Vi Prive</h2>
                <p>
                  Delivery Lakay Haïti respekte dwa fondamantal tout moun genyen sou vi prive yo. Règleman sa a eksplike aklè kijan nou kolekte, itilize, estoke, epi pwoteje enfòmasyon pèsonèl ou lè w ap itilize platfòm livrezon nou an nan vil Cap-Haïtien.
                </p>
              </section>

              {/* Privacy Seksyon 2 */}
              <section id="p-sec-2" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>2. Lis Egzak Done Nou Kolekte</h2>
                <p>
                  Nou kolekte sèlman enfòmasyon ki nesesè pou livrezon an fèt san pwoblèm :
                </p>
                <div style={clauseBoxStyle}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>2.1 Idantite Kliyan :</strong> Non ak prenon ou bay lè w kreye kont lan, pou Machann nan ak Kousye a ka verifye se pou ou kòmand lan ye.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>2.2 Nimewo Telefòn :</strong> Nimewo Digicel oswa Natcom ou bay la sèvi pou kousye a rele w lè li devan baryè a, epi pou nou voye resi kòmand lan ba ou sou WhatsApp.</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>2.3 Adrès & Katye nan Okap :</strong> Katye, lari, ak repè lokal ou endike yo (pa egzanp : Ri 20 L, Carenage bò pon an, Vertières...) pou moto a ka jwenn ou fasilman.</p>
                  <p style={{ margin: 0 }}><strong>2.4 Done Teknik :</strong> Istwa acha w yo, kalite aparèy (telefòn/òdinatè), ak adrès IP ou pou asire sekirite platfòm lan kont fwòd.</p>
                </div>

                <div style={{
                  background: '#F8FAFC',
                  borderLeft: '4px solid #059669',
                  padding: '14px 18px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.875rem',
                  marginTop: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#059669', marginBottom: 4 }}>
                    <IconCheckmark />
                    <span>Garanti sou Done Finansyè</span>
                  </div>
                  <span>Nou PA JANM mande, kolekte oswa konsève kòd PIN MonCash, Natcash, oswa modpas bankè w. Tout peman dijital fèt sou rezo sekirize operatè telekominikasyon yo dirèkteman.</span>
                </div>
              </section>

              {/* Privacy Seksyon 3 */}
              <section id="p-sec-3" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>3. Poukisa Nou Itilize Enfòmasyon Sa yo?</h2>
                <p>Done w yo itilize pou rezon sa yo sèlman :</p>
                <ul style={{ paddingLeft: 20, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Pou trete kòmand ou devan Machann patnè a;</li>
                  <li>Pou pèmèt Kousye moto a livre pake a nan men w rapidman;</li>
                  <li>Pou voye notifikasyon kòmand ba ou an tan reyèl (prepare, kousye sou wout, livre);</li>
                  <li>Pou trete nenpòt reklamasyon oswa ranbousman rapid;</li>
                  <li>Pou verifye e amelyore vitès sèvis la nan diferan katye vil Okap.</li>
                </ul>
              </section>

              {/* Privacy Seksyon 4 */}
              <section id="p-sec-4" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>4. Pataje Done ak Kousye & Pa Gen Revant Done</h2>
                <p>
                  <strong>Nou pa janm vann, lwe, oswa pataje done pèsonèl ou ak okenn konpayi ekstèn pou piblisite.</strong>
                </p>
                <p>
                  Sèl moun ki resevwa adrès ak telefòn ou se <strong>Kousye verifye</strong> ki pran misyon livrezon espesifik sa a. Kousye a gen entèdiksyon fòmèl pou l itilize nimewo w la pou nenpòt lòt rezon apre livrezon an fin fèt. Nenpòt kousye ki vyole prensip sa a revoked sou platfòm lan imedyatman.
                </p>
              </section>

              {/* Privacy Seksyon 5 */}
              <section id="p-sec-5" style={{ marginBottom: 36 }}>
                <h2 style={sectionHeadingStyle}>5. Sekirite Transmisyon & Stockage</h2>
                <p>
                  Tout echanj enfòmasyon ant telefòn ou ak sèvè Delivery Lakay yo chifre ak teknoloji <strong>SSL/TLS (HTTPS)</strong>. Done yo estoke sou sèvè ki pwoteje ak mekanis sekirite modèn. Nou aplike verifikasyon strik sou ki manm ekip dispatch ki gen otorizasyon pou gade lòd yo.
                </p>
              </section>

              {/* Privacy Seksyon 6 */}
              <section id="p-sec-6">
                <h2 style={sectionHeadingStyle}>6. Dwa Kliyan & Efase Kont</h2>
                <p>
                  Ou rete mèt done w yo tout tan. Ou gen dwa :
                </p>
                <ul style={{ paddingLeft: 20, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Mande ki enfòmasyon nou genyen sou ou nan sistèm lan;</li>
                  <li>Modifye non, adrès, oswa nimewo telefòn ou nan pwofil ou;</li>
                  <li>Mande pou nou efase kont ou ak tout istwa w yo nèt nan baz done nou an.</li>
                </ul>
                <p>
                  Pou egzèse dwa sa yo, ou mèt voye yon senp mesaj bay ekip sipò nou an sou WhatsApp sou <strong>+509 40 55 36 36</strong> oswa kontakte dispatch la dirèkteman.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* ── Official Institutional Footer Card ── */}
      <footer style={{
        marginTop: 40,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#0F172A', marginBottom: 2 }}>
            Sèvis Legal & Relasyon Kliyan Delivery Lakay Haïti
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Pou nenpòt kesyon sou kloz sa yo, kontakte ekip dispatch santral la nan Cap-Haïtien.
          </div>
        </div>

        <a
          href="https://wa.me/50940553636?text=Bonjou,%20mwen%20gen%20yon%20kesyon%20sou%20dokiman%20legal%20Delivery%20Lakay"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '0.8125rem',
            padding: '10px 18px',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
          onMouseLeave={e => e.currentTarget.style.background = '#0F172A'}
        >
          <IconWhatsApp size={16} color="#25D366" />
          <span>Kontakte Dispatch sou WhatsApp</span>
        </a>
      </footer>
    </div>
  )
}

// ── Shared Styling Constants for Editorial Document Polish ─────
const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#0F172A',
  margin: '0 0 14px 0',
  letterSpacing: '-0.3px',
  paddingBottom: 8,
  borderBottom: '1px solid #F1F5F9'
}

const clauseBoxStyle: React.CSSProperties = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '16px 20px',
  margin: '12px 0 16px 0',
  fontSize: '0.875rem',
  color: '#334155',
  lineHeight: 1.65
}

const navLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#475569',
  cursor: 'pointer',
  padding: '4px 0',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.8125rem',
  transition: 'color 0.15s ease'
}
