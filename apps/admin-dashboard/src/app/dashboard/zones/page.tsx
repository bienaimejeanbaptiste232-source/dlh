'use client';
import { useEffect, useState } from 'react';
import { supabase, getZones, toggleZoneStatus } from '../../../lib/supabase';
import { IconZones, IconRefresh } from '../../../components/Icons';

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  NORMAL:   { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
  ELEVATED: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
  HIGH:     { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444' },
};

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBaseFee, setFormBaseFee] = useState(150);
  const [formPerKmFee, setFormPerKmFee] = useState(35);
  const [formNightSurcharge, setFormNightSurcharge] = useState(50);
  const [formRiskLevel, setFormRiskLevel] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    setLoading(true);
    try {
      const data = await getZones();
      setZones(data || []);
    } catch (err) {
      console.error('Supabase zones error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setActionLoading(id);
    try {
      await toggleZoneStatus(id, !current);
      await fetchZones();
    } catch (e) {
      alert('Erreur lors de la mise à jour du statut.');
    } finally {
      setActionLoading(null);
    }
  }

  const openCreateModal = () => {
    setFormName('');
    setFormCode('');
    setFormBaseFee(150);
    setFormPerKmFee(35);
    setFormNightSurcharge(50);
    setFormRiskLevel('NORMAL');
    setShowCreateModal(true);
  };

  const openEditModal = (z: any) => {
    setEditingZone(z);
    setFormName(z.name || '');
    setFormCode(z.code || '');
    setFormBaseFee(Number(z.baseFee || 0));
    setFormPerKmFee(Number(z.perKmFee || 0));
    setFormNightSurcharge(Number(z.nightSurcharge || 0));
    setFormRiskLevel(z.riskLevel || 'NORMAL');
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) return alert('Veuillez renseigner le nom et le code.');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('delivery_zones').insert({
        name: formName,
        code: formCode.toUpperCase().trim(),
        baseFee: formBaseFee,
        perKmFee: formPerKmFee,
        nightSurcharge: formNightSurcharge,
        riskLevel: formRiskLevel,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      if (error) throw error;
      setShowCreateModal(false);
      await fetchZones();
    } catch (err: any) {
      alert('Erreur création: ' + (err?.message || 'Impossible'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('delivery_zones').update({
        name: formName,
        code: formCode.toUpperCase().trim(),
        baseFee: formBaseFee,
        perKmFee: formPerKmFee,
        nightSurcharge: formNightSurcharge,
        riskLevel: formRiskLevel,
        updatedAt: new Date().toISOString(),
      }).eq('id', editingZone.id);
      if (error) throw error;
      setEditingZone(null);
      await fetchZones();
    } catch (err: any) {
      alert('Erreur modification: ' + (err?.message || 'Impossible'));
    } finally {
      setSubmitting(false);
    }
  };

  const activeZones = zones.filter(z => z.isActive).length;
  const highRisk = zones.filter(z => z.riskLevel === 'HIGH').length;

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
              <IconZones size={18} color="#FFFFFF" />
            </div>
            <span>Zones de Livraison — Haïti</span>
          </div>
          <div className="topbar-subtitle">
            Configuration géographique, niveaux de risque et couverture de service
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}
          >
            <span>+ Nouvelle Zone</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={fetchZones}
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
              <span className="stat-card-label">Total Zones Définies</span>
              <div className="stat-card-icon blue"><IconZones size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{zones.length}</div>
            <div className="stat-card-sub">Cap-Haïtien & Environs</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Zones Actives</span>
              <div className="stat-card-icon green"><IconZones size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>{activeZones}</div>
            <div className="stat-card-sub">Desservies en temps réel</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Zones Vigilance Haute</span>
              <div className="stat-card-icon pink"><IconZones size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: highRisk > 0 ? 'var(--primary)' : 'inherit' }}>{highRisk}</div>
            <div className="stat-card-sub">Niveau de risque HIGH</div>
          </div>
        </div>

        {/* Zones Grid */}
        {loading ? (
          <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            Chargement des zones géographiques...
          </div>
        ) : zones.length === 0 ? (
          <div className="card p-12 text-center">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Aucune zone de livraison
            </h3>
            <p className="text-xs text-muted" style={{ marginBottom: 16 }}>
              Créez votre première zone pour démarrer les opérations de livraison.
            </p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              Créer une zone
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {zones.map(zone => {
              const risk = RISK_COLORS[zone.riskLevel] || RISK_COLORS.NORMAL;
              return (
                <div
                  key={zone.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 14,
                    padding: 20,
                  }}
                >
                  <div>
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📍</span>
                          <span>{zone.name}</span>
                        </div>
                        <span className="font-mono text-xs" style={{ background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                          {zone.code}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: zone.isActive ? 'rgba(16,185,129,0.12)' : 'var(--surface-3)',
                            color: zone.isActive ? '#10B981' : 'var(--text-muted)',
                          }}
                        >
                          {zone.isActive ? '● Active' : '○ Inactive'}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 8,
                            background: risk.bg,
                            color: risk.text,
                          }}
                        >
                          {zone.riskLevel || 'NORMAL'}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Badges */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>
                          {Number(zone.baseFee || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>HTG &bull; Base</div>
                      </div>

                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--info)' }}>
                          {Number(zone.perKmFee || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>HTG &bull; / km</div>
                      </div>
                    </div>

                    {zone.nightSurcharge > 0 && (
                      <div style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        marginBottom: 14,
                        fontSize: 12,
                        color: 'var(--info)',
                        fontWeight: 600,
                      }}>
                        🌙 Majoration de nuit : +{Number(zone.nightSurcharge).toLocaleString()} HTG
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      className={`btn btn-sm ${zone.isActive ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ flex: 1, fontSize: 12 }}
                      disabled={actionLoading === zone.id}
                      onClick={() => handleToggle(zone.id, zone.isActive)}
                    >
                      {actionLoading === zone.id ? '...' : zone.isActive ? 'Désactiver' : 'Activer'}
                    </button>

                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 12 }}
                      onClick={() => openEditModal(zone)}
                    >
                      Modifier ✏️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Créer / Modifier */}
      {(showCreateModal || editingZone) && (
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
            maxWidth: 480,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
              {editingZone ? 'Modifier la Zone de Livraison' : 'Ajouter une Nouvelle Zone'}
            </h3>
            <p className="text-xs text-muted" style={{ marginBottom: 18 }}>
              Configurez les prix de départ, coût par kilomètre et seuil de sécurité.
            </p>

            <form onSubmit={editingZone ? handleUpdateZone : handleCreateZone}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nom de la Zone
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cap-Haïtien Centre, Vertières..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Code Unique (Ex: CAP-01)
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="CAP-CENTRE"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  className="form-input font-mono"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Tarif Base (HTG)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formBaseFee}
                    onChange={e => setFormBaseFee(Number(e.target.value))}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Prix / km (HTG)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPerKmFee}
                    onChange={e => setFormPerKmFee(Number(e.target.value))}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', fontWeight: 800 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Majoration Nuit (HTG)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formNightSurcharge}
                    onChange={e => setFormNightSurcharge(Number(e.target.value))}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Niveau de Risque
                  </label>
                  <select
                    value={formRiskLevel}
                    onChange={e => setFormRiskLevel(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#FFFFFF' }}
                  >
                    <option value="NORMAL">Normal (Vert)</option>
                    <option value="ELEVATED">Élevé (Orange)</option>
                    <option value="HIGH">Critique (Rouge)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowCreateModal(false); setEditingZone(null); }}
                  style={{ fontSize: 13 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {submitting ? 'Enregistrement...' : editingZone ? 'Sauvegarder les modifications' : 'Créer la zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
