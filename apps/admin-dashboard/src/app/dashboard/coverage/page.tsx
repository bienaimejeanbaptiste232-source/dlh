'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ServiceArea,
  AreaPricing,
  AreaType,
  fetchCoverageAreas,
  saveCoverageAreas,
  fetchAreaPricingMap,
  saveAreaPricingMap,
  toggleAreaActive,
  updateAreaPricing,
  addArea,
  isAreaEffectivelyActive,
  getEffectivePricing,
  getAreaAncestors,
} from '../../../lib/coverage';
import { IconZones, IconRefresh } from '../../../components/Icons';

// Level badges configuration
const LEVEL_CONFIG: Record<AreaType, { label: string; bg: string; color: string; border: string }> = {
  DEPARTMENT:        { label: 'DEPATMAN', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  ARRONDISSEMENT:    { label: 'AWONDISMAN', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  COMMUNE:           { label: 'KOMIN', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  COMMUNAL_SECTION:  { label: 'SEKSYON', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  ZONE:              { label: 'ZÒN LIVREZON', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
};

const NEXT_CHILD_TYPE: Record<AreaType, AreaType | null> = {
  DEPARTMENT: 'ARRONDISSEMENT',
  ARRONDISSEMENT: 'COMMUNE',
  COMMUNE: 'COMMUNAL_SECTION',
  COMMUNAL_SECTION: 'ZONE',
  ZONE: null,
};

export default function CoveragePage() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [pricingMap, setPricingMap] = useState<Record<string, AreaPricing>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-nord');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'dept-nord': true,
    'arr-cap-haitien': true,
    'com-cap-haitien': true,
    'sec-bande-du-nord': true,
    'sec-haut-du-cap': true,
    'sec-petit-anse': true,
  });

  // Modal: Pricing
  const [pricingModalArea, setPricingModalArea] = useState<ServiceArea | null>(null);
  const [pricingForm, setPricingForm] = useState<{
    isConfigured: boolean;
    baseFee: string;
    perKmFee: string;
    nightSurcharge: string;
    minOrderAmount: string;
    estimatedDeliveryMinutes: string;
    serviceFeePercent: string;
    specialConditions: string;
  }>({
    isConfigured: false,
    baseFee: '',
    perKmFee: '',
    nightSurcharge: '',
    minOrderAmount: '',
    estimatedDeliveryMinutes: '',
    serviceFeePercent: '',
    specialConditions: '',
  });

  // Modal: Add Area
  const [addModalParent, setAddModalParent] = useState<ServiceArea | null>(null);
  const [addForm, setAddForm] = useState<{
    type: AreaType;
    name: string;
    nameKr: string;
    code: string;
    radiusKm: string;
    isActive: boolean;
  }>({
    type: 'ZONE',
    name: '',
    nameKr: '',
    code: '',
    radiusKm: '2.5',
    isActive: true,
  });

  // Toast / feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [loadedAreas, loadedPricing] = await Promise.all([
        fetchCoverageAreas(),
        fetchAreaPricingMap(),
      ]);
      setAreas(loadedAreas);
      setPricingMap(loadedPricing);
    } catch (e) {
      console.error('Error loading coverage data:', e);
      showToast('Erè pandan chajman done kouvèti yo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Toggle node expansion
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle area activation with parent rule enforcement
  const handleToggleActive = async (area: ServiceArea) => {
    setActionLoading(area.id);
    const newActive = !area.isActive;

    // Check if activating a child whose parent is inactive
    if (newActive && area.parentId) {
      const parent = areas.find(a => a.id === area.parentId);
      if (parent && !parent.isActive) {
        showToast(
          `⚠️ Atansyon: Zòn "${area.name}" make aktif, men li pap disponib pou kliyan paske paran li "${parent.name}" inaktif!`,
          'warning'
        );
      }
    }

    try {
      const { success, updatedAreas } = await toggleAreaActive(area.id, newActive, areas);
      if (success) {
        setAreas(updatedAreas);
        showToast(
          `Estati ${area.name} mete ajou (${newActive ? 'Aktive' : 'Dezaktive'}).`,
          'success'
        );
      } else {
        showToast('Erè pandan anrejistreman estati a.', 'error');
      }
    } catch (e) {
      showToast('Erè enprevu.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Pricing Modal
  const openPricingModal = (area: ServiceArea) => {
    setPricingModalArea(area);
    const existing = pricingMap[area.id];
    if (existing && existing.isConfigured) {
      setPricingForm({
        isConfigured: true,
        baseFee: existing.baseFee !== null ? String(existing.baseFee) : '',
        perKmFee: existing.perKmFee !== null ? String(existing.perKmFee) : '',
        nightSurcharge: existing.nightSurcharge !== null ? String(existing.nightSurcharge) : '',
        minOrderAmount: existing.minOrderAmount !== null ? String(existing.minOrderAmount) : '',
        estimatedDeliveryMinutes: existing.estimatedDeliveryMinutes !== null ? String(existing.estimatedDeliveryMinutes) : '',
        serviceFeePercent: existing.serviceFeePercent !== null ? String(existing.serviceFeePercent) : '',
        specialConditions: existing.specialConditions || '',
      });
    } else {
      // Unconfigured by default - do not make up fake prices!
      setPricingForm({
        isConfigured: false,
        baseFee: '',
        perKmFee: '',
        nightSurcharge: '',
        minOrderAmount: '',
        estimatedDeliveryMinutes: '',
        serviceFeePercent: '',
        specialConditions: '',
      });
    }
  };

  // Save Pricing
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingModalArea) return;

    setActionLoading(pricingModalArea.id);
    try {
      const isConf = pricingForm.isConfigured;
      const payload: Partial<AreaPricing> = {
        isConfigured: isConf,
        baseFee: isConf && pricingForm.baseFee !== '' ? Number(pricingForm.baseFee) : null,
        perKmFee: isConf && pricingForm.perKmFee !== '' ? Number(pricingForm.perKmFee) : null,
        nightSurcharge: isConf && pricingForm.nightSurcharge !== '' ? Number(pricingForm.nightSurcharge) : null,
        minOrderAmount: isConf && pricingForm.minOrderAmount !== '' ? Number(pricingForm.minOrderAmount) : null,
        estimatedDeliveryMinutes: isConf && pricingForm.estimatedDeliveryMinutes !== '' ? Number(pricingForm.estimatedDeliveryMinutes) : null,
        serviceFeePercent: isConf && pricingForm.serviceFeePercent !== '' ? Number(pricingForm.serviceFeePercent) : null,
        specialConditions: isConf ? (pricingForm.specialConditions.trim() || null) : null,
      };

      const { success, updatedMap } = await updateAreaPricing(pricingModalArea.id, payload, pricingMap);
      if (success) {
        setPricingMap(updatedMap);
        showToast(`Tarif pou ${pricingModalArea.name} anrejistre avèk siksè!`, 'success');
        setPricingModalArea(null);
      } else {
        showToast('Erè pandan anrejistreman tarif la.', 'error');
      }
    } catch (e) {
      showToast('Erè enprevu.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Add Child Area Modal
  const openAddChildModal = (parent: ServiceArea) => {
    const nextType = NEXT_CHILD_TYPE[parent.type] || 'ZONE';
    setAddModalParent(parent);
    setAddForm({
      type: nextType,
      name: '',
      nameKr: '',
      code: `${parent.code}-`,
      radiusKm: '2.5',
      isActive: true,
    });
  };

  // Save New Area
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addModalParent || !addForm.name.trim() || !addForm.code.trim()) {
      showToast('Tanpri ranpli tout chan obligatwa yo.', 'error');
      return;
    }

    setActionLoading('create');
    try {
      const { success, updatedAreas, created } = await addArea(
        {
          type: addForm.type,
          name: addForm.name.trim(),
          nameKr: addForm.nameKr.trim() || addForm.name.trim(),
          code: addForm.code.toUpperCase().trim(),
          parentId: addModalParent.id,
          isActive: addForm.isActive,
          isLaunched: true,
          radiusKm: addForm.type === 'ZONE' ? Number(addForm.radiusKm) || 2.5 : null,
          sortOrder: areas.filter(a => a.parentId === addModalParent.id).length + 1,
        },
        areas
      );

      if (success) {
        setAreas(updatedAreas);
        // Automatically expand the parent node
        setExpandedNodes(prev => ({ ...prev, [addModalParent.id]: true }));
        showToast(`Zòn "${created.name}" kreye avèk siksè!`, 'success');
        setAddModalParent(null);
      } else {
        showToast('Erè pandan kreyasyon zòn nan.', 'error');
      }
    } catch (e) {
      showToast('Erè enprevu.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Group areas by department
  const departments = useMemo(() => {
    return areas
      .filter(a => a.type === 'DEPARTMENT')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [areas]);

  // Compute children map for fast hierarchical rendering
  const childrenMap = useMemo(() => {
    const map: Record<string, ServiceArea[]> = {};
    for (const a of areas) {
      if (a.parentId) {
        if (!map[a.parentId]) map[a.parentId] = [];
        map[a.parentId].push(a);
      }
    }
    // Sort children by sortOrder
    for (const parentId in map) {
      map[parentId].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [areas]);

  // Key KPI stats
  const stats = useMemo(() => {
    const activeDepts = departments.filter(d => d.isActive).length;
    const totalDepts = departments.length;
    const allZones = areas.filter(a => a.type === 'ZONE');
    const activeZones = allZones.filter(z => isAreaEffectivelyActive(z, areas).isAvailable).length;
    const configuredPricingCount = Object.values(pricingMap).filter(p => p.isConfigured && p.baseFee !== null).length;

    return {
      activeDepts,
      totalDepts,
      totalZones: allZones.length,
      activeZones,
      configuredPricingCount,
    };
  }, [departments, areas, pricingMap]);

  const selectedDepartment = useMemo(() => {
    return departments.find(d => d.id === selectedDeptId) || departments[0];
  }, [departments, selectedDeptId]);

  return (
    <>
      {/* Topbar */}
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
              <IconZones size={20} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                Kouvèti & Tarifikasyon Pa Zòn (Ayiti)
              </span>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                Lanse ak Nò (Okap) an premye • Estrikti yerachik pare pou tout 10 depatman Ayiti
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: 13, gap: 6 }}
          >
            <IconRefresh size={14} />
            <span>Rafrechi</span>
          </button>
        </div>
      </div>

      <div className="content-area">
        {/* Toast Alert */}
        {toast && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 600,
              background:
                toast.type === 'success'
                  ? '#ECFDF5'
                  : toast.type === 'warning'
                  ? '#FFFBEB'
                  : '#FEF2F2',
              color:
                toast.type === 'success'
                  ? '#065F46'
                  : toast.type === 'warning'
                  ? '#92400E'
                  : '#991B1B',
              border: `1px solid ${
                toast.type === 'success'
                  ? '#A7F3D0'
                  : toast.type === 'warning'
                  ? '#FDE68A'
                  : '#FECACA'
              }`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'inherit' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* KPI 1 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Depatman Aktif
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
              {stats.activeDepts} <span style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8' }}>/ {stats.totalDepts}</span>
            </div>
            <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 4 }}>
              ● Depatman Nò aktif (Pilòt Okap)
            </div>
          </div>

          {/* KPI 2 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Zòn Livrezon Disponib
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
              {stats.activeZones} <span style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8' }}>/ {stats.totalZones} zòn</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 4 }}>
              Valide pa chèn paran aktif
            </div>
          </div>

          {/* KPI 3 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Tarifikasyon Konfigire
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
              {stats.configuredPricingCount} <span style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8' }}>zòn ak tarif</span>
            </div>
            <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, marginTop: 4 }}>
              Lòt zòn yo rete &quot;Non konfigire&quot;
            </div>
          </div>

          {/* KPI 4 */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Règ Validasyon Yerachik
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 6, lineHeight: 1.4 }}>
              Paran inaktif = Tout timoun bloke
            </div>
            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 4 }}>
              🔒 Pa gen livrezon si paran pa aktif
            </div>
          </div>
        </div>

        {/* Department Selector Tabs */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10, textTransform: 'uppercase' }}>
            Chwazi Depatman pou Jere Kouvèti a:
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 8,
              scrollbarWidth: 'thin',
            }}
          >
            {departments.map(dept => {
              const isSelected = dept.id === selectedDeptId;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: isSelected ? '2px solid #FF6000' : '1px solid #E2E8F0',
                    background: isSelected ? '#FFF7ED' : '#FFFFFF',
                    color: isSelected ? '#C2410C' : '#334155',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 2px 8px rgba(255, 96, 0, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: dept.isActive ? '#10B981' : '#CBD5E1',
                    }}
                  />
                  <span>
                    {dept.name} ({dept.nameKr})
                  </span>
                  {dept.isActive ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: '#DCFCE7',
                        color: '#15803D',
                        fontWeight: 800,
                      }}
                    >
                      LANSE
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: '#F1F5F9',
                        color: '#64748B',
                        fontWeight: 700,
                      }}
                    >
                      BENTO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Department Info & Action Banner */}
        {selectedDepartment && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              marginBottom: 20,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    background: LEVEL_CONFIG.DEPARTMENT.bg,
                    color: LEVEL_CONFIG.DEPARTMENT.color,
                    border: `1px solid ${LEVEL_CONFIG.DEPARTMENT.border}`,
                  }}
                >
                  DEPATMAN
                </span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
                  {selectedDepartment.name} ({selectedDepartment.nameKr})
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#64748B', fontWeight: 700 }}>
                  [{selectedDepartment.code}]
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                {selectedDepartment.isActive
                  ? '🟢 Depatman sa a aktif. Tout sèvis, komin ak zòn timoun ki aktif yo disponib pou kliyan.'
                  : '🔴 Depatman sa a inaktif. Kliyan pa ka pase kòmand nan okenn zòn ki anba l, menm si zòn yo make aktif.'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Toggle Dept Activation */}
              <button
                onClick={() => handleToggleActive(selectedDepartment)}
                disabled={actionLoading === selectedDepartment.id}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none',
                  background: selectedDepartment.isActive ? '#FEF2F2' : '#ECFDF5',
                  color: selectedDepartment.isActive ? '#DC2626' : '#059669',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                }}
              >
                {selectedDepartment.isActive ? 'Dezaktive Depatman' : 'Aktive Depatman Nèt'}
              </button>

              {/* Configure Dept Pricing */}
              <button
                onClick={() => openPricingModal(selectedDepartment)}
                className="btn btn-secondary"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                ⚙️ Tarif Depatman
              </button>

              {/* Add Arrondissement */}
              <button
                onClick={() => openAddChildModal(selectedDepartment)}
                className="btn btn-primary"
                style={{ fontSize: 13, fontWeight: 800 }}
              >
                ➕ Ajoute Awondisman
              </button>
            </div>
          </div>
        )}

        {/* Main Hierarchical Tree View */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
              Pye Yerachik Kouvèti pou Depatman {selectedDepartment?.name}:
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Klike sou flèch yo pou louvri / fèmen branch yo
            </div>
          </div>

          {/* Render Arrondissements of the selected department */}
          {selectedDepartment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(childrenMap[selectedDepartment.id] || []).map(arrondissement => (
                <AreaTreeNode
                  key={arrondissement.id}
                  area={arrondissement}
                  allAreas={areas}
                  childrenMap={childrenMap}
                  pricingMap={pricingMap}
                  expandedNodes={expandedNodes}
                  onToggleExpand={toggleExpand}
                  onToggleActive={handleToggleActive}
                  onOpenPricing={openPricingModal}
                  onAddChild={openAddChildModal}
                  actionLoading={actionLoading}
                />
              ))}

              {(!childrenMap[selectedDepartment.id] || childrenMap[selectedDepartment.id].length === 0) && (
                <div
                  style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    color: '#94A3B8',
                    background: '#F8FAFC',
                    borderRadius: 10,
                  }}
                >
                  Pa gen awondisman ki konfigire pou depatman sa a ankò. Klike sou &quot;➕ Ajoute Awondisman&quot; pou kòmanse.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: PRICING CONFIGURATION                                */}
      {/* ============================================================ */}
      {pricingModalArea && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div
            className="modal-card"
            style={{
              maxWidth: 580,
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: LEVEL_CONFIG[pricingModalArea.type].bg,
                      color: LEVEL_CONFIG[pricingModalArea.type].color,
                    }}
                  >
                    {LEVEL_CONFIG[pricingModalArea.type].label}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
                    Konfigire Tarif: {pricingModalArea.name}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Chimen: {getAreaAncestors(pricingModalArea, areas).map(a => a.name).join(' > ') || 'Rasin'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPricingModalArea(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            {/* Pricing Form */}
            <form onSubmit={handleSavePricing}>
              {/* Toggle Is Configured */}
              <div
                style={{
                  background: pricingForm.isConfigured ? '#ECFDF5' : '#FFFBEB',
                  border: `1px solid ${pricingForm.isConfigured ? '#A7F3D0' : '#FDE68A'}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: pricingForm.isConfigured ? '#047857' : '#B45309',
                    }}
                  >
                    {pricingForm.isConfigured
                      ? 'Tarif Zòn Sa a Pèsonalize (Konfigire)'
                      : 'Tarif Poko Konfigire / Erite de Paran'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    {pricingForm.isConfigured
                      ? 'Sistèm lan ap aplike pri espesifik ou defini anba yo.'
                      : 'Si dezaktive, zòn sa a ap erite tarif paran li (oubyen li make non konfigire).'}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={pricingForm.isConfigured}
                    onChange={e =>
                      setPricingForm(prev => ({
                        ...prev,
                        isConfigured: e.target.checked,
                        // If toggling on and empty, suggest standard base 150/35
                        baseFee: e.target.checked && !prev.baseFee ? '150' : prev.baseFee,
                        perKmFee: e.target.checked && !prev.perKmFee ? '35' : prev.perKmFee,
                        nightSurcharge: e.target.checked && !prev.nightSurcharge ? '50' : prev.nightSurcharge,
                        estimatedDeliveryMinutes: e.target.checked && !prev.estimatedDeliveryMinutes ? '30' : prev.estimatedDeliveryMinutes,
                      }))
                    }
                    style={{ width: 18, height: 18, accentColor: '#FF6000' }}
                  />
                </label>
              </div>

              {/* Inputs (disabled if not configured) */}
              <div
                style={{
                  opacity: pricingForm.isConfigured ? 1 : 0.5,
                  pointerEvents: pricingForm.isConfigured ? 'auto' : 'none',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Tarif Baz Livrezon (HTG) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required={pricingForm.isConfigured}
                      placeholder="Ex: 150"
                      value={pricingForm.baseFee}
                      onChange={e => setPricingForm(prev => ({ ...prev, baseFee: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Frè pa Kilomèt (HTG / km) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required={pricingForm.isConfigured}
                      placeholder="Ex: 35"
                      value={pricingForm.perKmFee}
                      onChange={e => setPricingForm(prev => ({ ...prev, perKmFee: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontWeight: 800 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Majorasyon Lannwit (HTG)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ex: 50"
                      value={pricingForm.nightSurcharge}
                      onChange={e => setPricingForm(prev => ({ ...prev, nightSurcharge: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Tan Livrezon Estime (Minit)
                    </label>
                    <input
                      type="number"
                      min={5}
                      placeholder="Ex: 25"
                      value={pricingForm.estimatedDeliveryMinutes}
                      onChange={e => setPricingForm(prev => ({ ...prev, estimatedDeliveryMinutes: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Minimòm Kòmand (HTG)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Ex: 200"
                      value={pricingForm.minOrderAmount}
                      onChange={e => setPricingForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Frè Sèvis Platfòm (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Ex: 10"
                      value={pricingForm.serviceFeePercent}
                      onChange={e => setPricingForm(prev => ({ ...prev, serviceFeePercent: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Kondisyon Espesyal & Nòt Sèvis
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Aksè difisil an tan lapli, sèvis moto rapid..."
                    value={pricingForm.specialConditions}
                    onChange={e => setPricingForm(prev => ({ ...prev, specialConditions: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPricingModalArea(null)}
                  style={{ fontSize: 13 }}
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === pricingModalArea.id}
                  className="btn btn-primary"
                  style={{ fontSize: 13, fontWeight: 800 }}
                >
                  {actionLoading === pricingModalArea.id ? 'Anrejistreman...' : 'Anrejistre Tarif Sa a'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD CHILD AREA                                       */}
      {/* ============================================================ */}
      {addModalParent && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div
            className="modal-card"
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
                  Ajoute Sou-zòn anba &quot;{addModalParent.name}&quot;
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Nivo k ap kreye: <strong>{LEVEL_CONFIG[addForm.type]?.label || addForm.type}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAddModalParent(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#64748B',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateArea}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Nivo Yerachik
                </label>
                <select
                  value={addForm.type}
                  onChange={e => setAddForm(prev => ({ ...prev, type: e.target.value as AreaType }))}
                  className="form-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                >
                  <option value="ARRONDISSEMENT">Awondisman (Arrondissement)</option>
                  <option value="COMMUNE">Komin (Commune)</option>
                  <option value="COMMUNAL_SECTION">Seksyon Kominal</option>
                  <option value="ZONE">Zòn Livrezon Estanda</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Non Ofisyèl (Franse) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Petite-Anse"
                    value={addForm.name}
                    onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Non Kreyòl
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ti Ans"
                    value={addForm.nameKr}
                    onChange={e => setAddForm(prev => ({ ...prev, nameKr: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Kòd Inik *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: HTI-N-CAP-PA"
                    value={addForm.code}
                    onChange={e => setAddForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="form-input"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace' }}
                  />
                </div>

                {addForm.type === 'ZONE' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Reyon Sèvis (km)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="Ex: 2.5"
                      value={addForm.radiusKm}
                      onChange={e => setAddForm(prev => ({ ...prev, radiusKm: e.target.value }))}
                      className="form-input"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="activeNewCheck"
                  checked={addForm.isActive}
                  onChange={e => setAddForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#FF6000' }}
                />
                <label htmlFor="activeNewCheck" style={{ fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  Aktive zòn sa a touswit apre kreyasyon an
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAddModalParent(null)}
                  style={{ fontSize: 13 }}
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="btn btn-primary"
                  style={{ fontSize: 13, fontWeight: 800 }}
                >
                  {actionLoading === 'create' ? 'Kreyasyon...' : 'Kreye Zòn nan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// COMPONENT: AREA TREE NODE (Recursive for all levels)
// ============================================================
interface AreaTreeNodeProps {
  area: ServiceArea;
  allAreas: ServiceArea[];
  childrenMap: Record<string, ServiceArea[]>;
  pricingMap: Record<string, AreaPricing>;
  expandedNodes: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onToggleActive: (area: ServiceArea) => void;
  onOpenPricing: (area: ServiceArea) => void;
  onAddChild: (area: ServiceArea) => void;
  actionLoading: string | null;
}

function AreaTreeNode({
  area,
  allAreas,
  childrenMap,
  pricingMap,
  expandedNodes,
  onToggleExpand,
  onToggleActive,
  onOpenPricing,
  onAddChild,
  actionLoading,
}: AreaTreeNodeProps) {
  const children = childrenMap[area.id] || [];
  const isExpanded = !!expandedNodes[area.id];
  const hasChildren = children.length > 0;

  // Hierarchical validation
  const availability = isAreaEffectivelyActive(area, allAreas);
  const effectivePricingResult = getEffectivePricing(area.id, allAreas, pricingMap);

  const level = LEVEL_CONFIG[area.type];
  const isLeaf = area.type === 'ZONE';

  return (
    <div
      style={{
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        background: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      {/* Node Header Row */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: isExpanded ? '#F8FAFC' : '#FFFFFF',
          borderBottom: isExpanded && hasChildren ? '1px solid #E2E8F0' : 'none',
        }}
      >
        {/* Left: Expand Caret + Level Badge + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 260 }}>
          {!isLeaf ? (
            <button
              onClick={() => onToggleExpand(area.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#64748B',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
              title={isExpanded ? 'Fèmen' : 'Louvri'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div style={{ width: 24 }} />
          )}

          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              background: level.bg,
              color: level.color,
              border: `1px solid ${level.border}`,
            }}
          >
            {level.label}
          </span>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                {area.name}
              </span>
              {area.nameKr && area.nameKr !== area.name && (
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                  ({area.nameKr})
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
              {area.code} {area.radiusKm ? `• Reyon: ${area.radiusKm} km` : ''}
            </div>
          </div>
        </div>

        {/* Center: Status Badge with Parent Hierarchy Enforcement */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {availability.isAvailable ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 20,
                background: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803D' }} />
              AKTIFF & DISPONIB
            </span>
          ) : availability.reason === 'PARENT_INACTIVE' ? (
            <span
              title={`Zòn sa a pa disponib paske paran li "${availability.blockingParent?.name}" inaktif!`}
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 20,
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid #FECACA',
                cursor: 'help',
              }}
            >
              🔒 BLOKE (Paran Inaktif: {availability.blockingParent?.name})
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 20,
                background: '#F1F5F9',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8' }} />
              DEZAKTIVE
            </span>
          )}

          {/* Pricing Info Badge */}
          {effectivePricingResult.pricing ? (
            <span
              onClick={() => onOpenPricing(area)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 8,
                background: effectivePricingResult.isDirect ? '#FFF7ED' : '#F8FAFC',
                color: effectivePricingResult.isDirect ? '#C2410C' : '#475569',
                border: `1px solid ${effectivePricingResult.isDirect ? '#FED7AA' : '#E2E8F0'}`,
                cursor: 'pointer',
              }}
              title={
                effectivePricingResult.isDirect
                  ? 'Tarif espesifik pou zòn sa a'
                  : `Erite de ${effectivePricingResult.inheritedFrom?.name}`
              }
            >
              💰 {effectivePricingResult.pricing.baseFee} HTG Base
              {effectivePricingResult.isDirect ? ' (Dirèk)' : ` (↳ ${effectivePricingResult.inheritedFrom?.name})`}
            </span>
          ) : (
            <span
              onClick={() => onOpenPricing(area)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 8,
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px dashed #FCA5A5',
                cursor: 'pointer',
              }}
              title="Klike pou konfigire pri pou zòn sa a"
            >
              ⚠️ Tarif Poko Konfigire
            </span>
          )}
        </div>

        {/* Right: Actions (Toggle, Pricing, Add Child) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Active Switch */}
          <button
            onClick={() => onToggleActive(area)}
            disabled={actionLoading === area.id}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: area.isActive ? '#EFF6FF' : '#F1F5F9',
              color: area.isActive ? '#1D4ED8' : '#64748B',
              transition: 'all 0.15s',
            }}
          >
            {actionLoading === area.id ? '...' : area.isActive ? 'Aktif' : 'Inaktif'}
          </button>

          {/* Pricing button */}
          <button
            onClick={() => onOpenPricing(area)}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700 }}
            title="Konfigire Tarif"
          >
            ⚙️ Tarif
          </button>

          {/* Add Child button (if not a leaf zone) */}
          {!isLeaf && (
            <button
              onClick={() => onAddChild(area)}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700 }}
              title="Ajoute sou-zòn"
            >
              ➕
            </button>
          )}
        </div>
      </div>

      {/* Children Node container (collapsible) */}
      {isExpanded && hasChildren && (
        <div
          style={{
            padding: '12px 16px 16px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          {children.map(child => (
            <AreaTreeNode
              key={child.id}
              area={child}
              allAreas={allAreas}
              childrenMap={childrenMap}
              pricingMap={pricingMap}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onToggleActive={onToggleActive}
              onOpenPricing={onOpenPricing}
              onAddChild={onAddChild}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

