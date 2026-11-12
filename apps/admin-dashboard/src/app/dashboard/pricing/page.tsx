'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase, getZones, toggleZoneStatus } from '../../../lib/supabase';
import {
  fetchCoverageAreas,
  fetchAreaPricingMap,
  updateAreaPricing,
  isAreaEffectivelyActive,
  getEffectivePricing,
  ServiceArea,
  AreaPricing,
} from '../../../lib/coverage';
import { IconZones, IconFinance, IconRefresh } from '../../../components/Icons';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'simulator' | 'legacy'>('coverage');

  // Haiti coverage & area pricing state
  const [haitiAreas, setHaitiAreas] = useState<ServiceArea[]>([]);
  const [pricingMap, setPricingMap] = useState<Record<string, AreaPricing>>({});
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-nord');
  const [savingAreaId, setSavingAreaId] = useState<string | null>(null);

  // Legacy flat zones state
  const [legacyZones, setLegacyZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Simulator state
  const [simZoneId, setSimZoneId] = useState<string>('zone-centre-ville');
  const [simKm, setSimKm] = useState<number>(3.5);
  const [simQuantity, setSimQuantity] = useState<number>(1);
  const [simCategory, setSimCategory] = useState<string>('RESTAURANT');
  const [isNight, setIsNight] = useState<boolean>(false);
  const [simBreakdown, setSimBreakdown] = useState<any | null>(null);

  useEffect(() => {
    loadAllPricing();
  }, []);

  async function loadAllPricing() {
    setLoading(true);
    try {
      const [zonesData, areasData, priceMap] = await Promise.all([
        getZones(),
        fetchCoverageAreas(),
        fetchAreaPricingMap(),
      ]);
      setLegacyZones(zonesData || []);
      setHaitiAreas(areasData);
      setPricingMap(priceMap);
    } catch (err) {
      console.error('Erreur chargement tarification:', err);
    } finally {
      setLoading(false);
    }
  }

  // Update area pricing in Haiti Coverage model
  const handleSaveAreaPrice = async (
    areaId: string,
    baseFee: number | null,
    perKmFee: number | null,
    nightSurcharge: number | null,
    minOrderAmount: number | null,
    estimatedMinutes: number | null
  ) => {
    setSavingAreaId(areaId);
    try {
      const isConfigured = baseFee !== null;
      const { success, updatedMap } = await updateAreaPricing(
        areaId,
        {
          isConfigured,
          baseFee,
          perKmFee,
          nightSurcharge,
          minOrderAmount,
          estimatedDeliveryMinutes: estimatedMinutes,
        },
        pricingMap
      );
      if (success) {
        setPricingMap(updatedMap);
      } else {
        alert('Erreur lors de la sauvegarde du tarif.');
      }
    } catch (e: any) {
      alert('Erreur: ' + (e?.message || 'Impossible de mettre à jour'));
    } finally {
      setSavingAreaId(null);
    }
  };

  // Legacy flat zone update
  const handleUpdateLegacyPrice = async (zone: any, baseFee: number, perKmFee: number, nightSurcharge: number) => {
    setSavingId(zone.id);
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ baseFee, perKmFee, nightSurcharge, updatedAt: new Date().toISOString() })
        .eq('id', zone.id);
      if (error) throw error;
      await loadAllPricing();
    } catch (e: any) {
      alert('Erreur: ' + (e?.message || 'Impossible de mettre à jour'));
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleLegacy = async (zone: any) => {
    try {
      await toggleZoneStatus(zone.id, !zone.isActive);
      await loadAllPricing();
    } catch (e) {
      alert('Erreur activation/désactivation');
    }
  };

  // Calculate delivery fee estimate in simulator
  const calculateEstimate = () => {
    const area = haitiAreas.find(a => a.id === simZoneId);
    const { pricing } = getEffectivePricing(simZoneId, haitiAreas, pricingMap);

    const base = pricing?.baseFee ?? 150;
    const perKm = pricing?.perKmFee ?? 35;
    const night = isNight ? (pricing?.nightSurcharge ?? 50) : 0;

    const extraKm = Math.max(0, simKm - 2.0);
    const longDistKm = Math.max(0, simKm - 10.0);
    const distFee = base + (extraKm * perKm) + (longDistKm * 15.0);

    let vol = 0;
    if (simQuantity <= 4) vol = 0;
    else if (simQuantity <= 10) vol = 50;
    else if (simQuantity <= 25) vol = 150;
    else if (simQuantity <= 50) vol = 350;
    else if (simQuantity <= 100) vol = 750;
    else vol = 750 + (simQuantity - 100) * 10;

    let cat = 0;
    if (simCategory === 'SUPERMARKET') cat = 30;
    else if (simCategory === 'CARGO') cat = 100;

    const total = Math.round(distFee + vol + cat + night);
    const driverEarnings = Math.round(total * 0.85);
    const platformEarnings = total - driverEarnings;

    setSimBreakdown({
      areaName: area?.name || 'Zòn Seleksyone',
      isConfigured: pricing?.isConfigured ?? false,
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

  // Filter areas for selected department
  const departments = useMemo(() => {
    return haitiAreas.filter(a => a.type === 'DEPARTMENT').sort((a, b) => a.sortOrder - b.sortOrder);
  }, [haitiAreas]);

  const departmentAreas = useMemo(() => {
    if (!selectedDeptId) return [];
    const result: ServiceArea[] = [];
    const dept = haitiAreas.find(a => a.id === selectedDeptId);
    if (dept) result.push(dept);

    const collectChildren = (parentId: string) => {
      const children = haitiAreas.filter(a => a.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
      for (const child of children) {
        result.push(child);
        collectChildren(child.id);
      }
    };
    if (dept) collectChildren(dept.id);
    return result;
  }, [haitiAreas, selectedDeptId]);

  // Pricing stats for Haiti Coverage
  const stats = useMemo(() => {
    const configuredCount = Object.values(pricingMap).filter(p => p.isConfigured && p.baseFee !== null).length;
    const configuredBases = Object.values(pricingMap)
      .filter(p => p.isConfigured && p.baseFee !== null)
      .map(p => Number(p.baseFee));
    const avgBase = configuredBases.length
      ? Math.round(configuredBases.reduce((a, b) => a + b, 0) / configuredBases.length)
      : 150;
    const minBase = configuredBases.length ? Math.min(...configuredBases) : 0;
    const maxBase = configuredBases.length ? Math.max(...configuredBases) : 0;

    return {
      configuredCount,
      totalAreas: haitiAreas.length,
      avgBase,
      minBase,
      maxBase,
    };
  }, [pricingMap, haitiAreas]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FF6000 0%, #FF8A00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 96, 0, 0.3)',
              }}
            >
              <IconFinance size={18} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                Tarification & Grille de Prix par Zone
              </span>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                Configuration des prix par zone de service • Départements d&apos;Haïti (Nord en premier)
              </div>
            </div>
          </div>
        </div>

        <div className="topbar-actions" style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/dashboard/coverage"
            className="btn btn-secondary"
            style={{ fontSize: 12, fontWeight: 700, gap: 6 }}
          >
            <IconZones size={14} />
            <span>Gérer l&apos;Arborescence Couverture</span>
          </Link>
          <button
            className="btn btn-secondary"
            onClick={loadAllPricing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="content-area">
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div className="stat-card" style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Tarifs Configurés
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
              {stats.configuredCount} <span style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>/ {stats.totalAreas} zones</span>
            </div>
            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 4 }}>
              ● Zones avec tarif personnalisé
            </div>
          </div>

          <div className="stat-card" style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Tarif de Base Moyen
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
              {stats.avgBase} HTG
            </div>
            <div style={{ fontSize: 12, color: '#FF6000', fontWeight: 600, marginTop: 4 }}>
              Moyenne des zones configurées
            </div>
          </div>

          <div className="stat-card" style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Écart Tarifs de Base
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
              {stats.minBase} - {stats.maxBase} HTG
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 4 }}>
              Non configurés = non confirmés
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('coverage')}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'coverage' ? '2px solid #FF6000' : '1px solid #E2E8F0',
              background: activeTab === 'coverage' ? '#FFF7ED' : '#FFFFFF',
              color: activeTab === 'coverage' ? '#C2410C' : '#475569',
            }}
          >
            🗺️ Grille par Service Area (Ayiti - Nò & Depatman)
          </button>
          <button
            onClick={() => {
              setActiveTab('simulator');
              calculateEstimate();
            }}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'simulator' ? '2px solid #FF6000' : '1px solid #E2E8F0',
              background: activeTab === 'simulator' ? '#FFF7ED' : '#FFFFFF',
              color: activeTab === 'simulator' ? '#C2410C' : '#475569',
            }}
          >
            🧮 Simulateur de Devis Client
          </button>
          <button
            onClick={() => setActiveTab('legacy')}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: activeTab === 'legacy' ? '2px solid #FF6000' : '1px solid #E2E8F0',
              background: activeTab === 'legacy' ? '#FFF7ED' : '#FFFFFF',
              color: activeTab === 'legacy' ? '#C2410C' : '#475569',
            }}
          >
            📋 Anciennes Zones Plates ({legacyZones.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: HAITI SERVICE AREA PRICING GRID                      */}
        {/* ============================================================ */}
        {activeTab === 'coverage' && (
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20 }}>
            {/* Department selector */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Depatman:</span>
                {departments.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeptId(d.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: selectedDeptId === d.id ? 800 : 600,
                      cursor: 'pointer',
                      border: selectedDeptId === d.id ? '1px solid #FF6000' : '1px solid #E2E8F0',
                      background: selectedDeptId === d.id ? '#FFF7ED' : '#F8FAFC',
                      color: selectedDeptId === d.id ? '#C2410C' : '#475569',
                    }}
                  >
                    {d.name} {d.isActive ? '🟢' : '⚪'}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 12, color: '#64748B' }}>
                💡 Pri ki pa konfigire rete make &quot;Non konfigire&quot; pou pa twonpe kliyan ak livrè.
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: 12, color: '#64748B' }}>
                    <th style={{ padding: '12px 14px' }}>Zòn & Kòd</th>
                    <th style={{ padding: '12px 14px' }}>Nivo</th>
                    <th style={{ padding: '12px 14px' }}>Kouvèti</th>
                    <th style={{ padding: '12px 14px' }}>Tarif Baz (HTG)</th>
                    <th style={{ padding: '12px 14px' }}>Pri / km (HTG)</th>
                    <th style={{ padding: '12px 14px' }}>Lannwit (HTG)</th>
                    <th style={{ padding: '12px 14px' }}>Min Kòmand</th>
                    <th style={{ padding: '12px 14px' }}>Delè (min)</th>
                    <th style={{ padding: '12px 14px' }}>Statut Tarif</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Aksyon</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentAreas.map(area => (
                    <AreaPricingRow
                      key={area.id}
                      area={area}
                      allAreas={haitiAreas}
                      pricingMap={pricingMap}
                      isSaving={savingAreaId === area.id}
                      onSave={handleSaveAreaPrice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PRICING SIMULATOR                                     */}
        {/* ============================================================ */}
        {activeTab === 'simulator' && (
          <div className="card" style={{ border: '1.5px solid var(--border-subtle)', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDFD 100%)', padding: 20, borderRadius: 14 }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                🧮 Simulateur de Devis en Temps Réel
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Valide le calcul des frais de livraison pour le client et le livreur
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Zòn Livrezon (Okap)
                </label>
                <select
                  className="form-input"
                  value={simZoneId}
                  onChange={e => setSimZoneId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#FFFFFF' }}
                >
                  {haitiAreas.filter(a => a.type === 'ZONE').map(z => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Distans estimée (km)
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
                  Kantite atik / bwat
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={simQuantity}
                  onChange={e => setSimQuantity(parseInt(e.target.value) || 1)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Kategori
                </label>
                <select
                  className="form-input"
                  value={simCategory}
                  onChange={e => setSimCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#FFFFFF' }}
                >
                  <option value="RESTAURANT">Restaurant / Manje</option>
                  <option value="SUPERMARKET">Supermarché (+30 HTG)</option>
                  <option value="CARGO">Gros Colis / Matériaux (+100 HTG)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isNight}
                    onChange={e => setIsNight(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#FF6000' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Nwit (+50 HTG)</span>
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={calculateEstimate}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', fontWeight: 800 }}
                >
                  Kalkile Tarif
                </button>
              </div>
            </div>

            {/* Simulator Results */}
            {simBreakdown && (
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Tarif Baz Zòn</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{simBreakdown.baseFee} HTG</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Distans ({simKm} km)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{simBreakdown.distanceFee} HTG</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Volim ({simQuantity} atik)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>+{simBreakdown.volumeSurcharge} HTG</div>
                  </div>

                  <div style={{ background: '#FFF3EB', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #FF6000' }}>
                    <div style={{ fontSize: 11, color: '#C2410C', fontWeight: 800, textTransform: 'uppercase' }}>Total Livrezon</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#FF6000' }}>{simBreakdown.totalDeliveryFee} HTG</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, background: '#FFFFFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Pousantaj Livrè (85%)</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{simBreakdown.driverEarnings} HTG</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Pousantaj Platfòm (15%)</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>{simBreakdown.platformEarnings} HTG</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: LEGACY FLAT ZONES (Kept for backwards compatibility) */}
        {/* ============================================================ */}
        {activeTab === 'legacy' && (
          <div className="card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20 }}>
            <div style={{ marginBottom: 14, fontSize: 13, color: '#64748B' }}>
              Ansyen tablo zòn plat la pou referans. Nouvo kouvèti yerachik la jere tout 10 depatman Ayiti nan premye onglet a.
            </div>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: 12, color: '#64748B' }}>
                    <th style={{ padding: '10px 12px' }}>Zone & Code</th>
                    <th style={{ padding: '10px 12px' }}>Statut</th>
                    <th style={{ padding: '10px 12px' }}>Tarif Base (HTG)</th>
                    <th style={{ padding: '10px 12px' }}>Prix / KM (HTG)</th>
                    <th style={{ padding: '10px 12px' }}>Supplément Nuit</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {legacyZones.map(zone => (
                    <tr key={zone.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{zone.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{zone.code}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleToggleLegacy(zone)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 12,
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 700,
                            background: zone.isActive ? '#DCFCE7' : '#F1F5F9',
                            color: zone.isActive ? '#15803D' : '#64748B',
                            cursor: 'pointer',
                          }}
                        >
                          {zone.isActive ? '● En service' : '○ Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 800 }}>{zone.baseFee} HTG</td>
                      <td style={{ padding: '10px 12px', fontWeight: 800 }}>{zone.perKmFee} HTG</td>
                      <td style={{ padding: '10px 12px' }}>{zone.nightSurcharge} HTG</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleUpdateLegacyPrice(zone, zone.baseFee, zone.perKmFee, zone.nightSurcharge)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        >
                          Sauvegarder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// COMPONENT: ROW FOR HAITI AREA PRICING EDITING
// ============================================================
function AreaPricingRow({
  area,
  allAreas,
  pricingMap,
  isSaving,
  onSave,
}: {
  area: ServiceArea;
  allAreas: ServiceArea[];
  pricingMap: Record<string, AreaPricing>;
  isSaving: boolean;
  onSave: (
    areaId: string,
    baseFee: number | null,
    perKmFee: number | null,
    nightSurcharge: number | null,
    minOrderAmount: number | null,
    estimatedMinutes: number | null
  ) => void;
}) {
  const existing = pricingMap[area.id];
  const effectiveResult = getEffectivePricing(area.id, allAreas, pricingMap);
  const availability = isAreaEffectivelyActive(area, allAreas);

  const [baseFee, setBaseFee] = useState<string>(
    existing?.baseFee !== null && existing?.baseFee !== undefined ? String(existing.baseFee) : ''
  );
  const [perKmFee, setPerKmFee] = useState<string>(
    existing?.perKmFee !== null && existing?.perKmFee !== undefined ? String(existing.perKmFee) : ''
  );
  const [nightSurcharge, setNightSurcharge] = useState<string>(
    existing?.nightSurcharge !== null && existing?.nightSurcharge !== undefined ? String(existing.nightSurcharge) : ''
  );
  const [minOrder, setMinOrder] = useState<string>(
    existing?.minOrderAmount !== null && existing?.minOrderAmount !== undefined ? String(existing.minOrderAmount) : ''
  );
  const [estMinutes, setEstMinutes] = useState<string>(
    existing?.estimatedDeliveryMinutes !== null && existing?.estimatedDeliveryMinutes !== undefined
      ? String(existing.estimatedDeliveryMinutes)
      : ''
  );

  const isDirty =
    (baseFee !== (existing?.baseFee !== null && existing?.baseFee !== undefined ? String(existing.baseFee) : '')) ||
    (perKmFee !== (existing?.perKmFee !== null && existing?.perKmFee !== undefined ? String(existing.perKmFee) : '')) ||
    (nightSurcharge !== (existing?.nightSurcharge !== null && existing?.nightSurcharge !== undefined ? String(existing.nightSurcharge) : '')) ||
    (minOrder !== (existing?.minOrderAmount !== null && existing?.minOrderAmount !== undefined ? String(existing.minOrderAmount) : '')) ||
    (estMinutes !== (existing?.estimatedDeliveryMinutes !== null && existing?.estimatedDeliveryMinutes !== undefined ? String(existing.estimatedDeliveryMinutes) : ''));

  const handleRowSave = () => {
    onSave(
      area.id,
      baseFee.trim() !== '' ? Number(baseFee) : null,
      perKmFee.trim() !== '' ? Number(perKmFee) : null,
      nightSurcharge.trim() !== '' ? Number(nightSurcharge) : null,
      minOrder.trim() !== '' ? Number(minOrder) : null,
      estMinutes.trim() !== '' ? Number(estMinutes) : null
    );
  };

  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9', background: isDirty ? '#FFFDF5' : '#FFFFFF' }}>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>{area.name}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{area.code}</div>
      </td>

      <td style={{ padding: '10px 14px' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 6,
            background: '#F1F5F9',
            color: '#475569',
          }}
        >
          {area.type}
        </span>
      </td>

      <td style={{ padding: '10px 14px' }}>
        {availability.isAvailable ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>🟢 Aktif</span>
        ) : availability.reason === 'PARENT_INACTIVE' ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>🔒 Paran inaktif</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>⚪ Inaktif</span>
        )}
      </td>

      <td style={{ padding: '10px 14px' }}>
        <input
          type="number"
          placeholder="Non konfigire"
          value={baseFee}
          onChange={e => setBaseFee(e.target.value)}
          style={{
            width: 95,
            padding: '6px 8px',
            borderRadius: 6,
            border: isDirty ? '1.5px solid #FF6000' : '1px solid #CBD5E1',
            fontWeight: 800,
            fontSize: 12,
            background: '#FFFFFF',
          }}
        />
      </td>

      <td style={{ padding: '10px 14px' }}>
        <input
          type="number"
          placeholder="Ex: 35"
          value={perKmFee}
          onChange={e => setPerKmFee(e.target.value)}
          style={{
            width: 75,
            padding: '6px 8px',
            borderRadius: 6,
            border: isDirty ? '1.5px solid #FF6000' : '1px solid #CBD5E1',
            fontWeight: 700,
            fontSize: 12,
            background: '#FFFFFF',
          }}
        />
      </td>

      <td style={{ padding: '10px 14px' }}>
        <input
          type="number"
          placeholder="50"
          value={nightSurcharge}
          onChange={e => setNightSurcharge(e.target.value)}
          style={{
            width: 70,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #CBD5E1',
            fontSize: 12,
          }}
        />
      </td>

      <td style={{ padding: '10px 14px' }}>
        <input
          type="number"
          placeholder="200"
          value={minOrder}
          onChange={e => setMinOrder(e.target.value)}
          style={{
            width: 75,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #CBD5E1',
            fontSize: 12,
          }}
        />
      </td>

      <td style={{ padding: '10px 14px' }}>
        <input
          type="number"
          placeholder="30"
          value={estMinutes}
          onChange={e => setEstMinutes(e.target.value)}
          style={{
            width: 65,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #CBD5E1',
            fontSize: 12,
          }}
        />
      </td>

      <td style={{ padding: '10px 14px' }}>
        {existing?.isConfigured && existing.baseFee !== null ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', background: '#FFF7ED', padding: '3px 8px', borderRadius: 6, border: '1px solid #FED7AA' }}>
            ✓ Konfigire
          </span>
        ) : effectiveResult.pricing ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F8FAFC', padding: '3px 8px', borderRadius: 6 }}>
            ↳ Erite ({effectiveResult.inheritedFrom?.name})
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '3px 8px', borderRadius: 6, border: '1px dashed #FECACA' }}>
            ⚠️ Non Konfigire
          </span>
        )}
      </td>

      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
        <button
          onClick={handleRowSave}
          disabled={!isDirty || isSaving}
          className="btn btn-primary"
          style={{
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 800,
            opacity: !isDirty ? 0.35 : 1,
            cursor: !isDirty ? 'default' : 'pointer',
          }}
        >
          {isSaving ? '...' : 'Sauvegarder'}
        </button>
      </td>
    </tr>
  );
}
