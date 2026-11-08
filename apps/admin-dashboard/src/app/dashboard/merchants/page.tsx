'use client';
import { useEffect, useState } from 'react';
import { getMerchants, toggleMerchantStatus } from '../../../lib/supabase';
import { IconMerchants, IconCheck, IconRefresh } from '../../../components/Icons';

// ── Inline SVG Icons (Zero Emojis) ──────────────────────────────
const IcMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={13} height={13} strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={13} height={13} strokeLinecap="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcZone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={13} height={13} strokeLinecap="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);
const IcUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={14} height={14} strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcStore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22} strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={13} height={13} strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcPercent = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={13} height={13} strokeLinecap="round">
    <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const IcSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={15} height={15} strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={14} height={14} strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcBan = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14} strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);
const IcDot = ({ color }: { color: string }) => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
);

// ── Type label map (no emoji) ────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restoran',
  SUPERMARKET: 'Sipèmache',
  GROCERY: 'Episri',
  PHARMACY: 'Famasi',
  CONSTRUCTION: 'Materyo',
  HARDWARE: 'Zouti',
  BAKERY: 'Boulanjri',
  FAST_FOOD: 'Fast Food',
  BEVERAGE_DEPOT: 'Dépôt Bwason',
};

// ── Type accent colors ───────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  RESTAURANT:     { bg: '#FFF3EB', text: '#FF6000' },
  FAST_FOOD:      { bg: '#FFF3EB', text: '#FF6000' },
  SUPERMARKET:    { bg: '#EFF6FF', text: '#2563EB' },
  GROCERY:        { bg: '#F0FDF4', text: '#16A34A' },
  PHARMACY:       { bg: '#F0FDF4', text: '#059669' },
  CONSTRUCTION:   { bg: '#FEF3C7', text: '#D97706' },
  HARDWARE:       { bg: '#FEF3C7', text: '#B45309' },
  BAKERY:         { bg: '#FDF2F8', text: '#9333EA' },
  BEVERAGE_DEPOT: { bg: '#EFF6FF', text: '#0EA5E9' },
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMerchants();
    const interval = setInterval(fetchMerchants, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMerchants() {
    try {
      const data = await getMerchants();
      setMerchants(data);
    } catch (err) {
      console.error('Supabase merchants error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, current: boolean, merchantName: string) {
    setActionLoading(id);
    try {
      await toggleMerchantStatus(id, !current);
      await fetchMerchants();
      const actionTxt = !current
        ? `"${merchantName}" apwouve avèk siksè`
        : `"${merchantName}" dezaktive`;
      setSuccessMessage(actionTxt);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      alert('Erè pandan mizajou a nan Supabase.');
    } finally {
      setActionLoading(null);
    }
  }

  const types = ['ALL', ...Array.from(new Set(merchants.map(m => m.type).filter(Boolean)))];
  const pendingMerchants = merchants.filter(m => !m.isVerified);
  const verifiedMerchants = merchants.filter(m => m.isVerified);

  const filtered = merchants.filter(m => {
    const matchType = selectedType === 'ALL' || m.type === selectedType;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && !m.isVerified) ||
      (statusFilter === 'VERIFIED' && m.isVerified);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.address?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.owner?.firstName?.toLowerCase().includes(q) ||
      m.owner?.lastName?.toLowerCase().includes(q);
    return matchType && matchStatus && matchSearch;
  });

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div>
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <IconMerchants size={18} color="#FFFFFF" />
            </div>
            <span>Gestion des Marchands & Boutiques</span>
          </div>
          <div className="topbar-subtitle">
            Validasyon & Devalidasyon Machann &bull; {merchants.length} établissements répertoriés
          </div>
        </div>
        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchMerchants}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="page-container">

        {/* ── Toast siksè ── */}
        {successMessage && (
          <div style={{
            padding: '11px 16px',
            borderRadius: 10,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#15803D',
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IcCheckCircle />
            </div>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ── Banner demann an atant ── */}
        {pendingMerchants.length > 0 && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1E2433 0%, #252D3D 100%)',
            borderLeft: '4px solid #F59E0B',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(245,158,11,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#F59E0B', flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={18} height={18}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: 13, marginBottom: 3 }}>
                  {pendingMerchants.length} nouvo demann enskripsyon machann ap tann validasyon
                  <span style={{ marginLeft: 8, background: '#F59E0B', color: '#000', fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 20 }}>
                    AKSYON REKÒMANDE
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  Nouvo restoran/boutik ki kreye kont yo sou app Machann nan — apwouve yo pou yo kapab vann.
                </div>
              </div>
            </div>
            <button
              className="btn btn-sm"
              style={{
                background: '#F59E0B', color: '#000',
                fontWeight: 800, fontSize: 12, flexShrink: 0,
                padding: '8px 14px', borderRadius: 8,
                boxShadow: '0 3px 10px rgba(245,158,11,0.35)',
              }}
              onClick={() => setStatusFilter('PENDING')}
            >
              Wè {pendingMerchants.length} demann
            </button>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Machann', value: merchants.length, color: '#FF6000', bg: '#FFF3EB', filter: 'ALL' as const },
            { label: 'An Atant Validasyon', value: pendingMerchants.length, color: '#F59E0B', bg: '#FFFBEB', filter: 'PENDING' as const, urgent: pendingMerchants.length > 0 },
            { label: 'Valide / Apwouve', value: verifiedMerchants.length, color: '#10B981', bg: '#F0FDF4', filter: 'VERIFIED' as const },
            { label: 'Ouvri Kounye a', value: merchants.filter(m => m.isOpen).length, color: '#6366F1', bg: '#EEF2FF', filter: 'ALL' as const },
          ].map(s => {
            const isSelected = statusFilter === s.filter && !(s.filter === 'ALL' && statusFilter !== 'ALL');
            return (
              <div
                key={s.label}
                className="stat-card"
                onClick={() => setStatusFilter(s.filter)}
                style={{
                  padding: '16px 18px',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${s.color}` : '1px solid var(--border-subtle)',
                  boxShadow: s.urgent ? `0 0 0 3px ${s.color}22` : undefined,
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {s.label}
                  </span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth={2} width={15} height={15}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* ── Filters Bar ── */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { key: 'ALL', label: `Tout (${merchants.length})` },
                { key: 'PENDING', label: `An Atant (${pendingMerchants.length})`, warn: true },
                { key: 'VERIFIED', label: `Valide (${verifiedMerchants.length})` },
              ] as { key: 'ALL'|'PENDING'|'VERIFIED'; label: string; warn?: boolean }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: statusFilter === tab.key
                      ? 'none'
                      : tab.warn ? '1.5px solid rgba(245,158,11,0.45)' : '1.5px solid var(--border-subtle)',
                    background: statusFilter === tab.key
                      ? (tab.warn ? '#F59E0B' : tab.key === 'VERIFIED' ? '#10B981' : 'var(--primary-500)')
                      : 'transparent',
                    color: statusFilter === tab.key ? '#fff' : (tab.warn ? '#F59E0B' : 'var(--text-secondary)'),
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <IcSearch />
              </span>
              <input
                type="text"
                placeholder="Non, adrès, responsab, telefòn..."
                className="form-input"
                style={{ paddingLeft: 34, minWidth: 280, maxWidth: 340 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Type chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', scrollbarWidth: 'none' }}>
            {types.map(t => {
              const accent = TYPE_COLORS[t];
              const isActive = selectedType === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: isActive
                      ? `1.5px solid ${accent?.text || 'var(--primary-500)'}`
                      : '1.5px solid var(--border-subtle)',
                    background: isActive
                      ? (accent?.bg || 'var(--surface-2)')
                      : 'transparent',
                    color: isActive
                      ? (accent?.text || 'var(--primary-500)')
                      : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {t === 'ALL' ? 'Tout Tip' : (TYPE_LABELS[t] || t)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Merchant Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <div className="skeleton" style={{ height: 72 }} />
                <div style={{ padding: '16px' }}>
                  <div className="skeleton" style={{ height: 16, borderRadius: 6, marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 6, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
              <IcStore />
            </div>
            <h3 style={{ fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 8px' }}>Okenn machann jwenn</h3>
            <p style={{ fontSize: 13, margin: 0 }}>
              {statusFilter === 'PENDING'
                ? 'Pa gen okenn demann anrejistreman k ap tann validasyon pou kounye a.'
                : 'Les restaurants inscrits via l\'app apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(m => {
              const isPending = !m.isVerified;
              const accent = TYPE_COLORS[m.type] || { bg: '#F8FAFC', text: '#64748B' };
              const isActioning = actionLoading === m.id;
              return (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    overflow: 'hidden',
                    padding: 0,
                    border: isPending
                      ? '1.5px solid rgba(245,158,11,0.45)'
                      : '1px solid var(--border-subtle)',
                    boxShadow: isPending
                      ? '0 4px 20px rgba(245,158,11,0.12)'
                      : '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  {/* ── Card Header ── */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    background: isPending
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,191,36,0.04) 100%)'
                      : 'var(--surface-2)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                      background: accent.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${accent.text}22`,
                    }}>
                      <IcStore />
                    </div>

                    {/* Name + type */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 800, fontSize: 15,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 3,
                      }}>
                        {m.name}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        background: accent.bg, color: accent.text,
                        fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 6,
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                        border: `1px solid ${accent.text}33`,
                      }}>
                        {TYPE_LABELS[m.type] || m.type}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, alignItems: 'flex-end' }}>
                      {m.isVerified ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#F0FDF4', color: '#15803D',
                          fontSize: 10, fontWeight: 800,
                          padding: '3px 8px', borderRadius: 20,
                          border: '1px solid #BBF7D0',
                        }}>
                          <IcCheckCircle /> Valide
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                          fontSize: 10, fontWeight: 800,
                          padding: '3px 8px', borderRadius: 20,
                          border: '1px solid rgba(245,158,11,0.35)',
                        }}>
                          <IcClock /> An Atant
                        </span>
                      )}
                      {m.isOpen ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#F0FDF4', color: '#16A34A',
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 7px', borderRadius: 20,
                        }}>
                          <IcDot color="#22C55E" /> Ouvri
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'var(--surface-3)', color: 'var(--text-muted)',
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 7px', borderRadius: 20,
                        }}>
                          <IcDot color="#94A3B8" /> Fèmen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Card Body ── */}
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Info rows */}
                    {m.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><IcMapPin /></span>
                        <span>{m.address}</span>
                      </div>
                    )}
                    {m.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><IcPhone /></span>
                        <span style={{ fontWeight: 700 }}>{m.phone}</span>
                      </div>
                    )}
                    {m.zone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><IcZone /></span>
                        <span>{m.zone.name}</span>
                      </div>
                    )}

                    {/* Owner row */}
                    {m.owner && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--surface-2)',
                        padding: '9px 12px', borderRadius: 9,
                        marginTop: 2, gap: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--surface-3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', flexShrink: 0,
                          }}>
                            <IcUser />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                              {m.owner.firstName} {m.owner.lastName}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                              Responsab / Pwopryetè
                            </div>
                          </div>
                        </div>
                        {m.owner.phoneNumber && (
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {m.owner.phoneNumber}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Metrics strip */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 0, marginTop: 4,
                      border: '1px solid var(--border-subtle)', borderRadius: 10,
                      overflow: 'hidden',
                    }}>
                      {[
                        {
                          icon: <IcPercent />,
                          value: `${m.commissionRate || 0}%`,
                          label: 'Commission',
                        },
                        {
                          icon: <IcClock />,
                          value: m.avgPrepTimeMinutes ? `${m.avgPrepTimeMinutes}min` : 'N/A',
                          label: 'Prép. moy.',
                        },
                        {
                          icon: m.isVerified
                            ? <IcCheckCircle />
                            : <IcBan />,
                          value: m.isVerified ? 'Aktif' : 'Bloke',
                          label: 'Estati',
                          color: m.isVerified ? '#10B981' : '#F59E0B',
                        },
                      ].map((stat, i) => (
                        <div key={i} style={{
                          padding: '9px 10px', textAlign: 'center',
                          borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                          background: 'var(--surface-2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 3, color: stat.color || 'var(--text-muted)' }}>
                            {stat.icon}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: stat.color || 'var(--text-primary)' }}>
                            {stat.value}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 1 }}>
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Action button ── */}
                    <div style={{ marginTop: 6 }}>
                      {isPending ? (
                        <button
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: isActioning ? '#9CA3AF' : 'linear-gradient(135deg, #22C55E, #16A34A)',
                            color: '#fff',
                            fontWeight: 800, fontSize: 13,
                            border: 'none', borderRadius: 10,
                            cursor: isActioning ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: isActioning ? 'none' : '0 4px 14px rgba(34,197,94,0.32)',
                            transition: 'all 0.18s ease',
                          }}
                          disabled={isActioning}
                          onClick={() => handleToggle(m.id, m.isVerified, m.name)}
                        >
                          {isActioning ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={14} height={14}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                              Mizajou...
                            </>
                          ) : (
                            <>
                              <IcCheckCircle />
                              Apwouve Machann
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          style={{
                            width: '100%',
                            padding: '9px 16px',
                            background: 'transparent',
                            color: isActioning ? '#9CA3AF' : '#EF4444',
                            fontWeight: 700, fontSize: 12,
                            border: `1.5px solid ${isActioning ? '#E2E8F0' : 'rgba(239,68,68,0.35)'}`,
                            borderRadius: 10,
                            cursor: isActioning ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            transition: 'all 0.18s ease',
                          }}
                          disabled={isActioning}
                          onClick={() => handleToggle(m.id, m.isVerified, m.name)}
                        >
                          {isActioning ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={12} height={12}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                              Mizajou...
                            </>
                          ) : (
                            <>
                              <IcBan />
                              Dezaktive Machann
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
