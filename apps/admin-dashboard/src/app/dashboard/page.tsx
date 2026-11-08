'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, getOrders } from '../../lib/supabase';
import {
  IconDashboard,
  IconOrders,
  IconFinance,
  IconDrivers,
  IconMerchants,
  IconCustomers,
  IconLiveMap,
  IconZones,
  IconRefresh,
  IconTrendUp,
} from '../../components/Icons';

interface DashboardStats {
  orders: { total: number; delivered: number; pending: number; completionRate: string };
  users: { totalCustomers: number; activeDrivers: number; totalMerchants: number };
  revenue: { grossRevenue: number; platformRevenue: number; merchantPayouts: number; driverPayouts: number; currency: string };
}

function formatHTG(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M HTG`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k HTG`;
  return `${value.toFixed(0)} HTG`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  RESTAURANT_ACCEPTED: 'Resto accepté',
  PREPARING: 'En cuisine',
  READY_FOR_PICKUP: 'Prête',
  DRIVER_ASSIGNED: 'Livreur assigné',
  DRIVER_ARRIVING: 'Livreur en route',
  PICKED_UP: 'Prise en charge',
  IN_TRANSIT: 'En cours de livraison',
  DELIVERED: 'Livrée avec succès',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#06B6D4',
  RESTAURANT_ACCEPTED: '#06B6D4',
  PREPARING: '#8B5CF6',
  READY_FOR_PICKUP: '#3B82F6',
  DRIVER_ASSIGNED: '#6366F1',
  DRIVER_ARRIVING: '#EC4899',
  PICKED_UP: '#FF5630',
  IN_TRANSIT: '#EB1700',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setRefreshing(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        getDashboardStats(),
        getOrders(100),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 8));

      // Calculate order status distribution
      const counts: Record<string, number> = {};
      ordersData.forEach((o: any) => {
        const st = o.status || 'PENDING';
        counts[st] = (counts[st] || 0) + 1;
      });
      setStatusDistribution(counts);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const pendingCount = stats?.orders.pending || 0;
  const totalOrdersCount = stats?.orders.total || recentOrders.length || 1;

  return (
    <>
      {/* Topbar */}
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
              <IconDashboard size={18} color="#FFFFFF" />
            </div>
            <span>Tableau de Bord & Supervision</span>
          </div>
          <div className="topbar-subtitle">
            Supervision temps réel • Cap-Haïtien & Grand Nord, Haïti
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* Urgent Alert Banner — Command Center Style */}
        {pendingCount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #1E2433 0%, #252D3D 100%)',
            border: 'none',
            borderLeft: '4px solid #FF6000',
            borderRadius: 14,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 28px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,96,0,0.15)',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Pulse Icon */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255,96,0,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF6000',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={18} height={18}>
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                {/* Animated pulse ring */}
                <span style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: 38, height: 38,
                  borderRadius: '50%',
                  border: '2px solid #FF6000',
                  opacity: 0.5,
                  animation: 'pulse-ring 2s ease-out infinite',
                }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: 14, letterSpacing: '-0.2px' }}>
                    {pendingCount} commande(s) en attente de traitement
                  </span>
                  <span style={{
                    background: '#FF6000',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 20,
                    letterSpacing: '0.3px',
                  }}>
                    URGENT
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                  Ces commandes nécessitent une confirmation marchand ou une assignation livreur.
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/dispatch"
              style={{
                background: '#FF6000',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12,
                padding: '8px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(255,96,0,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={13} height={13}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Aller au Dispatch
            </Link>
          </div>
        )}

        {/* Brand Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFAF5 0%, #FFFFFF 100%)',
          border: '1px solid rgba(255,96,0,0.12)',
          borderRadius: 14,
          padding: '18px 22px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
              Bienvenue sur l&apos;Administration Delivery Lakay
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Plateforme active &bull; Données synchronisées avec Supabase en temps réel
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/dashboard/live-map" className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconLiveMap size={14} color="#EB1700" />
              <span>Carte en direct</span>
            </Link>
            <Link href="/dashboard/dispatch" className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Centre Dispatch</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards (4 cols) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Volume de Commandes</span>
              <div className="stat-card-icon orange"><IconOrders size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{loading ? '...' : stats?.orders.total || 0}</div>
            <div className="stat-card-sub">{stats?.orders.completionRate}% de complétion</div>
            <div className="stat-card-trend up">
              <IconTrendUp size={12} color="currentColor" />
              <span>{stats?.orders.delivered || 0} livrées avec succès</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Volume d&apos;Affaires Brut</span>
              <div className="stat-card-icon pink"><IconFinance size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--primary)' }}>
              {loading ? '...' : formatHTG(stats?.revenue.grossRevenue || 0)}
            </div>
            <div className="stat-card-sub">Total ventes transactions</div>
            <div className="stat-card-trend up">
              <span>Commission: {formatHTG(stats?.revenue.platformRevenue || 0)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Livreurs Partenaires</span>
              <div className="stat-card-icon blue"><IconDrivers size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{loading ? '...' : stats?.users.activeDrivers || 0}</div>
            <div className="stat-card-sub">Chauffeurs moto & vélo actifs</div>
            <div className="stat-card-trend up">
              <span>Approuvés pour dispatch</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Restaurants & Marchands</span>
              <div className="stat-card-icon green"><IconMerchants size={18} color="currentColor" /></div>
            </div>
            <div className="stat-card-value">{loading ? '...' : stats?.users.totalMerchants || 0}</div>
            <div className="stat-card-sub">Partenaires vérifiés</div>
            <div className="stat-card-trend up">
              <span>Cap-Haïtien & environs</span>
            </div>
          </div>
        </div>

        {/* Revenue Distribution Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 18, borderLeft: '4px solid #EB1700' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>COMMISSIONS SERVICE</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#EB1700', marginTop: 4 }}>
              {loading ? '...' : formatHTG(stats?.revenue.platformRevenue || 0)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Gains nets de la plateforme</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>REVERSEMENTS MARCHANDS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
              {loading ? '...' : formatHTG(stats?.revenue.merchantPayouts || 0)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Valeur marchande des commandes</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #3B82F6' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>FRAIS DE LIVRAISON REVERSÉS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
              {loading ? '...' : formatHTG(stats?.revenue.driverPayouts || 0)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Revenus des coursiers partenaires</div>
          </div>
        </div>

        {/* Status Distribution Visual Bar */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">Répartition des Commandes par Étape</span>
            <span className="badge badge-info" style={{ fontSize: 11 }}>Flux Opérationnel</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
            {Object.keys(STATUS_LABELS).map(key => {
              const count = statusDistribution[key] || 0;
              const color = STATUS_COLORS[key] || '#64748B';
              const pct = Math.round((count / totalOrdersCount) * 100);

              return (
                <div key={key} style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {STATUS_LABELS[key]}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 900, color }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.max(pct, count > 0 ? 8 : 0))}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Access Modules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { href: '/dashboard/orders', title: 'Commandes', desc: 'Gestion des livraisons & statuts', badge: `${stats?.orders.total || 0}`, Icon: IconOrders },
            { href: '/dashboard/dispatch', title: 'Centre de Dispatch', desc: 'Attribution intelligente aux coursiers', badge: 'LIVE', Icon: IconOrders, isLive: true },
            { href: '/dashboard/live-map', title: 'Carte en Direct', desc: 'Suivi GPS des livreurs et courses', badge: 'GPS', Icon: IconLiveMap, isLive: true },
            { href: '/dashboard/pricing', title: 'Tarification', desc: 'Grille de prix par zone & simulateur', badge: 'HTG', Icon: IconFinance },
            { href: '/dashboard/zones', title: 'Zones Géographiques', desc: 'Cap-Haïtien, Vertières, Bande du Nord', badge: 'MAP', Icon: IconZones },
            { href: '/dashboard/finance', title: 'Gestion Financière', desc: 'Flux MonCash, Natcash & Payouts', badge: 'PORTAL', Icon: IconFinance },
          ].map(module => (
            <Link
              key={module.href}
              href={module.href}
              className="card"
              style={{
                textDecoration: 'none',
                padding: 18,
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--surface-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}>
                  <module.Icon size={20} color="currentColor" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{module.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{module.desc}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 8,
                    background: module.isLive ? 'rgba(235,23,0,0.1)' : 'var(--surface-3)',
                    color: module.isLive ? '#EB1700' : 'var(--text-secondary)',
                  }}
                >
                  {module.badge}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Orders Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Dernières Commandes Passées</span>
            <Link href="/dashboard/orders" className="text-xs font-semibold" style={{ color: '#EB1700', textDecoration: 'none' }}>
              Voir toutes les commandes →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Chargement des commandes...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucune commande récente</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Commande</th>
                    <th>Client</th>
                    <th>Marchand</th>
                    <th>Total</th>
                    <th>Paiement</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => {
                    const stColor = STATUS_COLORS[o.status] || '#64748B';
                    return (
                      <tr key={o.id}>
                        <td className="font-mono" style={{ color: '#EB1700', fontWeight: 800 }}>
                          #{o.orderNumber || o.id?.slice(0, 8)}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Client Anonyme'}
                        </td>
                        <td className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {o.merchant?.name || '—'}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: 14 }}>
                          {Number(o.total || 0).toLocaleString()} HTG
                        </td>
                        <td className="text-xs font-bold font-mono" style={{ color: 'var(--text-muted)' }}>
                          {o.paymentMethod || 'CASH'}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: `${stColor}18`,
                              color: stColor,
                              border: `1px solid ${stColor}33`,
                            }}
                          >
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </td>
                        <td className="text-xs text-muted">
                          {new Date(o.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
