'use client';
import { useEffect, useState, useMemo } from 'react';
import { getOrders, updateOrderStatus, supabase } from '../../../lib/supabase';
import {
  IconOrders,
  IconRefresh,
  IconSearch,
  IconEye,
  IconCheck,
  IconClock,
  IconMapPin,
  IconPhone,
  IconX,
  IconTrendUp,
  IconDrivers,
} from '../../../components/Icons';

const STATUS_LABELS: Record<string, { label: string; badgeClass: string; color: string; icon: string }> = {
  PENDING: { label: 'En attente', badgeClass: 'badge-warning', color: '#f59e0b', icon: '●' },
  CONFIRMED: { label: 'Confirmée', badgeClass: 'badge-info', color: '#3b82f6', icon: '●' },
  PREPARING: { label: 'En cuisine', badgeClass: 'badge-purple', color: '#a855f7', icon: '●' },
  READY_FOR_PICKUP: { label: 'Prête au resto', badgeClass: 'badge-info', color: '#06b6d4', icon: '●' },
  DRIVER_ASSIGNED: { label: 'Livreur assigné', badgeClass: 'badge-info', color: '#6366f1', icon: '●' },
  PICKED_UP: { label: 'Récupérée', badgeClass: 'badge-purple', color: '#8b5cf6', icon: '●' },
  IN_TRANSIT: { label: 'En transit', badgeClass: 'badge-purple', color: '#d946ef', icon: '●' },
  DELIVERED: { label: 'Livrée avec succès', badgeClass: 'badge-success', color: '#10b981', icon: '✓' },
  CANCELLED: { label: 'Annulée', badgeClass: 'badge-danger', color: '#ef4444', icon: '✕' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetchOrders();

    const channel = supabase.channel('orders-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    const interval = setInterval(fetchOrders, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function fetchOrders() {
    try {
      const data = await getOrders(100);
      setOrders(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Erreur Supabase:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    setActionLoading(true);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      try {
        await fetch(`${BACKEND_URL}/api/v1/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (_) {}

      await updateOrderStatus(orderId, newStatus);
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut.');
    } finally {
      setActionLoading(false);
    }
  }

  // Live KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const activeOrders = orders.filter(o =>
      ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
    );
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

    const totalRevenueHTG = orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const successRate = totalCount > 0 ? Math.round((deliveredOrders.length / totalCount) * 100) : 0;

    return {
      totalCount,
      activeCount: activeOrders.length,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      totalRevenueHTG,
      successRate,
    };
  }, [orders]);

  // Counts by specific category for tabs
  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter(o => o.status === 'PENDING').length,
      PREPARING: orders.filter(o => ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)).length,
      IN_TRANSIT: orders.filter(o => ['DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    };
  }, [orders]);

  // Filtered orders list
  const filtered = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      let matchStatus = true;
      if (filterStatus === 'PENDING') {
        matchStatus = o.status === 'PENDING';
      } else if (filterStatus === 'PREPARING') {
        matchStatus = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status);
      } else if (filterStatus === 'IN_TRANSIT') {
        matchStatus = ['DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status);
      } else if (filterStatus === 'DELIVERED') {
        matchStatus = o.status === 'DELIVERED';
      } else if (filterStatus === 'CANCELLED') {
        matchStatus = o.status === 'CANCELLED';
      }

      // Payment filter
      const matchPayment = filterPayment === 'ALL' || o.paymentMethod === filterPayment;

      // Text search
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.customer?.firstName?.toLowerCase().includes(q) ||
        o.customer?.lastName?.toLowerCase().includes(q) ||
        o.customer?.phoneNumber?.includes(q) ||
        o.merchant?.name?.toLowerCase().includes(q) ||
        o.driver?.user?.firstName?.toLowerCase().includes(q) ||
        o.driver?.user?.lastName?.toLowerCase().includes(q) ||
        o.driver?.vehiclePlate?.toLowerCase().includes(q);

      return matchStatus && matchPayment && matchSearch;
    });
  }, [orders, filterStatus, filterPayment, search]);

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
              <IconOrders size={18} color="#FFFFFF" />
            </div>
            <span>Gestion des Commandes</span>
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
            <span>Temps réel Supabase &bull; {orders.length} commandes enregistrées</span>
            <span style={{ color: 'var(--text-muted)' }}>&bull; Synchro: {lastRefreshed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={fetchOrders}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px' }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* KPI Metrics Row */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {/* Total Orders */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Total Commandes</span>
              <div className="stat-card-icon pink">
                <IconOrders size={18} color="#FF4D26" />
              </div>
            </div>
            <div className="stat-card-value">{metrics.totalCount}</div>
            <div className="stat-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconClock size={12} color="var(--text-muted)" />
              <span>Depuis le lancement</span>
            </div>
          </div>

          {/* En Cours / Actives */}
          <div className="stat-card" style={{ borderColor: metrics.activeCount > 0 ? 'rgba(255, 107, 0, 0.4)' : undefined }}>
            <div className="stat-card-header">
              <span className="stat-card-label">En Cours / Actives</span>
              <div className="stat-card-icon orange">
                <IconOrders size={18} color="currentColor" />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#FF8533' }}>
              {metrics.activeCount}
            </div>
            <div className="stat-card-sub">
              {metrics.activeCount > 0 ? (
                <span style={{ color: '#FF8533', fontWeight: 600 }}>Cuisine, transit & cours</span>
              ) : (
                'Aucune commande en attente'
              )}
            </div>
          </div>

          {/* Livrées avec Succès */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Livrées (Succès)</span>
              <div className="stat-card-icon green">
                <IconCheck size={18} color="#10b981" />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#10b981' }}>
              {metrics.deliveredCount}
            </div>
            <div className="stat-card-sub">
              <span style={{ color: '#10b981', fontWeight: 600 }}>{metrics.successRate}%</span> de taux de réussite
            </div>
          </div>

          {/* Volume Total HTG */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Volume Total</span>
              <div className="stat-card-icon blue">
                <IconTrendUp size={18} color="#3b82f6" />
              </div>
            </div>
            <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
              {metrics.totalRevenueHTG.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>HTG</span>
            </div>
            <div className="stat-card-sub">
              Paiements validés & en cours
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
            {/* Status Navigation Tabs with smooth horizontal scroll on mobile */}
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
                { key: 'ALL', label: 'Toutes', count: statusCounts.ALL },
                { key: 'PENDING', label: 'En attente', count: statusCounts.PENDING, badgeColor: '#f59e0b' },
                { key: 'PREPARING', label: 'En préparation', count: statusCounts.PREPARING, badgeColor: '#a855f7' },
                { key: 'IN_TRANSIT', label: 'En livraison', count: statusCounts.IN_TRANSIT, badgeColor: '#06b6d4' },
                { key: 'DELIVERED', label: 'Livrées', count: statusCounts.DELIVERED, badgeColor: '#10b981' },
                { key: 'CANCELLED', label: 'Annulées', count: statusCounts.CANCELLED, badgeColor: '#ef4444' },
              ].map(tab => {
                const isActive = filterStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
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

            {/* Right: Search & Payment filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: '1 1 280px', justifyContent: 'flex-end' }}>
              {/* Payment filter dropdown */}
              <select
                className="form-input"
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
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
                <option value="ALL">💳 Tous paiements</option>
                <option value="MONCASH">🔴 MonCash</option>
                <option value="NATCASH">🔵 Natcash</option>
                <option value="CASH">🟡 Cash à livraison</option>
              </select>

              {/* Search bar */}
              <div style={{ position: 'relative', flex: '2 1 200px', minWidth: 180 }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <IconSearch size={14} />
                </div>
                <input
                  type="text"
                  placeholder="N° commande, client, marchand..."
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

        {/* Orders Container (Dual Mode: Desktop Table & Mobile Cards) */}
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
              <div style={{ fontSize: 14 }}>Chargement des commandes depuis Supabase...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
              <h3 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune commande trouvée</h3>
              <p style={{ fontSize: 13 }}>
                {search || filterStatus !== 'ALL' || filterPayment !== 'ALL'
                  ? 'Essayez de réinitialiser vos filtres de recherche.'
                  : 'Les commandes passées par les clients apparaîtront ici en direct.'}
              </p>
              {(search || filterStatus !== 'ALL' || filterPayment !== 'ALL') && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('ALL');
                    setFilterPayment('ALL');
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
                  <table className="table" style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          COMMANDE
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          DATE & HEURE
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          CLIENT
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          MARCHAND
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          LIVREUR
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                          PAIEMENT
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
                          MONTANT
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                          STATUT
                        </th>
                        <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(order => {
                        const st = STATUS_LABELS[order.status] || {
                          label: order.status,
                          badgeClass: 'badge-info',
                          color: '#3b82f6',
                          icon: '•',
                        };

                        const orderDate = new Date(order.createdAt);
                        const formattedDate = orderDate.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        });
                        const formattedTime = orderDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const paymentStyle =
                          order.paymentMethod === 'MONCASH'
                            ? { bg: 'rgba(229, 9, 20, 0.12)', color: '#FF3333', border: '1px solid rgba(229, 9, 20, 0.3)' }
                            : order.paymentMethod === 'NATCASH'
                            ? { bg: 'rgba(0, 163, 224, 0.12)', color: '#00B0FF', border: '1px solid rgba(0, 163, 224, 0.3)' }
                            : { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };

                        return (
                          <tr
                            key={order.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: 'var(--primary-500)',
                                  fontSize: 13,
                                  textAlign: 'left',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                #{order.orderNumber || order.id?.slice(0, 8)}
                              </button>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {order.order_items?.length ? `${order.order_items.length} article(s)` : 'Panier'}
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{formattedDate}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formattedTime}</div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div
                                  style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    background: 'var(--surface-4)',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {order.customer?.firstName ? order.customer.firstName.charAt(0) : 'C'}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Client Anonyme'}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <IconPhone size={10} color="var(--text-muted)" />
                                    <span>{order.customer?.phoneNumber || '—'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 15 }}>🏪</span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {order.merchant?.name || 'Marchand'}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {order.merchant?.address || 'Cap-Haïtien'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              {order.driver ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 15 }}>🏍️</span>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                      {order.driver.user?.firstName} {order.driver.user?.lastName}
                                    </div>
                                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                      {order.driver.vehiclePlate || '—'}
                                    </div>
                                  </div>
                                </div>
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
                                  ⏳ Non assigné
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: paymentStyle.bg,
                                  color: paymentStyle.color,
                                  border: paymentStyle.border,
                                }}
                              >
                                {order.paymentMethod || 'CASH'}
                              </span>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                {order.paymentStatus === 'PAID' ? '✓ Payé' : order.paymentStatus || 'En attente'}
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {Number(order.total || 0).toLocaleString()} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>HTG</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Frais: {Number(order.deliveryFee || 0)} HTG
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '4px 10px',
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: `${st.color}18`,
                                  color: st.color,
                                  border: `1px solid ${st.color}35`,
                                }}
                              >
                                <span>{st.icon}</span>
                                <span>{st.label}</span>
                              </span>
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setSelectedOrder(order)}
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

                                {!order.driver && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status) && (
                                  <a
                                    href={`/dashboard/dispatch?orderId=${order.id}`}
                                    className="btn btn-sm btn-primary"
                                    style={{
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 12,
                                      padding: '5px 10px',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    Dispatche
                                  </a>
                                )}
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
                {filtered.map(order => {
                  const st = STATUS_LABELS[order.status] || {
                    label: order.status,
                    badgeClass: 'badge-info',
                    color: '#3b82f6',
                    icon: '•',
                  };

                  const orderDate = new Date(order.createdAt);
                  const formattedTime = orderDate.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={order.id}
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
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                        <div>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: 'var(--primary-500)',
                              fontSize: 14,
                              textAlign: 'left',
                            }}
                          >
                            #{order.orderNumber || order.id?.slice(0, 8)}
                          </button>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formattedTime}</div>
                        </div>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 14,
                            fontSize: 11,
                            fontWeight: 700,
                            background: `${st.color}18`,
                            color: st.color,
                            border: `1px solid ${st.color}35`,
                          }}
                        >
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </span>
                      </div>

                      {/* Card Body */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Client:</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Client Anonyme'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Marchand:</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {order.merchant?.name || 'Marchand'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Livreur:</span>
                          <span>
                            {order.driver ? (
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                🏍️ {order.driver.user?.firstName} {order.driver.user?.lastName} ({order.driver.vehiclePlate})
                              </span>
                            ) : (
                              <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>⏳ Non assigné</span>
                            )}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTop: '1px dashed var(--border-subtle)' }}>
                          <div>
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 800,
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              {order.paymentMethod || 'CASH'}
                            </span>
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-500)' }}>
                            {Number(order.total || 0).toLocaleString()} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>HTG</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedOrder(order)}
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

                        {!order.driver && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.status) && (
                          <a
                            href={`/dashboard/dispatch?orderId=${order.id}`}
                            className="btn btn-sm btn-primary"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              fontSize: 12,
                              padding: '8px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Dispatche
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Order Detail Modal */}
        {selectedOrder && (
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
                maxWidth: 720,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'var(--gradient-brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-glow)',
                    }}
                  >
                    <IconOrders size={20} color="#FFFFFF" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Commande #{selectedOrder.orderNumber || selectedOrder.id?.slice(0, 8)}
                      </h2>
                      {STATUS_LABELS[selectedOrder.status] && (
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: `${STATUS_LABELS[selectedOrder.status].color}20`,
                            color: STATUS_LABELS[selectedOrder.status].color,
                            border: `1px solid ${STATUS_LABELS[selectedOrder.status].color}40`,
                          }}
                        >
                          {STATUS_LABELS[selectedOrder.status].label}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      UUID: {selectedOrder.id}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
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
                {/* Banner if driver unassigned */}
                {!selectedOrder.driver && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(selectedOrder.status) && (
                  <div
                    style={{
                      padding: '14px 18px',
                      marginBottom: 20,
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b',
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={15} height={15}>
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                          Kòmand sa a poko gen chofè ki asinye
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Voye kous la bay yon chofè ki disponib nan sant dispatch la.
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/dashboard/dispatch?orderId=${selectedOrder.id}`}
                      className="btn btn-sm btn-primary"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#000',
                        fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                        padding: '8px 14px',
                      }}
                    >
                      Ouvri Sant Dispatch &rarr;
                    </a>
                  </div>
                )}

                {/* 3-column party info (Customer, Merchant, Driver) */}
                <div className="modal-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  {/* Customer Box */}
                  <div
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                      👤 Client
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedOrder.customer ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : 'Client Inconnu'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--primary-500)', marginTop: 2 }}>
                      {selectedOrder.customer?.phoneNumber || 'Pas de numéro'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <IconMapPin size={12} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{selectedOrder.deliveryAddress || 'Adresse non spécifiée'}</span>
                    </div>
                  </div>

                  {/* Merchant Box */}
                  <div
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                      🏪 Restaurant / Marchand
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedOrder.merchant?.name || 'Marchand'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {selectedOrder.merchant?.phone || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      {selectedOrder.merchant?.address || 'Cap-Haïtien'}
                    </div>
                  </div>

                  {/* Driver Box */}
                  <div
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                      🏍️ Livreur Assigné
                    </div>
                    {selectedOrder.driver ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedOrder.driver.user?.firstName} {selectedOrder.driver.user?.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {selectedOrder.driver.user?.phoneNumber || '—'}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--primary-500)', marginTop: 6 }}>
                          Plaque: {selectedOrder.driver.vehiclePlate || 'Non spécifiée'}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        Aucun coursier assigné
                      </div>
                    )}
                  </div>
                </div>

                {/* Items breakdown if available */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                    📦 Articles Commandés ({selectedOrder.order_items?.length || 0})
                  </div>
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedOrder.order_items.map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'var(--surface-3)',
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: 'rgba(255, 48, 8, 0.12)',
                                color: 'var(--primary-500)',
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              x{item.quantity || 1}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.name || item.productName || item.title || `Article #${idx + 1}`}
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)} HTG
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      Détail des articles non synchronisé (Commande globale)
                    </div>
                  )}

                  {/* Financial breakdown */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 14, paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Frais de livraison:</span>
                      <span>{Number(selectedOrder.deliveryFee || 0).toLocaleString()} HTG</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>
                      <span>Total Commande:</span>
                      <span style={{ color: 'var(--primary-500)' }}>{Number(selectedOrder.total || 0).toLocaleString()} HTG</span>
                    </div>
                  </div>
                </div>

                {/* Status Update Action Bar (Admin) */}
                <div
                  style={{
                    padding: 16,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                    Changer le statut en direct (Admin Master)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { key: 'CONFIRMED', label: 'Valider (Confirmée)', color: '#3b82f6' },
                      { key: 'PREPARING', label: 'En cuisine', color: '#a855f7' },
                      { key: 'READY_FOR_PICKUP', label: 'Prête', color: '#06b6d4' },
                      { key: 'IN_TRANSIT', label: 'En transit', color: '#d946ef' },
                      { key: 'DELIVERED', label: '✓ Livrée avec succès', color: '#10b981' },
                      { key: 'CANCELLED', label: '✕ Annuler la commande', color: '#ef4444' },
                    ].map(action => (
                      <button
                        key={action.key}
                        disabled={actionLoading || selectedOrder.status === action.key}
                        onClick={() => handleStatusChange(selectedOrder.id, action.key)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: selectedOrder.status === action.key ? 'default' : 'pointer',
                          opacity: selectedOrder.status === action.key ? 0.4 : 1,
                          background:
                            action.key === 'DELIVERED'
                              ? '#10b981'
                              : action.key === 'CANCELLED'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'var(--surface-3)',
                          color:
                            action.key === 'DELIVERED'
                              ? '#FFFFFF'
                              : action.key === 'CANCELLED'
                              ? '#ef4444'
                              : 'var(--text-primary)',
                          border: `1px solid ${action.color}40`,
                        }}
                      >
                        {actionLoading ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Payment Info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--surface-3)',
                    fontSize: 12,
                  }}
                >
                  <div>
                    Paiement: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.paymentMethod}</strong> (
                    <span style={{ color: selectedOrder.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b' }}>
                      {selectedOrder.paymentStatus || 'En attente'}
                    </span>
                    )
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    Créée le: {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
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
