'use client';
import { useEffect, useState } from 'react';
import { getTransactions } from '../../../../lib/supabase';
import { IconFinance, IconRefresh } from '../../../../components/Icons';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    fetchTx();
    const interval = setInterval(fetchTx, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTx() {
    setLoading(true);
    try {
      const data = await getTransactions(150);
      setTransactions(data || []);
    } catch (e) {
      console.error('Erreur transactions:', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const totalCredits = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalDebits = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

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
            <span>Journal des Transactions Portefeuilles</span>
          </div>
          <div className="topbar-subtitle">
            Historique complet des mouvements financiers des livreurs & clients
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchTx}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* KPI Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Total Transactions</span>
              <div className="stat-card-icon blue"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{transactions.length}</div>
            <div className="stat-card-sub">Opérations enregistrées</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Volume Crédits (Entrées)</span>
              <div className="stat-card-icon green"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              +{totalCredits.toLocaleString()} HTG
            </div>
            <div className="stat-card-sub">Gains livreurs & recharges</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Volume Débits (Sorties)</span>
              <div className="stat-card-icon orange"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
              -{totalDebits.toLocaleString()} HTG
            </div>
            <div className="stat-card-sub">Retraits & commissions prélevées</div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'ALL', label: 'Toutes les opérations' },
            { id: 'CREDIT', label: '🟢 Crédits uniquement' },
            { id: 'DEBIT', label: '🔴 Débits uniquement' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className="btn btn-sm"
              style={{
                background: filterType === f.id ? 'var(--primary)' : 'var(--surface-2)',
                color: filterType === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mouvements de Fonds Récents</span>
            <span className="badge badge-info" style={{ fontSize: 11 }}>{filtered.length} affichés</span>
          </div>

          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Chargement des transactions...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucune transaction enregistrée</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & Heure</th>
                    <th>Référence</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Source</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const isCredit = t.type === 'CREDIT';
                    return (
                      <tr key={t.id}>
                        <td className="text-xs text-muted">
                          {new Date(t.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="font-mono text-xs" style={{ fontWeight: 700 }}>
                          {t.reference || t.id?.slice(0, 8)}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: isCredit ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: isCredit ? '#10B981' : '#EF4444',
                            }}
                          >
                            {isCredit ? '↓ CRÉDIT' : '↑ DÉBIT'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, fontSize: 14, color: isCredit ? 'var(--success)' : 'var(--text-primary)' }}>
                          {isCredit ? '+' : '-'}{Number(t.amount || 0).toLocaleString()} HTG
                        </td>
                        <td className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {t.source || 'SYSTÈME'}
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 280 }}>
                          {t.description || '—'}
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

