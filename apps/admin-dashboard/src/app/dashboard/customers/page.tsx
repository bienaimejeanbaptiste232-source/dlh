'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getCustomers,
  getCustomerDetails,
  toggleCustomerStatus,
  adjustCustomerWallet,
  createCustomer,
  supabase,
} from '../../../lib/supabase';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  role: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  avatarUrl: string | null;
  languagePreference: string;
  createdAt: string;
  updatedAt: string;
  wallet: {
    id?: string;
    balance: number;
    currency: string;
    isFrozen: boolean;
  };
  addresses: any[];
  ordersCount: number;
  deliveredOrdersCount: number;
  totalSpent: number;
  lastOrder: any | null;
  orders: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'WITH_ORDERS' | 'NO_ORDERS'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Selected customer for modal / drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'orders' | 'addresses' | 'wallet'>('orders');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+509',
    email: '',
    address: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Wallet Top-up Modal
  const [walletModalCustomer, setWalletModalCustomer] = useState<Customer | null>(null);
  const [walletAmount, setWalletAmount] = useState<number>(500);
  const [walletType, setWalletType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletNote, setWalletNote] = useState('');
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();

    // Setup Supabase Realtime listeners for live updates
    const ordersChannel = supabase
      .channel('customers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchCustomers]);

  async function openCustomerDetails(id: string) {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const details = await getCustomerDetails(id);
      setCustomerDetail(details);
    } catch (e) {
      console.error('Erreur chargement détail client:', e);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleToggleStatus(customer: Customer) {
    setActionLoadingId(customer.id);
    try {
      await toggleCustomerStatus(customer.id, !customer.isActive);
      await fetchCustomers();
      if (customerDetail?.id === customer.id) {
        setCustomerDetail((prev: any) => ({ ...prev, isActive: !customer.isActive }));
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.phoneNumber) {
      alert('Tanpri ranpli tout chan obligatwa yo (Prenon, Non, Nimewo Telefòn).');
      return;
    }
    setCreateSubmitting(true);
    try {
      await createCustomer(createForm);
      setShowCreateModal(false);
      setCreateForm({ firstName: '', lastName: '', phoneNumber: '+509', email: '', address: '' });
      await fetchCustomers();
    } catch (err: any) {
      alert(`Erreur kreyasyon: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletModalCustomer || walletAmount <= 0) return;
    setWalletSubmitting(true);
    try {
      await adjustCustomerWallet(walletModalCustomer.id, walletAmount, walletType, walletNote);
      setWalletModalCustomer(null);
      setWalletNote('');
      await fetchCustomers();
      if (selectedCustomerId === walletModalCustomer.id) {
        openCustomerDetails(walletModalCustomer.id);
      }
    } catch (err: any) {
      alert(`Erreur portefeuille: ${err.message}`);
    } finally {
      setWalletSubmitting(false);
    }
  }

  // Calculated Metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.isActive).length;
  const totalCustomerOrders = customers.reduce((sum, c) => sum + c.ordersCount, 0);
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalWalletBalances = customers.reduce((sum, c) => sum + (parseFloat(c.wallet?.balance as any) || 0), 0);
  const avgBasket = totalCustomerOrders > 0 ? (totalSpentAll / totalCustomerOrders).toFixed(0) : '0';

  // Filtering
  const filtered = customers.filter(c => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.isActive) ||
      (statusFilter === 'INACTIVE' && !c.isActive);

    const matchOrder =
      orderFilter === 'ALL' ||
      (orderFilter === 'WITH_ORDERS' && c.ordersCount > 0) ||
      (orderFilter === 'NO_ORDERS' && c.ordersCount === 0);

    return matchSearch && matchStatus && matchOrder;
  });

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ fontSize: 26, fontWeight: 800 }}>👥 Gestion des Clients</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--success)',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }}></span>
              SUPABASE EN DIRECT
            </span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Swiv tout aktivite kliyan yo: kòmand, adrès, depans, ak balans portefeuille an tan reyèl.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchCustomers} title="Rafrechi done yo">
            🔄 Actualiser
          </button>
          <button
            className="btn btn-primary"
            style={{
              background: 'var(--gradient-brand)',
              color: '#fff',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: 10,
              boxShadow: 'var(--shadow-glow)',
            }}
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Nouveau Client
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ───────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="stat-card" style={{ padding: '18px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Kliyan</span>
            <span style={{ fontSize: 20 }}>👥</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{totalCustomers}</div>
          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
            ● {activeCustomers} aktif ({totalCustomers ? Math.round((activeCustomers / totalCustomers) * 100) : 0}%)
          </div>
        </div>

        <div className="stat-card" style={{ padding: '18px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Kòmand Kliyan</span>
            <span style={{ fontSize: 20 }}>📦</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-500)' }}>{totalCustomerOrders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Panier mwayen: ~{avgBasket} HTG
          </div>
        </div>

        <div className="stat-card" style={{ padding: '18px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Depans Kliyan</span>
            <span style={{ fontSize: 20 }}>💰</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--warning)' }}>
            {totalSpentAll.toLocaleString()} <span style={{ fontSize: 15, fontWeight: 600 }}>HTG</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Chif d&apos;afè kòmand kliyan yo
          </div>
        </div>

        <div className="stat-card" style={{ padding: '18px 20px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Balans Portefeuilles</span>
            <span style={{ fontSize: 20 }}>👛</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8' }}>
            {totalWalletBalances.toLocaleString()} <span style={{ fontSize: 15, fontWeight: 600 }}>HTG</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Lajan disponib nan wallet kliyan yo
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 20,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flex: '1 1 300px', gap: 10 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="🔍 Chèche pa non, telefòn (+509...), oswa email..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Statut filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              color: '#fff',
              border: '1px solid var(--border-default)',
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Statut: Tout</option>
            <option value="ACTIVE">Kliyan Aktif Sèlman</option>
            <option value="INACTIVE">Kliyan Bloke / Enaktif</option>
          </select>

          {/* Order filter */}
          <select
            value={orderFilter}
            onChange={(e: any) => setOrderFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)',
              color: '#fff',
              border: '1px solid var(--border-default)',
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Kòmand: Tout</option>
            <option value="WITH_ORDERS">Gen Kòmand Pase</option>
            <option value="NO_ORDERS">San Okenn Kòmand</option>
          </select>
        </div>
      </div>

      {/* ── Customers Table ─────────────────────────────────── */}
      <div
        className="card"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⏳</div>
            Chaje lis kliyan yo an dirèk depi Supabase...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <h3 style={{ color: '#fff', marginBottom: 8, fontSize: 18 }}>Pa gen okenn kliyan ki koresponn</h3>
            <p style={{ fontSize: 14 }}>Eseye modifye rechèch ou an oswa kreye yon nouvo kliyan.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-2)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>KLIYAN</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>KONTAK</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>BALANS WALLET</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>KÒMAND</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>TOTAL DEPANSE</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>DÈNYE KÒMAND</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>STATUT</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>AKSYON</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const initials = `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() || 'K';
                  const balance = parseFloat(customer.wallet?.balance as any) || 0;

                  return (
                    <tr
                      key={customer.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 15,
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
                              {customer.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                              <span>Enskri {new Date(customer.createdAt).toLocaleDateString('fr-HT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span style={{ fontSize: 9, background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase' }}>
                                {customer.languagePreference}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#f0f0f8', fontSize: 14 }}>
                          {customer.phoneNumber}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {customer.email || 'Pa gen email'}
                        </div>
                      </td>

                      {/* Wallet Balance */}
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: balance > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.05)',
                            padding: '4px 10px',
                            borderRadius: 8,
                            color: balance > 0 ? '#38bdf8' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          <span>👛</span>
                          <span>{balance.toLocaleString()} HTG</span>
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>
                          {customer.ordersCount} kòmand
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}>
                          {customer.deliveredOrdersCount} livre
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--warning)', fontSize: 14 }}>
                          {customer.totalSpent.toLocaleString()} HTG
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {customer.addresses.length} adrès sove
                        </div>
                      </td>

                      {/* Last Order */}
                      <td style={{ padding: '14px 18px' }}>
                        {customer.lastOrder ? (
                          <div>
                            <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>
                              #{customer.lastOrder.orderNumber}
                            </span>
                            <div style={{ marginTop: 3 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background:
                                    customer.lastOrder.status === 'DELIVERED'
                                      ? 'rgba(34, 197, 94, 0.15)'
                                      : 'rgba(245, 158, 11, 0.15)',
                                  color:
                                    customer.lastOrder.status === 'DELIVERED'
                                      ? 'var(--success)'
                                      : 'var(--warning)',
                                }}
                              >
                                {customer.lastOrder.status}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Okenn</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => handleToggleStatus(customer)}
                          disabled={actionLoadingId === customer.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: customer.isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: customer.isActive ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${customer.isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            transition: 'all 0.2s',
                          }}
                          title={customer.isActive ? 'Klike pou bloke kliyan sa a' : 'Klike pou re-aktive kliyan an'}
                        >
                          <span>{customer.isActive ? '● AKTIF' : '■ BLOKE'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => handleToggleStatus(customer)}
                            disabled={actionLoadingId === customer.id}
                            style={{
                              padding: '6px 12px',
                              background: customer.isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                              border: `1px solid ${customer.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.35)'}`,
                              borderRadius: 8,
                              color: customer.isActive ? 'var(--danger)' : 'var(--success)',
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer',
                            }}
                            title={customer.isActive ? 'Devalide / Bloke aksè kliyan sa a' : 'Valide / Otorize kliyan sa a'}
                          >
                            {actionLoadingId === customer.id
                              ? '...'
                              : customer.isActive
                              ? '🚫 Devalide'
                              : '✓ Valide'}
                          </button>

                          <button
                            onClick={() => openCustomerDetails(customer.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--surface-3)',
                              borderRadius: 8,
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              border: '1px solid var(--border-default)',
                            }}
                            title="Wè tout detay ak istwa kliyan an"
                          >
                            👁️ Detay
                          </button>

                          <button
                            onClick={() => {
                              setWalletModalCustomer(customer);
                              setWalletAmount(500);
                              setWalletType('CREDIT');
                              setWalletNote('Ajoute balans kliyan pa Admin');
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: 8,
                              color: '#38bdf8',
                              fontSize: 13,
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Rechaje oswa jere balans wallet kliyan an"
                          >
                            💳 Wallet
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CUSTOMER DETAIL MODAL / DRAWER ──────────────────── */}
      {selectedCustomerId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setSelectedCustomerId(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              height: '100%',
              background: 'var(--surface-1)',
              borderLeft: '1px solid var(--border-default)',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
              overflowY: 'auto',
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  FICH DETAYE KLIYAN
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  {customerDetail ? `${customerDetail.firstName} ${customerDetail.lastName}` : 'Chajman...'}
                </h2>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>📞 {customerDetail?.phoneNumber}</span>
                  {customerDetail?.email && <span>✉️ {customerDetail.email}</span>}
                  <span
                    style={{
                      color: customerDetail?.isActive ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 700,
                    }}
                  >
                    ● {customerDetail?.isActive ? 'Kont Aktif' : 'Kont Bloke'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {customerDetail && (
                  <button
                    onClick={async () => {
                      const activeState = customerDetail.isActive ?? true;
                      setActionLoadingId(customerDetail.id);
                      try {
                        await toggleCustomerStatus(customerDetail.id, !activeState);
                        setCustomerDetail((prev: any) => ({ ...prev, isActive: !activeState }));
                        await fetchCustomers();
                      } catch (err: any) {
                        alert(`Erè: ${err.message}`);
                      } finally {
                        setActionLoadingId(null);
                      }
                    }}
                    disabled={actionLoadingId === customerDetail.id}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: customerDetail.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: customerDetail.isActive ? 'var(--danger)' : 'var(--success)',
                      border: `1px solid ${customerDetail.isActive ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {actionLoadingId === customerDetail.id
                      ? 'Mizajou an kou...'
                      : customerDetail.isActive
                      ? '🚫 Devalide / Bloke Kliyan'
                      : '✓ Valide / Debloke Kliyan'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedCustomerId(null)}
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    color: '#fff',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                Chaje tout enfòmasyon kliyan an...
              </div>
            ) : customerDetail ? (
              <>
                {/* Highlights bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    marginBottom: 24,
                    background: 'var(--surface-2)',
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kòmand Pase</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                      {customerDetail.totalOrders}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Depanse</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)', marginTop: 2 }}>
                      {customerDetail.totalSpent?.toLocaleString()} HTG
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balans Portefeuille</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                      {parseFloat(customerDetail.wallets?.balance || 0).toLocaleString()} HTG
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
                  <button
                    onClick={() => setActiveDetailTab('orders')}
                    style={{
                      padding: '10px 18px',
                      color: activeDetailTab === 'orders' ? '#fff' : 'var(--text-muted)',
                      borderBottom: activeDetailTab === 'orders' ? '2px solid #ec4899' : '2px solid transparent',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    📦 Kòmand ({customerDetail.orders?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('addresses')}
                    style={{
                      padding: '10px 18px',
                      color: activeDetailTab === 'addresses' ? '#fff' : 'var(--text-muted)',
                      borderBottom: activeDetailTab === 'addresses' ? '2px solid #ec4899' : '2px solid transparent',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    📍 Adrès Livrezon ({customerDetail.addresses?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('wallet')}
                    style={{
                      padding: '10px 18px',
                      color: activeDetailTab === 'wallet' ? '#fff' : 'var(--text-muted)',
                      borderBottom: activeDetailTab === 'wallet' ? '2px solid #ec4899' : '2px solid transparent',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    👛 Wallet & Istwa ({customerDetail.walletTransactions?.length || 0})
                  </button>
                </div>

                {/* Tab: Orders */}
                {activeDetailTab === 'orders' && (
                  <div>
                    {customerDetail.orders?.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Kliyan sa a poko pase okenn kòmand.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {customerDetail.orders.map((o: any) => (
                          <div
                            key={o.id}
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 12,
                              padding: 16,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div>
                                <span style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>
                                  #{o.orderNumber}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
                                  {new Date(o.createdAt).toLocaleString('fr-HT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  background:
                                    o.status === 'DELIVERED'
                                      ? 'rgba(34, 197, 94, 0.15)'
                                      : 'rgba(236, 72, 153, 0.15)',
                                  color: o.status === 'DELIVERED' ? 'var(--success)' : '#ec4899',
                                }}
                              >
                                {o.status}
                              </span>
                            </div>

                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                              <div>🍽️ <strong>Restoran:</strong> {o.merchant?.name || 'Inconnu'}</div>
                              <div>🏍️ <strong>Livreur:</strong> {o.driver?.user ? `${o.driver.user.firstName} ${o.driver.user.lastName}` : 'Poko asiyen'}</div>
                              <div>📍 <strong>Adrès:</strong> {o.deliveryAddress}</div>
                              <div>💳 <strong>Peman:</strong> {o.paymentMethod} ({o.paymentStatus})</div>
                            </div>

                            {o.order_items && o.order_items.length > 0 && (
                              <div style={{ marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Atik kòmande:</div>
                                {o.order_items.map((item: any) => (
                                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span style={{ fontWeight: 600 }}>{item.totalPrice} HTG</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Sou-total: {o.subtotal} HTG | Livrezon: {o.deliveryFee} HTG
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)' }}>
                                Total: {o.total} HTG
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Addresses */}
                {activeDetailTab === 'addresses' && (
                  <div>
                    {customerDetail.addresses?.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Kliyan sa a pa anrejistre okenn adrès.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {customerDetail.addresses.map((addr: any) => (
                          <div
                            key={addr.id}
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 12,
                              padding: 16,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
                                  📍 {addr.title || 'Adres san tit'}
                                </span>
                                {addr.isDefault && (
                                  <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                    PRENSIPAL
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                {addr.fullAddress}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                GPS: {addr.latitude}, {addr.longitude}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Wallet & Transactions */}
                {activeDetailTab === 'wallet' && (
                  <div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 14,
                        padding: 20,
                        marginBottom: 20,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Balans Disponib Aktyèl</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                          {parseFloat(customerDetail.wallets?.balance || 0).toLocaleString()} HTG
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Deviz: HTG (Gourdes) • {customerDetail.wallets?.isFrozen ? '⚠️ Frijidè / Bloke' : '✅ Aktif'}
                        </div>
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setWalletModalCustomer(customerDetail);
                          setWalletAmount(500);
                          setWalletType('CREDIT');
                          setWalletNote('Ajisteman pa Administrateur');
                        }}
                        style={{
                          background: '#38bdf8',
                          color: '#000',
                          fontWeight: 700,
                          padding: '10px 16px',
                          borderRadius: 8,
                        }}
                      >
                        Ajiste Balans
                      </button>
                    </div>

                    <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12, fontWeight: 700 }}>
                      Istwa Tranzaksyon Wallet ({customerDetail.walletTransactions?.length || 0})
                    </h4>

                    {customerDetail.walletTransactions?.length === 0 ? (
                      <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Pa gen okenn tranzaksyon anrejistre pou moman an.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {customerDetail.walletTransactions.map((tx: any) => (
                          <div
                            key={tx.id}
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 10,
                              padding: 14,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>
                                {tx.description || tx.source}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                Ref: {tx.reference || tx.id.slice(0, 8)} • {new Date(tx.createdAt).toLocaleString('fr-HT')}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 800,
                                color: tx.type === 'CREDIT' ? 'var(--success)' : 'var(--danger)',
                              }}
                            >
                              {tx.type === 'CREDIT' ? '+' : '-'} {parseFloat(tx.amount).toLocaleString()} HTG
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── CREATE CUSTOMER MODAL ───────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 20,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>➕ Kreye yon Nouvo Kliyan</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-muted)', fontSize: 18 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Prenon *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jean"
                    className="form-input"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-default)', padding: 10, borderRadius: 8, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Non Fanmi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Baptiste"
                    className="form-input"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-default)', padding: 10, borderRadius: 8, color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Nimewo Telefòn Ayisyen (+509...) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+50937123456"
                  className="form-input"
                  value={createForm.phoneNumber}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-default)', padding: 10, borderRadius: 8, color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Email (Opsyonèl)
                </label>
                <input
                  type="email"
                  placeholder="kliyan@gmail.com"
                  className="form-input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-default)', padding: 10, borderRadius: 8, color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Adrès Livrezon Inisyal (Opsyonèl)
                </label>
                <input
                  type="text"
                  placeholder="Eg: Delmas 40b #12, Pétion-Ville"
                  className="form-input"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-default)', padding: 10, borderRadius: 8, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)', color: '#fff', fontWeight: 700 }}
                >
                  {createSubmitting ? 'Kreyasyon an kour...' : 'Kreye Kliyan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── WALLET TOP-UP / ADJUSTMENT MODAL ────────────────── */}
      {walletModalCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 20,
          }}
          onClick={() => setWalletModalCustomer(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>💳 Jere Portefeuille</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Kliyan: <strong>{walletModalCustomer.name}</strong>
                </p>
              </div>
              <button onClick={() => setWalletModalCustomer(null)} style={{ color: 'var(--text-muted)', fontSize: 18 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleWalletSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Tip Operasyon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setWalletType('CREDIT')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      fontWeight: 700,
                      border: walletType === 'CREDIT' ? '2px solid var(--success)' : '1px solid var(--border-default)',
                      background: walletType === 'CREDIT' ? 'rgba(34, 197, 94, 0.15)' : 'var(--surface-2)',
                      color: walletType === 'CREDIT' ? 'var(--success)' : 'var(--text-muted)',
                    }}
                  >
                    ➕ Kredi (Ajoute Gourdes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletType('DEBIT')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      fontWeight: 700,
                      border: walletType === 'DEBIT' ? '2px solid var(--danger)' : '1px solid var(--border-default)',
                      background: walletType === 'DEBIT' ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-2)',
                      color: walletType === 'DEBIT' ? 'var(--danger)' : 'var(--text-muted)',
                    }}
                  >
                    ➖ Debi (Retire Gourdes)
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Montan (HTG) *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  step={10}
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-default)',
                    padding: 12,
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Rezon / Nòt (Opsyonèl)
                </label>
                <input
                  type="text"
                  placeholder="Eg: Ranbousman kòmand, Bonus fidélité, etc."
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-default)',
                    padding: 10,
                    borderRadius: 8,
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setWalletModalCustomer(null)}
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={walletSubmitting}
                  className="btn btn-primary"
                  style={{
                    background: walletType === 'CREDIT' ? 'var(--success)' : 'var(--danger)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {walletSubmitting ? 'Mizajou an kour...' : walletType === 'CREDIT' ? 'Konfime Kredi (+)' : 'Konfime Debi (-)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
