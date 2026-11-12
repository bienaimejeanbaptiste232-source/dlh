'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminCredentials } from '../../../lib/adminAuth';
import { IconSettings } from '../../../components/Icons';

export default function SettingsSecurityPage() {
  const { user, changeCredentials } = useAuth();
  const [currentUsername, setCurrentUsername] = useState('admin');
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const creds = await getAdminCredentials();
      const uName = creds.username || user?.username || 'admin';
      setCurrentUsername(uName);
      setNewUsername(uName);
      if (creds.updatedAt) {
        setLastUpdated(new Date(creds.updatedAt).toLocaleString('fr-HT', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }));
      }
    } catch (e: any) {
      console.warn('Erè chajman paramèt sekirite:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Tanpri antre modpas aktyèl la pou konfime idantite ou.');
      return;
    }

    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setErrorMsg('Non itilizatè a dwe gen omwen 3 karaktè.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Tanpri antre yon nouvo modpas.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Nouvo modpas la dwe gen omwen 4 karaktè.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Nouvo modpas la ak konfimasyon an pa koresponn.');
      return;
    }

    setSaving(true);
    try {
      await changeCredentials(currentPassword, newUsername.trim(), newPassword.trim());
      setSuccessMsg('✅ Modpas ak non itilizatè a chanje avèk siksè! Ou ka itilize yo kounye a ni lokalman ni lè ou an liy.');
      setCurrentUsername(newUsername.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLastUpdated(new Date().toLocaleString('fr-HT', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Erè pandan anrejistreman nouvo idantifyan yo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-content" style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'rgba(255, 96, 0, 0.12)',
            color: '#FF6000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconSettings />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
              Paramètres & Sekirite Kont Admin
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Jere aksè ak idantifyan administratè pou konekte ni lokalman ni an liy
            </p>
          </div>
        </div>
      </div>

      {/* ── Status Banner Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {/* Card 1: Current Username */}
        <div style={{
          background: 'var(--card-bg, #FFFFFF)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            Non Itilizatè Aktyèl
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FF6000', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{currentUsername}</span>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              background: 'rgba(22, 163, 74, 0.12)',
              color: '#16A34A',
              padding: '3px 8px',
              borderRadius: 20,
            }}>
              AKTIF
            </span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Wòl: <strong>SUPER_ADMIN (Aksè Konplè)</strong>
          </div>
        </div>

        {/* Card 2: Sync Status */}
        <div style={{
          background: 'var(--card-bg, #FFFFFF)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            Eta Senkronizasyon
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#16A34A', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🌐 An Liy & Lokal</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {lastUpdated ? `Dènye modifikasyon: ${lastUpdated}` : 'Konekte sou Supabase Cloud'}
          </div>
        </div>
      </div>

      {/* ── Main Edit Form Box ── */}
      <div style={{
        background: 'var(--card-bg, #FFFFFF)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '28px 24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 28,
      }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Chanje Non Itilizatè & Modpas
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Lè ou chanje enfòmasyon sa yo, w ap itilize nouvo non itilizatè ak modpas la pou w konekte sou nenpòt navigatè oswa aparèy.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            borderRadius: 12,
            padding: '14px 18px',
            fontSize: '0.875rem',
            fontWeight: 700,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            borderRadius: 12,
            padding: '14px 18px',
            fontSize: '0.875rem',
            fontWeight: 700,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Row 1: Username */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Nouvo Non Itilizatè (Username) *
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  background: 'var(--surface, #FFFFFF)',
                }}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="egz: admin, superadmin, jean..."
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Sa se non w ap tape sou paj koneksyon an (Inisyal: <strong>admin</strong>)
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Ansyen Modpas (Mot de passe actuel) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  style={{ background: 'none', border: 'none', color: '#FF6000', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  {showCurrent ? 'Kache' : 'Montre'}
                </button>
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  background: 'var(--surface, #FFFFFF)',
                }}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Antre ansyen modpas la (inisyal: admin)"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Si w pa janm chanje l, modpas inisyal la se: <strong>admin</strong>
              </span>
            </div>
          </div>

          {/* Row 2: New Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Nouvo Modpas (Nouveau mot de passe) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  style={{ background: 'none', border: 'none', color: '#FF6000', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  {showNew ? 'Kache' : 'Montre'}
                </button>
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  background: 'var(--surface, #FFFFFF)',
                }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tape nouvo modpas ou chwazi a"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Omwen 4 karaktè pou sekirite
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Konfime Nouvo Modpas la *
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  style={{ background: 'none', border: 'none', color: '#FF6000', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  {showConfirm ? 'Kache' : 'Montre'}
                </button>
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  background: 'var(--surface, #FFFFFF)',
                }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Tape nouvo modpas la ankò"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Dwe idantik ak nouvo modpas la
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #FF6000 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '13px 28px',
                fontSize: '0.9375rem',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(255, 96, 0, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  <span>Ap anrejistre...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Anrejistre Chanjman Yo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '13px 20px',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Anile
            </button>
          </div>
        </form>
      </div>

      {/* ── Security Advice & Help ── */}
      <div style={{
        background: 'rgba(255, 96, 0, 0.04)',
        border: '1px solid rgba(255, 96, 0, 0.2)',
        borderRadius: 16,
        padding: '20px 22px',
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FF6000', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span>
          <span>Konsèy Sekirite & Enfòmasyon Sèvè</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          Modpas ak non itilizatè sa yo konekte dirèkteman sou sèvè Supabase sekirize a. Lè ou chanje yo, yo aplikab otomatikman kit ou konekte sou <strong>localhost</strong> sou òdinatè w, kit ou konekte sou <strong>telefòn ou oswa an liy</strong> sou domèn piblik ou.
        </p>
      </div>
    </div>
  );
}
