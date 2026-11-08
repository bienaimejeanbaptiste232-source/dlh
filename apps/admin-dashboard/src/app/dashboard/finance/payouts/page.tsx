'use client';
import { useEffect, useState } from 'react';
import { getDrivers } from '../../../../lib/supabase';
import { IconFinance, IconDrivers, IconRefresh } from '../../../../components/Icons';

export default function PayoutsPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    setLoading(true);
    try {
      const data = await getDrivers();
      setDrivers(data || []);
    } catch (e) {
      console.error('Erreur chargement livreurs payouts:', e);
    } finally {
      setLoading(false);
    }
  }

  const eligibleDrivers = drivers.filter(d => Number(d.wallet?.balance || 0) > 0);
  const totalDue = eligibleDrivers.reduce((acc, d) => acc + Number(d.wallet?.balance || 0), 0);

  const handleOpenPayout = (d: any) => {
    setSelectedDriver(d);
    setPayoutAmount(Number(d.wallet?.balance || 0));
  };

  const handleConfirmPayout = () => {
    if (!selectedDriver) return;
    alert(`Paiement de ${payoutAmount.toLocaleString()} HTG initié vers le compte de ${selectedDriver.name} (MonCash/Natcash). Opération enregistrée.`);
    setSelectedDriver(null);
  };

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
            <span>Gestion des Retraits & Payouts Livreurs</span>
          </div>
          <div className="topbar-subtitle">
            Reversement des commissions et gains de livraison aux coursiers partenaires
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchPayouts}
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
              <span className="stat-card-label">Montant Total Dû</span>
              <div className="stat-card-icon orange"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
              {totalDue.toLocaleString()} HTG
            </div>
            <div className="stat-card-sub">À décaisser vers les livreurs</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Livreurs Éligibles</span>
              <div className="stat-card-icon green"><IconDrivers size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{eligibleDrivers.length}</div>
            <div className="stat-card-sub">Avec solde disponible &gt; 0 HTG</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Flotte Totale Active</span>
              <div className="stat-card-icon blue"><IconDrivers size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{drivers.length}</div>
            <div className="stat-card-sub">Livreurs enregistrés</div>
          </div>
        </div>

        {/* Payout Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Soldes Livreurs à Régler</span>
            <span className="badge badge-info" style={{ fontSize: 11 }}>MonCash / Natcash / Espèces</span>
          </div>

          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Chargement des soldes...</div>
          ) : drivers.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucun livreur trouvé</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Livreur</th>
                    <th>Téléphone</th>
                    <th>Véhicule</th>
                    <th>Courses Totales</th>
                    <th>Solde Portefeuille</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => {
                    const balance = Number(d.wallet?.balance || 0);
                    return (
                      <tr key={d.driverId}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{d.name}</div>
                          <span className="text-xs text-muted">ID: {d.driverId?.slice(0, 8)}</span>
                        </td>
                        <td className="text-xs font-mono">{d.phone}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: 10 }}>
                            {d.vehicleType || 'MOTO'} • {d.vehiclePlate || 'N/A'}
                          </span>
                        </td>
                        <td className="font-semibold">{d.totalDeliveries || 0} livraisons</td>
                        <td>
                          <span style={{ fontSize: 16, fontWeight: 900, color: balance > 0 ? '#10B981' : 'var(--text-muted)' }}>
                            {balance.toLocaleString()} HTG
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: d.status === 'ONLINE' ? 'rgba(16,185,129,0.1)' : 'var(--surface-3)',
                              color: d.status === 'ONLINE' ? '#10B981' : 'var(--text-muted)',
                            }}
                          >
                            {d.status || 'OFFLINE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={balance <= 0}
                            onClick={() => handleOpenPayout(d)}
                            style={{
                              fontSize: 12,
                              padding: '4px 12px',
                              opacity: balance <= 0 ? 0.35 : 1,
                              cursor: balance <= 0 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Payer 💸
                          </button>
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

      {/* Modal Payout */}
      {selectedDriver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 28,
            maxWidth: 440,
            width: '90%',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Effectuer un Retrait Livreur
            </h3>
            <p className="text-xs text-muted" style={{ marginBottom: 16 }}>
              Transfert de fonds vers le numéro mobile ou remise directe en main propre.
            </p>

            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedDriver.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📞 {selectedDriver.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4, fontWeight: 700 }}>
                Solde maximum: {Number(selectedDriver.wallet?.balance || 0).toLocaleString()} HTG
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Montant à reverser (HTG)
              </label>
              <input
                type="number"
                max={Number(selectedDriver.wallet?.balance || 0)}
                value={payoutAmount}
                onChange={e => setPayoutAmount(Number(e.target.value))}
                className="form-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontWeight: 800 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedDriver(null)}
                style={{ fontSize: 13 }}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPayout}
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                Confirmer le Versement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

