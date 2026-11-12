'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(identifier, password);
      if (loggedUser?.role === 'DISPATCHER') {
        router.push('/dashboard/dispatch');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erè koneksyon. Tanpri verifye idantifyan ou.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card fade-in-up">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ overflow: 'hidden', padding: 2, background: '#FFFFFF' }}>
            <img
              src="/logo.png"
              alt="Delivery Lakay"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback SVG if logo image is not found
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 style={{ letterSpacing: '-0.5px' }}>Delivery Lakay</h1>
          <p>Panèl Kontwòl Administrasyon</p>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">
              Non Itilizatè / Email
            </label>
            <input
              id="identifier"
              className="form-input"
              type="text"
              placeholder="admin"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">
                Modpas
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: 6,
                }}
              >
                {showPassword ? 'Kache' : 'Montre'}
              </button>
            </div>
            <input
              id="password"
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner" /> Ap konekte...
              </span>
            ) : (
              'Konekte sou Panèl la'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Delivery Lakay &copy; 2026 &bull; Aksè Sekirize
          </p>
        </div>
      </div>
    </div>
  );
}
