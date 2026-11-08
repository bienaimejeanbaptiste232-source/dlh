'use client';
import { useEffect, useState } from 'react';
import { getFinanceStats, getOrders } from '../../../lib/supabase';
import { IconMobile, IconCash, IconDrivers, IconFinance, IconRefresh, IconTrendUp } from '../../../components/Icons';

function formatHTG(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M HTG`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k HTG`;
  return `${v.toFixed(0)} HTG`;
}

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  MONCASH:          { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', border: 'rgba(239,68,68,0.3)',   gradient: 'linear-gradient(135deg,#ef4444,#b91c1c)' },
  NATCASH:          { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6', border: 'rgba(59,130,246,0.3)',  gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
  CASH_ON_DELIVERY: { bg: 'rgba(234,179,8,0.1)',   text: '#eab308', border: 'rgba(234,179,8,0.3)',   gradient: 'linear-gradient(135deg,#eab308,#a16207)' },
};

// ── Builds last-7-days revenue aggregation from orders ────────
function buildDailyRevenue(orders: any[]): { day: string; total: number; count: number }[] {
  const days: Record<string, { total: number; count: number }> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    days[key] = { total: 0, count: 0 };
  }
  for (const o of orders) {
    const d = new Date(o.createdAt);
    if ((now.getTime() - d.getTime()) > 7 * 86400000) continue;
    const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    if (days[key]) {
      days[key].total += parseFloat(o.total || 0);
      days[key].count += 1;
    }
  }
  return Object.entries(days).map(([day, v]) => ({ day, ...v }));
}

export default function FinancePage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinance();
    const interval = setInterval(loadFinance, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadFinance() {
    try {
      const [statsData, ordersData] = await Promise.all([
        getFinanceStats(),
        getOrders(200),
      ]);
      setStats(statsData);
      setAllOrders(ordersData);
      setRecentOrders(ordersData.slice(0, 20));
    } catch (e) {
      console.error('Supabase finance error:', e);
    } finally {
      setLoading(false);
    }
  }

  const breakdown = stats?.paymentBreakdown || {};
  const totalBreakdown = Object.values(breakdown).reduce((a: number, b) => a + (b as number), 0) as number;
  const dailyRevenue = buildDailyRevenue(allOrders);
  const maxDay = Math.max(...dailyRevenue.map(d => d.total), 1);

  const deliveredCount = allOrders.filter(o => o.status === 'DELIVERED').length;
  const completionRate = allOrders.length > 0 ? Math.round((deliveredCount / allOrders.length) * 100) : 0;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--gradient-brand)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)',
            }}>
              <IconFinance size={18} color="#FFFFFF" />
            </div>
            <span>Gestion Financière &amp; Réconciliation</span>
          </div>
          <div className="topbar-subtitle">
            Flux MonCash &bull; Natcash &bull; Espèces (Cash) &bull; Commissions Plateforme
          </div>
        </div>
        <div className="topbar-actions">
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadFinance}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <div className="page-container">

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            {
              label: "Volume d'Affaires Brut",
              value: loading ? '—' : formatHTG(stats?.revenue.totalGross || 0),
              sub: 'Total toutes commandes',
              icon: <IconFinance size={18} color="currentColor" />,
              cls: 'orange',
              trend: '↑ Données live',
            },
            {
              label: 'Commissions Plateforme',
              value: loading ? '—' : formatHTG(stats?.revenue.totalCommissions || 0),
              sub: 'Frais de service perçus',
              icon: <IconTrendUp size={18} color="currentColor" />,
              cls: 'pink',
              trend: `${completionRate}% taux de complétion`,
            },
            {
              label: 'Frais de Livraison',
              value: loading ? '—' : formatHTG(stats?.revenue.totalDeliveryFees || 0),
              sub: 'Redistribués aux livreurs',
              icon: <IconDrivers size={18} color="currentColor" />,
              cls: 'blue',
              trend: `${allOrders.filter(o => o.driverId).length} avec livreur assigné`,
            },
            {
              label: 'Commandes Total',
              value: loading ? '—' : String(allOrders.length),
              sub: `${deliveredCount} livrées avec succès`,
              icon: <IconFinance size={18} color="currentColor" />,
              cls: 'green',
              trend: `${allOrders.filter(o => o.status === 'PENDING').length} en attente`,
            },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <div className={`stat-card-icon ${s.cls}`}>{s.icon}</div>
              </div>
              <div className="stat-card-value" style={{ fontSize: 20 }}>{s.value}</div>
              <div className="stat-card-sub">{s.sub}</div>
              <div className="stat-card-trend up">↑ {s.trend}</div>
            </div>
          ))}
        </div>

        {/* ── Revenue Chart + Payment Breakdown ──────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* 7-Day Revenue Bar Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Revenu 7 Derniers Jours</span>
              <span className="badge badge-info" style={{ fontSize: 11 }}>● Live</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {loading ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Chargement...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '0 8px' }}>
                  {dailyRevenue.map((d, i) => {
                    const pct = maxDay > 0 ? (d.total / maxDay) * 100 : 0;
                    const isToday = i === dailyRevenue.length - 1;
                    return (
                      <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: 2 }}>
                          {d.total > 0 ? `${(d.total / 1000).toFixed(0)}k` : ''}
                        </div>
                        <div
                          style={{
                            width: '100%', height: `${Math.max(pct, 2)}%`,
                            borderRadius: '4px 4px 0 0',
                            background: isToday
                              ? 'linear-gradient(180deg, #EB1700, #B91C1C)'
                              : 'linear-gradient(180deg, rgba(235,23,0,0.5), rgba(235,23,0,0.2))',
                            transition: 'height 0.6s ease',
                            minHeight: 4, cursor: 'default',
                          }}
                          title={`${d.day}: ${formatHTG(d.total)} (${d.count} cmd)`}
                        />
                        <div style={{ fontSize: 9, color: isToday ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isToday ? 800 : 500, textAlign: 'center' }}>
                          {d.day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Cette semaine: <strong style={{ color: 'var(--text-primary)' }}>{formatHTG(dailyRevenue.reduce((s, d) => s + d.total, 0))}</strong></span>
                <span>{dailyRevenue.reduce((s, d) => s + d.count, 0)} commandes</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Répartition par Passerelle de Paiement</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
              {[
                { key: 'MONCASH', label: 'MonCash (Digicel)', Icon: IconMobile },
                { key: 'NATCASH', label: 'Natcash (Natcom)', Icon: IconMobile },
                { key: 'CASH_ON_DELIVERY', label: 'Cash à la Livraison', Icon: IconCash },
              ].map(({ key, label, Icon }) => {
                const amount = breakdown[key] || 0;
                const pct = totalBreakdown > 0 ? Math.round((amount / totalBreakdown) * 100) : 0;
                const c = METHOD_COLORS[key];
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ padding: 6, borderRadius: 8, background: c.bg }}>
                          <Icon size={16} color={c.text} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{loading ? '—' : formatHTG(amount)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.gradient, borderRadius: 3, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}

              {/* Completion Rate */}
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Taux de Complétion</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{completionRate}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-4)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionRate}%`, background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 4, transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{deliveredCount} livrées / {allOrders.length} total</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Orders Table ──────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Journal Financier — Commandes Récentes</span>
            <span className="badge delivered" style={{ fontSize: 11 }}>● Live Supabase</span>
          </div>
          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Chargement...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucune commande enregistrée</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° Commande</th><th>Date</th><th>Client</th><th>Marchand</th><th>Paiement</th><th>Sous-total</th><th>Livraison</th><th>Commission</th><th>Total</th><th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => {
                    const c = METHOD_COLORS[o.paymentMethod] || { bg: 'var(--surface-3)', text: 'var(--text-muted)', border: 'var(--border-subtle)', gradient: '' };
                    return (
                      <tr key={o.id}>
                        <td className="font-mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>#{o.orderNumber || o.id?.slice(0, 8)}</td>
                        <td className="text-xs text-muted">{new Date(o.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="text-sm">{o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '—'}</td>
                        <td className="text-sm">{o.merchant?.name || '—'}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="font-semibold">{Number(o.subtotal || 0).toLocaleString()} HTG</td>
                        <td>{Number(o.deliveryFee || 0).toLocaleString()} HTG</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{Number(o.serviceFee || 0).toLocaleString()} HTG</td>
                        <td className="font-bold" style={{ color: 'var(--success)' }}>{Number(o.total || 0).toLocaleString()} HTG</td>
                        <td>
                          <span className={`badge ${o.status === 'DELIVERED' ? 'badge-success' : o.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: 10 }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <td colSpan={5} style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '10px 12px' }}>TOTAUX ({recentOrders.length} commandes affichées)</td>
                    <td className="font-bold">{recentOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0).toLocaleString()} HTG</td>
                    <td className="font-bold">{recentOrders.reduce((s, o) => s + Number(o.deliveryFee || 0), 0).toLocaleString()} HTG</td>
                    <td className="font-bold" style={{ color: 'var(--primary)' }}>{recentOrders.reduce((s, o) => s + Number(o.serviceFee || 0), 0).toLocaleString()} HTG</td>
                    <td className="font-bold" style={{ color: 'var(--success)' }}>{recentOrders.reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString()} HTG</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
