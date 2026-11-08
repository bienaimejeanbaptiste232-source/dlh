'use client';
import { useEffect, useState } from 'react';
import { supabase, getZones, toggleZoneStatus } from '../../../lib/supabase';
import { IconZones, IconFinance, IconRefresh } from '../../../components/Icons';

export default function PricingPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Simulator state
  const [simZoneId, setSimZoneId] = useState<string>('');
  const [simKm, setSimKm] = useState<number>(3.5);
  const [simQuantity, setSimQuantity] = useState<number>(1);
  const [simCategory, setSimCategory] = useState<string>('RESTAURANT');
  const [isNight, setIsNight] = useState<boolean>(false);
  const [simBreakdown, setSimBreakdown] = useState<any | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  async function fetchPricing() {
    setLoading(true);
    try {
      const data = await getZones();
      setZones(data || []);
      if (data && data.length > 0 && !simZoneId) {
        setSimZoneId(data[0].id);
      }
    } catch (err) {
      console.error('Erreur chargement tarification:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdatePrice = async (zone: any, baseFee: number, perKmFee: number, nightSurcharge: number) => {
    setSavingId(zone.id);
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ baseFee, perKmFee, nightSurcharge, updatedAt: new Date().toISOString() })
        .eq('id', zone.id);
      if (error) throw error;
      await fetchPricing();
    } catch (e: any) {
      alert('Erreur: ' + (e?.message || 'Impossible de mettre à jour'));
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = async (zone: any) => {
    try {
      await toggleZoneStatus(zone.id, !zone.isActive);
      await fetchPricing();
    } catch (e) {
      alert('Erreur activation/désactivation');
    }
  };

  const calculateEstimate = () => {
    const selectedZone = zones.find(z => z.id === simZoneId);
    if (!selectedZone) return;
    const base = Number(selectedZone.baseFee || 150);
    const perKm = Number(selectedZone.perKmFee || 35);
    const night = isNight ? Number(selectedZone.nightSurcharge || 50) : 0;
    
    // 1. Distance (2 premiers km inclus dans la base, +15 HTG/km au delà de 10km)
    const extraKm = Math.max(0, simKm - 2.0);
    const longDistKm = Math.max(0, simKm - 10.0);
    const distFee = base + (extraKm * perKm) + (longDistKm * 15.0);

    // 2. Volume / Quantité (ex: 100 cartons)
    let vol = 0;
    if (simQuantity <= 4) vol = 0;
    else if (simQuantity <= 10) vol = 50;
    else if (simQuantity <= 25) vol = 150;
    else if (simQuantity <= 50) vol = 350;
    else if (simQuantity <= 100) vol = 750;
    else vol = 750 + (simQuantity - 100) * 10;

    // 3. Catégorie de commerce
    let cat = 0;
    if (simCategory === 'SUPERMARKET') cat = 30;
    else if (simCategory === 'CARGO') cat = 100;

    const total = Math.round(distFee + vol + cat + night);
    const driverEarnings = Math.round(total * 0.85);
    const platformEarnings = total - driverEarnings;

    setSimBreakdown({
      baseFee: base,
      distanceFee: Math.round(distFee),
      extraKmFee: Math.round(extraKm * perKm),
      longDistFee: Math.round(longDistKm * 15.0),
      volumeSurcharge: vol,
      categorySurcharge: cat,
      nightSurcharge: night,
      totalDeliveryFee: total,
      driverEarnings,
      platformEarnings,
    });
  };

  // Stats
  const activeCount = zones.filter(z => z.isActive).length;
  const avgBase = zones.length ? Math.round(zones.reduce((acc, z) => acc + Number(z.baseFee || 0), 0) / zones.length) : 0;
  const baseFees = zones.map(z => Number(z.baseFee || 0));
  const minBase = baseFees.length ? Math.min(...baseFees) : 0;
  const maxBase = baseFees.length ? Math.max(...baseFees) : 0;

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
            <span>Tarification & Grille de Prix</span>
          </div>
          <div className="topbar-subtitle">
            Configuration des frais de livraison par zone • Cap-Haïtien, Haïti
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchPricing}
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
              <span className="stat-card-label">Zones Couvertes</span>
              <div className="stat-card-icon green"><IconZones size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{activeCount} / {zones.length}</div>
            <div className="stat-card-sub">Zones actives en service</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Tarif de Base Moyen</span>
              <div className="stat-card-icon orange"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{avgBase} HTG</div>
            <div className="stat-card-sub">Moyenne sur toutes les zones</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Écart Tarifs de Base</span>
              <div className="stat-card-icon blue"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{minBase} - {maxBase} HTG</div>
            <div className="stat-card-sub">Min et Max configurés</div>
          </div>
        </div>

        {/* Pricing Simulator */}
        <div className="card" style={{ marginBottom: 28, border: '1.5px solid var(--border-subtle)', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFD 100%)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              🧮 Simulateur de Devis Client
            </span>
            <span className="text-xs text-muted">Test en temps réel du moteur de pricing</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'flex-end', marginTop: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Zone de Livraison
              </label>
              <select
                className="form-input"
                value={simZoneId}
                onChange={e => setSimZoneId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#FFFFFF' }}
              >
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Distance estimée (km)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={simKm}
                onChange={e => setSimKm(parseFloat(e.target.value) || 1)}
                className="form-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Quantité / Boîtes (ex: 100)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="1000"
                value={simQuantity}
                onChange={e => setSimQuantity(parseInt(e.target.value) || 1)}
                className="form-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Catégorie de Marchand
              </label>
              <select
                className="form-input"
                value={simCategory}
                onChange={e => setSimCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#FFFFFF' }}
              >
                <option value="RESTAURANT">Repas / Restaurant (Standard)</option>
                <option value="SUPERMARKET">Supermarché / Épicerie (+30 HTG)</option>
                <option value="CARGO">Cargo / Quincaillerie / Colis (+100 HTG)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
              <input
                type="checkbox"
                id="nightCheck"
                checked={isNight}
                onChange={e => setIsNight(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#EB1700', cursor: 'pointer' }}
              />
              <label htmlFor="nightCheck" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Heure de nuit
              </label>
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={calculateEstimate}
                style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}
              >
                Calculer le tarif
              </button>
            </div>
          </div>

          {simBreakdown && (
            <div style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Détail du Calcul de Devis</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>Modèle Dynamique Multi-Facteurs (Haïti)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Base Distance ({simKm} km)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{simBreakdown.distanceFee} HTG</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>Base {simBreakdown.baseFee} + extra {simBreakdown.extraKmFee} HTG</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Surcharge Volumique ({simQuantity} bwat/atik)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: simBreakdown.volumeSurcharge > 0 ? '#DC2626' : '#059669' }}>
                    +{simBreakdown.volumeSurcharge} HTG
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>
                    {simQuantity >= 51 ? 'Cargaison 100 boîtes / moto dédiée' : simQuantity >= 11 ? 'Grand colis encombrant' : 'Format standard'}
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Type Commerce & Nuit</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    +{simBreakdown.categorySurcharge + simBreakdown.nightSurcharge} HTG
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>Catégorie {simBreakdown.categorySurcharge} HTG • Nuit {simBreakdown.nightSurcharge} HTG</div>
                </div>

                <div style={{ background: 'rgba(235, 23, 0, 0.08)', padding: '10px 14px', borderRadius: 8, border: '1.5px solid rgba(235, 23, 0, 0.3)' }}>
                  <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 700, textTransform: 'uppercase' }}>Frais Total Client</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#EB1700' }}>{simBreakdown.totalDeliveryFee} HTG</div>
                  <div style={{ fontSize: 10, color: '#B91C1C' }}>Total facturé à la livraison</div>
                </div>
              </div>

              {/* Driver & Platform splits */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Part Livreur Garantie (85%)</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#065F46' }}>{simBreakdown.driverEarnings} HTG</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366F1' }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Marge Brute Plateforme (15%)</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#3730A3' }}>{simBreakdown.platformEarnings} HTG</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volume Pricing Matrix Reference */}
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#F1F5F9', borderRadius: 8, fontSize: 12, color: '#475569' }}>
            <span style={{ fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
              Grille des paliers de volume & cartons (Règles Delivery Lakay) :
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span className="badge" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 8px' }}>1 à 4 atik: <strong>+0 HTG</strong></span>
              <span className="badge" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 8px' }}>5 à 10 atik: <strong>+50 HTG</strong></span>
              <span className="badge" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 8px' }}>11 à 25 atik: <strong>+150 HTG</strong></span>
              <span className="badge" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 8px' }}>26 à 50 atik: <strong>+350 HTG</strong></span>
              <span className="badge" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '4px 8px' }}>51 à 100 bwat/atik: <strong>+750 HTG</strong> (100 boîtes)</span>
              <span className="badge" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '4px 8px' }}>&gt; 100 atik: <strong>+750 HTG + 10 HTG/atik</strong></span>
            </div>
          </div>
        </div>

        {/* Pricing Table / Grid */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Grille Tarifaire par Zone</span>
            <span className="badge badge-info" style={{ fontSize: 11 }}>Synchronisé Supabase</span>
          </div>

          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Chargement des zones...</div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucune zone configurée</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Zone & Code</th>
                    <th>Statut</th>
                    <th>Tarif de Base (HTG)</th>
                    <th>Prix par KM (HTG)</th>
                    <th>Supplément Nuit (HTG)</th>
                    <th>Niveau de Risque</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(zone => (
                    <ZonePricingRow
                      key={zone.id}
                      zone={zone}
                      saving={savingId === zone.id}
                      onSave={(base, perKm, night) => handleUpdatePrice(zone, base, perKm, night)}
                      onToggle={() => handleToggle(zone)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ZonePricingRow({
  zone,
  saving,
  onSave,
  onToggle,
}: {
  zone: any;
  saving: boolean;
  onSave: (base: number, perKm: number, night: number) => void;
  onToggle: () => void;
}) {
  const [baseFee, setBaseFee] = useState<number>(Number(zone.baseFee || 0));
  const [perKmFee, setPerKmFee] = useState<number>(Number(zone.perKmFee || 0));
  const [nightSurcharge, setNightSurcharge] = useState<number>(Number(zone.nightSurcharge || 0));
  const isDirty =
    baseFee !== Number(zone.baseFee || 0) ||
    perKmFee !== Number(zone.perKmFee || 0) ||
    nightSurcharge !== Number(zone.nightSurcharge || 0);

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{zone.name}</div>
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4 }}>
          {zone.code}
        </span>
      </td>

      <td>
        <button
          onClick={onToggle}
          style={{
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: 12,
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            background: zone.isActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-3)',
            color: zone.isActive ? '#10B981' : 'var(--text-muted)',
          }}
        >
          {zone.isActive ? '● En service' : '○ Inactive'}
        </button>
      </td>

      <td>
        <input
          type="number"
          value={baseFee}
          onChange={e => setBaseFee(Number(e.target.value))}
          style={{
            width: 100,
            padding: '6px 10px',
            borderRadius: 6,
            border: isDirty ? '1.5px solid #EB1700' : '1px solid var(--border-subtle)',
            fontWeight: 700,
            background: '#FFFFFF',
          }}
        />
      </td>

      <td>
        <input
          type="number"
          value={perKmFee}
          onChange={e => setPerKmFee(Number(e.target.value))}
          style={{
            width: 100,
            padding: '6px 10px',
            borderRadius: 6,
            border: isDirty ? '1.5px solid #EB1700' : '1px solid var(--border-subtle)',
            fontWeight: 700,
            background: '#FFFFFF',
          }}
        />
      </td>

      <td>
        <input
          type="number"
          value={nightSurcharge}
          onChange={e => setNightSurcharge(Number(e.target.value))}
          style={{
            width: 100,
            padding: '6px 10px',
            borderRadius: 6,
            border: isDirty ? '1.5px solid #EB1700' : '1px solid var(--border-subtle)',
            fontWeight: 700,
            background: '#FFFFFF',
          }}
        />
      </td>

      <td>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: zone.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.1)' : zone.riskLevel === 'ELEVATED' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            color: zone.riskLevel === 'HIGH' ? '#EF4444' : zone.riskLevel === 'ELEVATED' ? '#F59E0B' : '#10B981',
          }}
        >
          {zone.riskLevel || 'NORMAL'}
        </span>
      </td>

      <td style={{ textAlign: 'right' }}>
        <button
          className="btn btn-sm btn-primary"
          disabled={!isDirty || saving}
          onClick={() => onSave(baseFee, perKmFee, nightSurcharge)}
          style={{
            fontSize: 12,
            padding: '5px 12px',
            opacity: !isDirty ? 0.4 : 1,
            cursor: !isDirty ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '...' : 'Sauvegarder'}
        </button>
      </td>
    </tr>
  );
}

