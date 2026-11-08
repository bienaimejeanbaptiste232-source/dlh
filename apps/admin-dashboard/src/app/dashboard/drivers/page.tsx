'use client';
import { useEffect, useState, useMemo } from 'react';
import { getDrivers, updateDriverStatus, supabase } from '../../../lib/supabase';
import {
  IconDrivers,
  IconCheck,
  IconClock,
  IconRefresh,
  IconSearch,
  IconEye,
  IconMapPin,
  IconPhone,
  IconX,
  IconStar,
  IconWallets,
  IconTrendUp,
} from '../../../components/Icons';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ONLINE' | 'BUSY' | 'APPROVED' | 'PENDING'>('ALL');
  const [filterVehicle, setFilterVehicle] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetchDrivers();

    const channel = supabase
      .channel('drivers-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_profiles' }, () => {
        fetchDrivers();
      })
      .subscribe();

    const interval = setInterval(fetchDrivers, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function fetchDrivers() {
    try {
      const data = await getDrivers();
      setDrivers(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Supabase drivers error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleApproval(driverId: string, current: boolean) {
    setActionLoading(driverId);
    try {
      await updateDriverStatus(driverId, !current);
      await fetchDrivers();
      if (selectedDriver?.driverId === driverId) {
        setSelectedDriver((prev: any) => (prev ? { ...prev, isApproved: !current } : null));
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour de l’approbation.');
    } finally {
      setActionLoading(null);
    }
  }

  // Live Fleet KPI Metrics
  const metrics = useMemo(() => {
    const totalFleet = drivers.length;
    const onlineDrivers = drivers.filter(
      d => d.status === 'ONLINE' || d.status === 'AVAILABLE'
    );
    const busyDrivers = drivers.filter(
      d =>
        d.status === 'BUSY' ||
        d.status === 'IN_DELIVERY' ||
        d.status === 'ON_DELIVERY' ||
        d.status === 'DELIVERING'
    );
    const approvedDrivers = drivers.filter(d => d.isApproved);
    const pendingDrivers = drivers.filter(d => !d.isApproved);

    const totalDeliveries = drivers.reduce((acc, d) => acc + (d.totalDeliveries || 0), 0);
    const avgRating =
      drivers.length > 0
        ? (drivers.reduce((acc, d) => acc + (d.rating || 5), 0) / drivers.length).toFixed(1)
        : '5.0';

    return {
      totalFleet,
      onlineCount: onlineDrivers.length,
      busyCount: busyDrivers.length,
      approvedCount: approvedDrivers.length,
      pendingCount: pendingDrivers.length,
      totalDeliveries,
      avgRating,
    };
  }, [drivers]);

  // Tab live counts
  const tabCounts = useMemo(() => {
    return {
      ALL: drivers.length,
      ONLINE: drivers.filter(d => d.status === 'ONLINE' || d.status === 'AVAILABLE').length,
      BUSY: drivers.filter(
        d =>
          d.status === 'BUSY' ||
          d.status === 'IN_DELIVERY' ||
          d.status === 'ON_DELIVERY' ||
          d.status === 'DELIVERING'
      ).length,
      APPROVED: drivers.filter(d => d.isApproved).length,
      PENDING: drivers.filter(d => !d.isApproved).length,
    };
  }, [drivers]);

  // Filtered drivers list
  const filtered = useMemo(() => {
    return drivers.filter(d => {
      // Tab filter
      let matchTab = true;
      if (filterTab === 'ONLINE') {
        matchTab = d.status === 'ONLINE' || d.status === 'AVAILABLE';
      } else if (filterTab === 'BUSY') {
        matchTab =
          d.status === 'BUSY' ||
          d.status === 'IN_DELIVERY' ||
          d.status === 'ON_DELIVERY' ||
          d.status === 'DELIVERING';
      } else if (filterTab === 'APPROVED') {
        matchTab = d.isApproved;
      } else if (filterTab === 'PENDING') {
        matchTab = !d.isApproved;
      }

      // Vehicle filter
      const matchVehicle =
        filterVehicle === 'ALL' ||
        d.vehicleType?.toLowerCase() === filterVehicle.toLowerCase();

      // Search query
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.vehiclePlate?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q);

      return matchTab && matchVehicle && matchSearch;
    });
  }, [drivers, filterTab, filterVehicle, search]);

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
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <IconDrivers size={18} color="#FFFFFF" />
            </div>
            <span>Gestion de la Flotte & Livreurs</span>
          </div>
          <div className="topbar-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>Flotte active à Cap-Haïtien &bull; {drivers.length} livreurs enregistrés</span>
            <span style={{ color: 'var(--text-muted)' }}>
              &bull; Synchro: {lastRefreshed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchDrivers}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px' }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* KPI Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {/* Total Fleet */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Flotte Totale</span>
              <div className="stat-card-icon pink">
                <IconDrivers size={18} color="#FF4D26" />
              </div>
            </div>
            <div className="stat-card-value">{metrics.totalFleet}</div>
            <div className="stat-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMapPin size={12} color="var(--text-muted)" />
              <span>Cap-Haïtien & Nord</span>
            </div>
          </div>

          {/* En Ligne GPS Actif */}
          <div className="stat-card" style={{ borderColor: metrics.onlineCount > 0 ? 'rgba(16, 185, 129, 0.4)' : undefined }}>
            <div className="stat-card-header">
              <span className="stat-card-label">En Ligne (GPS Actif)</span>
              <div className="stat-card-icon green">
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#10b981' }}>
              {metrics.onlineCount}
            </div>
            <div className="stat-card-sub">
              Prêts pour de nouvelles missions
            </div>
          </div>

          {/* En Course */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">En Course (Mission)</span>
              <div className="stat-card-icon orange">
                <span style={{ fontSize: 16 }}>🛵</span>
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#FF8533' }}>
              {metrics.busyCount}
            </div>
            <div className="stat-card-sub">
              Livreurs en transit / livraison
            </div>
          </div>

          {/* En Attente d'Approbation */}
          <div className="stat-card" style={{ borderColor: metrics.pendingCount > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
            <div className="stat-card-header">
              <span className="stat-card-label">En Attente de Validation</span>
              <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <IconClock size={18} color="#f59e0b" />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: metrics.pendingCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {metrics.pendingCount}
            </div>
            <div className="stat-card-sub">
              {metrics.pendingCount > 0 ? 'Profils à vérifier & approuver' : 'Tous les profils sont à jour'}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          className="card mb-4"
          style={{
            padding: '16px 20px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--border-radius)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            {/* Filter Tabs with horizontal touch scroll on mobile */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: 4,
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                flexShrink: 0,
              }}
            >
              {[
                { key: 'ALL', label: 'Tous', count: tabCounts.ALL },
                { key: 'ONLINE', label: '🟢 En Ligne', count: tabCounts.ONLINE },
                { key: 'BUSY', label: '🛵 En Course', count: tabCounts.BUSY },
                { key: 'APPROVED', label: '✓ Approuvés', count: tabCounts.APPROVED },
                { key: 'PENDING', label: '⏳ En Attente', count: tabCounts.PENDING },
              ].map(tab => {
                const isActive = filterTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilterTab(tab.key as any)}
                    style={{
                      padding: '7px 13px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? 'var(--gradient-brand)' : 'var(--surface-3)',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      border: isActive ? 'none' : '1px solid var(--border-subtle)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Vehicle selector & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: '1 1 280px', justifyContent: 'flex-end' }}>
              {/* Vehicle filter */}
              <select
                className="form-input"
                value={filterVehicle}
                onChange={e => setFilterVehicle(e.target.value)}
                style={{
                  fontSize: 12,
                  padding: '7px 10px',
                  background: 'var(--surface-3)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  height: 36,
                  flex: '1 1 140px',
                  minWidth: 130,
                }}
              >
                <option value="ALL">🛵 Tous véhicules</option>
                <option value="MOTO">🏍️ Moto</option>
                <option value="VOITURE">🚗 Voiture</option>
                <option value="VELO">🚲 Vélo</option>
              </select>

              {/* Search input */}
              <div style={{ position: 'relative', flex: '2 1 200px', minWidth: 180 }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <IconSearch size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Nom, tél, plaque..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 30px 7px 32px',
                    fontSize: 13,
                    borderRadius: 8,
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    height: 36,
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      padding: 2,
                    }}
                  >
                    <IconX size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Drivers Container (Dual Mode: Desktop Table & Mobile Cards) */}
        <div
          className="data-table-wrapper"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--border-radius)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid rgba(255, 48, 8, 0.2)',
                  borderTopColor: '#FF3008',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <div style={{ fontSize: 14 }}>Chargement des coursiers depuis Supabase...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏍️</div>
              <h3 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Aucun livreur trouvé</h3>
              <p style={{ fontSize: 13 }}>
                {search || filterTab !== 'ALL' || filterVehicle !== 'ALL'
                  ? 'Essayez de réinitialiser vos critères de recherche.'
                  : 'Les livreurs inscrits via l’application apparaîtront ici.'}
              </p>
              {(search || filterTab !== 'ALL' || filterVehicle !== 'ALL') && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setFilterTab('ALL');
                    setFilterVehicle('ALL');
                  }}
                  style={{ marginTop: 14 }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 1. DESKTOP TABLE VIEW (> 860px) */}
              <div className="desktop-table-view">
                <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table className="table" style={{ width: '100%', minWidth: 950, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          LIVREUR
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          CONTACT
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          VÉHICULE & PLAQUE
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                          DISPONIBILITÉ GPS
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                          NOTE
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                          LIVRAISONS
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
                          PORTEFEUILLE
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                          VALIDATION
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(driver => {
                        const isOnline = driver.status === 'ONLINE' || driver.status === 'AVAILABLE';
                        const isBusy =
                          driver.status === 'BUSY' ||
                          driver.status === 'IN_DELIVERY' ||
                          driver.status === 'ON_DELIVERY' ||
                          driver.status === 'DELIVERING';

                        const walletBalance = driver.wallet?.balance ? Number(driver.wallet.balance) : 0;

                        return (
                          <tr
                            key={driver.driverId}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    background: 'var(--gradient-brand)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: '#FFFFFF',
                                    boxShadow: isOnline ? '0 0 10px rgba(255, 48, 8, 0.4)' : 'none',
                                    flexShrink: 0,
                                    position: 'relative',
                                  }}
                                >
                                  {driver.name ? driver.name.charAt(0).toUpperCase() : 'L'}
                                  <span
                                    style={{
                                      position: 'absolute',
                                      bottom: 0,
                                      right: 0,
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      background: isOnline ? '#10b981' : isBusy ? '#FF8533' : '#6b7280',
                                      border: '2px solid var(--surface-2)',
                                    }}
                                  />
                                </div>
                                <div>
                                  <button
                                    onClick={() => setSelectedDriver(driver)}
                                    style={{
                                      fontWeight: 700,
                                      color: 'var(--text-primary)',
                                      fontSize: 13,
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {driver.name}
                                  </button>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                    {driver.email || 'Sans email'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <a
                                href={`tel:${driver.phone}`}
                                style={{
                                  fontSize: 13,
                                  color: 'var(--primary-500)',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                <IconPhone size={12} color="var(--primary-500)" />
                                <span>{driver.phone}</span>
                              </a>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: 'rgba(6, 182, 212, 0.12)',
                                    color: '#06b6d4',
                                    border: '1px solid rgba(6, 182, 212, 0.25)',
                                  }}
                                >
                                  {driver.vehicleType === 'VOITURE' ? '🚗 VOITURE' : driver.vehicleType === 'VELO' ? '🚲 VÉLO' : '🏍️ MOTO'}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    padding: '2px 6px',
                                    background: 'var(--surface-4)',
                                    borderRadius: 4,
                                  }}
                                >
                                  {driver.vehiclePlate || '—'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              {isOnline ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: '#10b981',
                                      boxShadow: '0 0 6px #10b981',
                                    }}
                                  />
                                  <span>En Ligne</span>
                                </span>
                              ) : isBusy ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: 'rgba(255, 107, 0, 0.12)',
                                    color: '#FF8533',
                                    border: '1px solid rgba(255, 107, 0, 0.3)',
                                  }}
                                >
                                  <span>🛵</span>
                                  <span>En Course</span>
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 8px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    background: 'var(--surface-4)',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  <span>Déconnecté</span>
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  color: '#f59e0b',
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                <IconStar size={12} color="#f59e0b" />
                                <span>{(driver.rating || 5).toFixed(1)}</span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {driver.totalDeliveries || 0}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>terminées</div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: walletBalance > 0 ? '#10b981' : 'var(--text-primary)' }}>
                                {walletBalance.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>HTG</span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              {driver.isApproved ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                  }}
                                >
                                  <IconCheck size={11} color="#10b981" />
                                  <span>Approuvé</span>
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    color: '#f59e0b',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                  }}
                                >
                                  <IconClock size={11} color="#f59e0b" />
                                  <span>En attente</span>
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setSelectedDriver(driver)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: 12,
                                    padding: '5px 10px',
                                  }}
                                >
                                  <IconEye size={13} color="currentColor" />
                                  <span>Détails</span>
                                </button>

                                <button
                                  onClick={() => toggleApproval(driver.driverId, driver.isApproved)}
                                  disabled={actionLoading === driver.driverId}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: driver.isApproved ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                                    color: driver.isApproved ? '#ef4444' : '#10b981',
                                    border: `1px solid ${driver.isApproved ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {actionLoading === driver.driverId
                                    ? '...'
                                    : driver.isApproved
                                    ? 'Suspendre'
                                    : 'Approuver'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. MOBILE & TABLET CARD FEED (<= 860px) */}
              <div className="mobile-cards-view" style={{ padding: 14 }}>
                {filtered.map(driver => {
                  const isOnline = driver.status === 'ONLINE' || driver.status === 'AVAILABLE';
                  const isBusy =
                    driver.status === 'BUSY' ||
                    driver.status === 'IN_DELIVERY' ||
                    driver.status === 'ON_DELIVERY' ||
                    driver.status === 'DELIVERING';

                  const walletBalance = driver.wallet?.balance ? Number(driver.wallet.balance) : 0;

                  return (
                    <div
                      key={driver.driverId}
                      style={{
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {/* Driver Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'var(--gradient-brand)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 800,
                              color: '#FFFFFF',
                              flexShrink: 0,
                              position: 'relative',
                            }}
                          >
                            {driver.name ? driver.name.charAt(0).toUpperCase() : 'L'}
                            <span
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: isOnline ? '#10b981' : isBusy ? '#FF8533' : '#6b7280',
                                border: '2px solid var(--surface-1)',
                              }}
                            />
                          </div>

                          <div>
                            <button
                              onClick={() => setSelectedDriver(driver)}
                              style={{
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                fontSize: 14,
                                textAlign: 'left',
                              }}
                            >
                              {driver.name}
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <IconStar size={11} color="#f59e0b" />
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                                {(driver.rating || 5).toFixed(1)}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                ({driver.totalDeliveries || 0} courses)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* GPS Status Badge */}
                        {isOnline ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 8px',
                              borderRadius: 14,
                              fontSize: 11,
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.14)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                            <span>En Ligne</span>
                          </span>
                        ) : isBusy ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 14,
                              fontSize: 11,
                              fontWeight: 700,
                              background: 'rgba(255, 107, 0, 0.14)',
                              color: '#FF8533',
                              border: '1px solid rgba(255, 107, 0, 0.3)',
                            }}
                          >
                            <span>🛵</span>
                            <span>En Course</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: 12,
                              fontSize: 11,
                              background: 'var(--surface-4)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Déconnecté
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Téléphone:</span>
                          <a
                            href={`tel:${driver.phone}`}
                            style={{ color: 'var(--primary-500)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <IconPhone size={12} color="var(--primary-500)" />
                            <span>{driver.phone}</span>
                          </a>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Véhicule & Plaque:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4' }}>
                              {driver.vehicleType === 'VOITURE' ? '🚗 VOITURE' : driver.vehicleType === 'VELO' ? '🚲 VÉLO' : '🏍️ MOTO'}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '1px 5px', background: 'var(--surface-4)', borderRadius: 4 }}>
                              {driver.vehiclePlate || '—'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Portefeuille:</span>
                          <span style={{ fontWeight: 700, color: walletBalance > 0 ? '#10b981' : 'var(--text-primary)' }}>
                            {walletBalance.toLocaleString()} HTG
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Validation:</span>
                          {driver.isApproved ? (
                            <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>✓ Approuvé</span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>⏳ En attente</span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedDriver(driver)}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            fontSize: 12,
                            padding: '8px',
                          }}
                        >
                          <IconEye size={13} color="currentColor" />
                          <span>Voir Détails</span>
                        </button>

                        <button
                          onClick={() => toggleApproval(driver.driverId, driver.isApproved)}
                          disabled={actionLoading === driver.driverId}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: driver.isApproved ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                            color: driver.isApproved ? '#ef4444' : '#10b981',
                            border: `1px solid ${driver.isApproved ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {actionLoading === driver.driverId
                            ? '...'
                            : driver.isApproved
                            ? 'Suspendre'
                            : 'Approuver'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Driver Detail Inspector Modal */}
        {selectedDriver && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.78)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(6px)',
              padding: 20,
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: 680,
                maxHeight: '92vh',
                overflowY: 'auto',
                border: '1px solid var(--border-default)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-xl)',
                background: 'var(--surface-1)',
                padding: 0,
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--surface-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: 'var(--gradient-brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      boxShadow: 'var(--shadow-glow)',
                    }}
                  >
                    {selectedDriver.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {selectedDriver.name}
                      </h2>
                      {selectedDriver.isApproved ? (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          ✓ Compte Vérifié
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          ⏳ En attente de validation
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Driver ID: {selectedDriver.driverId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDriver(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <IconX size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                {/* 3-column stats cards */}
                <div className="modal-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Note Globale
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <IconStar size={18} color="#f59e0b" />
                      <span>{(selectedDriver.rating || 5).toFixed(1)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>sur 5.0</div>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Courses Livrées
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedDriver.totalDeliveries || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>100% complétées</div>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Portefeuille
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>
                      {Number(selectedDriver.wallet?.balance || 0).toLocaleString()} <span style={{ fontSize: 11 }}>HTG</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Solde disponible</div>
                  </div>
                </div>

                {/* Driver Profile Details */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: 18,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                    👤 Informations Personnelles & Véhicule
                  </div>
                  <div className="modal-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Numéro de Téléphone</div>
                      <a
                        href={`tel:${selectedDriver.phone}`}
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary-500)', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2 }}
                      >
                        <IconPhone size={13} color="var(--primary-500)" />
                        <span>{selectedDriver.phone}</span>
                      </a>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Adresse Email</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
                        {selectedDriver.email || 'Aucune adresse renseignée'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type de Véhicule</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                        {selectedDriver.vehicleType === 'VOITURE' ? '🚗 Voiture' : selectedDriver.vehicleType === 'VELO' ? '🚲 Vélo' : '🏍️ Moto (Deux-roues)'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Immatriculation / Plaque</div>
                      <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {selectedDriver.vehiclePlate || 'Non renseignée'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date d’inscription</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {selectedDriver.createdAt ? new Date(selectedDriver.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Statut de Connexion</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                        {selectedDriver.status === 'ONLINE' ? (
                          <span style={{ color: '#10b981' }}>🟢 En ligne (Disponible)</span>
                        ) : selectedDriver.status === 'BUSY' ? (
                          <span style={{ color: '#FF8533' }}>🟡 En cours de livraison</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>⚪ Déconnecté</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPS Location Snippet if available */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconMapPin size={18} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Position GPS en Direct
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {selectedDriver.currentLatitude && selectedDriver.currentLongitude
                          ? `${Number(selectedDriver.currentLatitude).toFixed(4)}° N, ${Number(selectedDriver.currentLongitude).toFixed(4)}° W`
                          : 'Coordonnées GPS: Cap-Haïtien Centre (Par défaut)'}
                      </div>
                    </div>
                  </div>

                  {selectedDriver.currentLatitude && selectedDriver.currentLongitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${selectedDriver.currentLatitude},${selectedDriver.currentLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      Voir sur Maps &rarr;
                    </a>
                  ) : (
                    <a
                      href="/dashboard/dispatch"
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      Voir Carte Dispatch
                    </a>
                  )}
                </div>

                {/* Admin Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 10,
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Contrôle du Compte Livreur
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {selectedDriver.isApproved
                        ? 'Le livreur peut recevoir et accepter des commandes de livraison.'
                        : 'Le profil est bloqué en attente de vérification des pièces d’identité.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => toggleApproval(selectedDriver.driverId, selectedDriver.isApproved)}
                      disabled={actionLoading === selectedDriver.driverId}
                      className={`btn btn-sm ${selectedDriver.isApproved ? 'btn-danger' : 'btn-success'}`}
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {actionLoading === selectedDriver.driverId
                        ? 'Mise à jour...'
                        : selectedDriver.isApproved
                        ? 'Suspendre le Livreur'
                        : '✓ Valider & Approuver'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
