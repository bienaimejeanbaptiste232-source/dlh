'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { IconFinance, IconRefresh } from '../../../../components/Icons';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          user:users(id, firstName, lastName, phoneNumber, role, email)
        `)
        .order('balance', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWallets(data || []);
    } catch (e) {
      console.error('Erreur chargement wallets:', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = wallets.filter(w => {
    const q = searchTerm.toLowerCase();
    const uName = `${w.user?.firstName || ''} ${w.user?.lastName || ''}`.toLowerCase();
    const phone = (w.user?.phoneNumber || '').toLowerCase();
    return uName.includes(q) || phone.includes(q) || w.id.includes(q);
  });

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);
  const frozenCount = wallets.filter(w => w.isFrozen).length;
  const positiveWallets = wallets.filter(w => Number(w.balance || 0) > 0).length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}>
              <IconFinance size={18} color="#FFFFFF" />
            </div>
            <span>Portefeuilles Électroniques (Wallets)</span>
          </div>
          <div className="topbar-subtitle">
            Soldes des livreurs et clients sur la plateforme Delivery Haiti
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchWallets}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Encours Total (Solde Global)</span>
              <div className="stat-card-icon green"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              {totalBalance.toLocaleString()} HTG
            </div>
            <div className="stat-card-sub">Somme des soldes en circulation</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Portefeuilles Actifs</span>
              <div className="stat-card-icon blue"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{wallets.length}</div>
            <div className="stat-card-sub">{positiveWallets} avec solde positif</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Portefeuilles Bloqués</span>
              <div className="stat-card-icon pink"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: frozenCount > 0 ? 'var(--primary)' : 'inherit' }}>
              {frozenCount}
            </div>
            <div className="stat-card-sub">Statut gelé / suspendu</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Rechercher par nom d'utilisateur, téléphone ou ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{
              maxWidth: 400,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: '#FFFFFF',
            }}
          />
        </div>

        {/* Wallets Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Comptes et Soldes</span>
            <span className="badge badge-info" style={{ fontSize: 11 }}>{filtered.length} comptes</span>
          </div>

          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Chargement des portefeuilles...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucun portefeuille trouvé</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Titulaire</th>
                    <th>Rôle</th>
                    <th>Téléphone</th>
                    <th>Solde Disponible</th>
                    <th>Devise</th>
                    <th>Statut</th>
                    <th>Dernière Maj</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(w => {
                    const balance = Number(w.balance || 0);
                    const userName = w.user ? `${w.user.firstName || ''} ${w.user.lastName || ''}`.trim() : 'Utilisateur Inconnu';
                    return (
                      <tr key={w.id}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                            {userName}
                          </div>
                          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                            {w.user?.email || w.userId?.slice(0, 10)}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: w.user?.role === 'DRIVER' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                              color: w.user?.role === 'DRIVER' ? '#3B82F6' : '#F59E0B',
                            }}
                          >
                            {w.user?.role || 'CLIENT'}
                          </span>
                        </td>
                        <td className="text-xs font-mono">{w.user?.phoneNumber || '—'}</td>
                        <td>
                          <span style={{ fontSize: 16, fontWeight: 900, color: balance > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="font-mono text-xs font-bold">{w.currency || 'HTG'}</td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 10,
                              background: !w.isFrozen ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: !w.isFrozen ? '#10B981' : '#EF4444',
                            }}
                          >
                            {!w.isFrozen ? '✓ Actif' : '🔒 Gelé'}
                          </span>
                        </td>
                        <td className="text-xs text-muted">
                          {new Date(w.updatedAt || w.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

