'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card fade-in-up">
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} width={28} height={28} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          <h1>Delivery Haiti</h1>
          <p>Tableau de bord administrateur</p>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">Téléphone ou Email</label>
            <input
              id="identifier"
              className="form-input"
              type="text"
              placeholder="+50940553636 ou admin@..."
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner" /> Connexion...
              </span>
            ) : '🔐 Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--surface-3)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comptes de test</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>👑 Super Admin: <strong>+50940553636</strong></p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💰 Finance: <strong>+50937000002</strong></p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Mot de passe: <strong>Password123!</strong></p>
        </div>
      </div>
    </div>
  );
}
