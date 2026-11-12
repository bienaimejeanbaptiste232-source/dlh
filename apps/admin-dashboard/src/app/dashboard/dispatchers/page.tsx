'use client';
import { useState, useEffect } from 'react';
import {
  getDispatchers,
  createDispatcher,
  updateDispatcher,
  deleteDispatcher,
  DispatcherAccount,
} from '../../../lib/adminAuth';
import { IconDrivers, IconOrders, IconCheck, IconRefresh } from '../../../components/Icons';

export default function DispatchersManagementPage() {
  const [dispatchers, setDispatchers] = useState<DispatcherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPassModalOpen, setEditPassModalOpen] = useState<DispatcherAccount | null>(null);

  // New Dispatcher Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+509');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Password State
  const [newPassword, setNewPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  async function loadList() {
    setLoading(true);
    try {
      const list = await getDispatchers();
      setDispatchers(list);
    } catch (err: any) {
      console.error('Erè chajman dispatchers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);
    try {
      const created = await createDispatcher({
        fullName,
        username,
        phone,
        password,
      });
      setSuccessMsg(`✅ Kont dispatch pou "${created.fullName}" kreye avèk siksè!`);
      setFullName('');
      setUsername('');
      setPhone('+509');
      setPassword('');
      setModalOpen(false);
      await loadList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erè pandan kreyasyon kont dispatch la.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(dispatcher: DispatcherAccount) {
    try {
      await updateDispatcher(dispatcher.id, { isActive: !dispatcher.isActive });
      await loadList();
    } catch (err: any) {
      alert(`Erè: ${err.message}`);
    }
  }

  async function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!editPassModalOpen || !newPassword.trim()) return;
    setUpdatingPass(true);
    try {
      await updateDispatcher(editPassModalOpen.id, { password: newPassword.trim() });
      setSuccessMsg(`✅ Nouvo modpas anrejistre pou ${editPassModalOpen.fullName}.`);
      setEditPassModalOpen(null);
      setNewPassword('');
      await loadList();
    } catch (err: any) {
      alert(`Erè: ${err.message}`);
    } finally {
      setUpdatingPass(false);
    }
  }

  async function handleDelete(dispatcher: DispatcherAccount) {
    if (!window.confirm(`Èske ou sèten ou vle efase kont dispatch "${dispatcher.fullName}" (${dispatcher.username})?`)) {
      return;
    }
    try {
      await deleteDispatcher(dispatcher.id);
      await loadList();
      setSuccessMsg(`Kont "${dispatcher.fullName}" efase.`);
    } catch (err: any) {
      alert(`Erè pandan sipresyon: ${err.message}`);
    }
  }

  const activeCount = dispatchers.filter((d) => d.isActive).length;
  const inactiveCount = dispatchers.length - activeCount;

  return (
    <div className="dashboard-content" style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.75rem' }}>🎧</span>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
              Ekip Dispatch (Opérateurs & Gestionnaires)
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Kreye epi jere kont itilizatè limite ki responsab asiyasyon kòmand sou teren an.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setModalOpen(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #FF6000 0%, #EA580C 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            padding: '12px 22px',
            fontSize: '0.875rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255, 96, 0, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>➕</span>
          <span>Kreye Nouvo Dispatcher</span>
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <div style={{ background: 'var(--card-bg, #FFFFFF)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Total Operatè Dispatch
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {dispatchers.length}
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #FFFFFF)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#16A34A' }}>
            Operatè Aktif
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16A34A', marginTop: 4 }}>
            {activeCount}
          </div>
        </div>

        <div style={{ background: 'var(--card-bg, #FFFFFF)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Operatè Inaktif
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-muted)', marginTop: 4 }}>
            {inactiveCount}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {successMsg && (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          color: '#166534',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: '0.875rem',
          fontWeight: 700,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Dispatchers List / Table ── */}
      <div style={{
        background: 'var(--card-bg, #FFFFFF)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 28,
      }}>
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Lis Operatè ki gen Aksè Dispatch
          </h2>
          <button
            onClick={loadList}
            title="Rafrechi lis la"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              fontWeight: 700,
            }}
          >
            <IconRefresh size={14} /> Rafrechi
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Ap chaje lis ekip dispatch la...</p>
          </div>
        ) : dispatchers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎧</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Pa gen okenn kont dispatch ki kreye ankò
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 20px' }}>
              Klike sou bouton ki anba a pou kreye premye operatè ki pral jere asiyasyon kòmand yo.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: '#FF6000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ➕ Kreye Premye Dispatcher a
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-subtle, #F8FAFC)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Operatè</th>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Non Itilizatè (Username)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Telefòn</th>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Wòl & Aksè</th>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Eta</th>
                  <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>Aksyon</th>
                </tr>
              </thead>
              <tbody>
                {dispatchers.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(255, 96, 0, 0.12)',
                          color: '#FF6000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                        }}>
                          {d.fullName[0]?.toUpperCase() || 'D'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{d.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Kreye: {new Date(d.createdAt).toLocaleDateString('fr-HT')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: 'var(--surface-subtle, #F1F5F9)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        color: '#0F172A',
                      }}>
                        {d.username}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {d.phone || '—'}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#4F46E5',
                        padding: '4px 9px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}>
                        OPERATEUR DISPATCH
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <button
                        onClick={() => handleToggleStatus(d)}
                        style={{
                          background: d.isActive ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: d.isActive ? '#16A34A' : '#EF4444',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        title="Klike pou chanje eta"
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.isActive ? '#16A34A' : '#EF4444' }} />
                        <span>{d.isActive ? 'Aktif' : 'Dezaktive'}</span>
                      </button>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => {
                            setEditPassModalOpen(d);
                            setNewPassword('');
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            borderRadius: 8,
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🔑 Modpas
                        </button>

                        <button
                          onClick={() => handleDelete(d)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#DC2626',
                            borderRadius: 8,
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Information Card on Dispatch Permissions ── */}
      <div style={{
        background: 'var(--card-bg, #FFFFFF)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '22px 24px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛡️</span>
          <span>Règ & Limitasyon Sekirite Kont Dispatch yo</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
          <div style={{ background: '#F0FDF4', padding: '14px 16px', borderRadius: 12, border: '1px solid #BBF7D0' }}>
            <div style={{ color: '#166534', fontWeight: 800, fontSize: '0.8125rem', marginBottom: 4 }}>
              ✅ Sa yo ka fè (Otorizasyon):
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8125rem', color: '#166534', lineHeight: 1.6 }}>
              <li>Asiyen kòmand bay livreur sou Centre Dispatch.</li>
              <li>Swiv pozisyon livreur yo sou Carte en direct.</li>
              <li>Wè lis livreur ki disponib ak nimewo telefòn yo.</li>
              <li>Verifye estati kòmand an kous yo.</li>
            </ul>
          </div>

          <div style={{ background: '#FEF2F2', padding: '14px 16px', borderRadius: 12, border: '1px solid #FECACA' }}>
            <div style={{ color: '#991B1B', fontWeight: 800, fontSize: '0.8125rem', marginBottom: 4 }}>
              🔒 Sa yo PA ka fè (Restriksyon):
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8125rem', color: '#991B1B', lineHeight: 1.6 }}>
              <li>Pa gen aksè sou Finans, Retraits, ni Payouts.</li>
              <li>Pa gen aksè sou chanje Tarification ni Pri km.</li>
              <li>Pa gen aksè sou chanje Modpas Admin prensipal la.</li>
              <li>Pa gen aksè sou jesyon machann ni konfigirasyon sistèm.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── MODAL: KREYE YON NOUVO DISPATCHER ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--card-bg, #FFFFFF)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 480,
            padding: '28px 24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                ➕ Nouvo Operatè Dispatch
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: '0.8125rem', fontWeight: 700, marginBottom: 16 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Non Konplè *
                </label>
                <input
                  type="text"
                  placeholder="egz: Jean Paul Pierre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Non Itilizatè (Username pou l konekte) *
                </label>
                <input
                  type="text"
                  placeholder="egz: dispatch_okap1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>
                  Sa se non li pral tape sou paj login lan
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nimewo Telefòn
                </label>
                <input
                  type="text"
                  placeholder="+509 37 00 1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Modpas Inisyal *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    background: '#FF6000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Ap kreye...' : 'Kreye Kont Dispatch la'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 18px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Anile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHANJE MODPAS DISPATCHER ── */}
      {editPassModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--card-bg, #FFFFFF)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 420,
            padding: '24px 22px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Chanje Modpas pou {editPassModalOpen.fullName}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Username: <strong>{editPassModalOpen.username}</strong>
            </p>

            <form onSubmit={handleSaveNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nouvo Modpas *
                </label>
                <input
                  type="password"
                  placeholder="Tape nouvo modpas la"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={updatingPass}
                  style={{
                    flex: 1,
                    background: '#FF6000',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: updatingPass ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updatingPass ? 'Ap sovgade...' : 'Anrejistre Modpas'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditPassModalOpen(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '11px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Anile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
