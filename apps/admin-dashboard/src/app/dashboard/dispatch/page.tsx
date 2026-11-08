'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { io, Socket } from 'socket.io-client';
import { IconOrders, IconDrivers, IconRefresh, IconCheck, IconClock } from '../../../components/Icons';

interface PendingAssignment {
  orderId: string;
  orderNumber: string;
  driverId: string;
  driverName: string;
  status: 'WAITING' | 'ACCEPTED' | 'REJECTED';
  message: string;
  assignedAt: number;
}

interface UnassignedOrder {
  id: string;
  orderNumber: string;
  merchantName: string;
  merchantAddress: string;
  merchantLat: number;
  merchantLng: number;
  customerName: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  total: number;
  deliveryFee: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  waitingMinutes: number;
}

interface AvailableDriver {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  rating: number;
  totalDeliveries: number;
  activeOrdersCount: number;
  currentLat: number;
  currentLng: number;
  distanceKm: number;
  score: number;
  lastLocationUpdate: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function scoreDriver(driverLat: number, driverLng: number, ratingAvg: number, totalRatings: number, activeCount: number, merchantLat: number, merchantLng: number): number {
  const dist = haversineKm(driverLat, driverLng, merchantLat, merchantLng);
  const distScore = Math.max(0, 30 - dist * 4);
  const ratingScore = (ratingAvg / 5.0) * 20;
  const loadScore = Math.max(0, 30 - activeCount * 12);
  const expScore = Math.min(20, totalRatings * 0.2);
  return Math.round(distScore + ratingScore + loadScore + expScore);
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#f59e0b',
  PREPARING: '#8b5cf6',
  READY_FOR_PICKUP: '#3b82f6',
  RESTAURANT_ACCEPTED: '#06b6d4',
};

export default function DispatchPage() {
  const [unassigned, setUnassigned] = useState<UnassignedOrder[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<UnassignedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const loadUnassigned = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*,
        merchant:merchants(id, name, address, latitude, longitude),
        customer:users!orders_customerId_fkey(id, firstName, lastName, phoneNumber)`)
      .in('status', ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RESTAURANT_ACCEPTED'])
      .is('driverId', null)
      .order('createdAt', { ascending: true })
      .limit(50);

    if (error) { console.error('Erè loadUnassigned:', error); return; }
    const now = new Date();
    setUnassigned((data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id.slice(0, 8),
      merchantName: o.merchant?.name || 'Marchand',
      merchantAddress: o.merchant?.address || 'Okap',
      merchantLat: o.merchantLatitude || o.merchant?.latitude || 19.7594,
      merchantLng: o.merchantLongitude || o.merchant?.longitude || -72.2008,
      customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Kliyan',
      customerAddress: o.deliveryAddress || 'Adres kliyan',
      customerLat: o.deliveryLatitude || 19.75,
      customerLng: o.deliveryLongitude || -72.20,
      total: Number(o.total || o.totalAmount || 0),
      deliveryFee: Number(o.deliveryFee || 0),
      paymentMethod: o.paymentMethod || 'CASH_ON_DELIVERY',
      status: o.status,
      createdAt: o.createdAt,
      waitingMinutes: Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / 60000),
    })));
  }, []);

  const loadAvailableDrivers = useCallback(async (order: UnassignedOrder | null) => {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select(`id, status, isApproved, currentLatitude, currentLongitude,
        vehicleType, vehiclePlate, rating, totalDeliveries, lastLocationUpdate,
        user:users(firstName, lastName, phoneNumber)`)
      .eq('status', 'ONLINE')
      .eq('isApproved', true);

    if (error) { console.error('Erè loadAvailableDrivers:', error); return; }
    const mLat = order?.merchantLat || 19.7594;
    const mLng = order?.merchantLng || -72.2008;

    const scored: AvailableDriver[] = await Promise.all(
      (data || []).map(async (d: any) => {
        const { count: activeCount } = await supabase
          .from('orders').select('*', { count: 'exact', head: true })
          .eq('driverId', d.id)
          .in('status', ['DRIVER_ASSIGNED', 'IN_TRANSIT', 'PICKED_UP']);
        const dLat = d.currentLatitude || 19.7594;
        const dLng = d.currentLongitude || -72.2008;
        const driverRating = Number(d.rating || 5.0);
        const deliveriesCount = Number(d.totalDeliveries || 0);
        return {
          id: d.id,
          name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Chofè',
          phone: d.user?.phoneNumber || '--',
          vehiclePlate: d.vehiclePlate || '--',
          vehicleType: d.vehicleType || 'MOTO',
          rating: driverRating,
          totalDeliveries: deliveriesCount,
          activeOrdersCount: activeCount || 0,
          currentLat: dLat,
          currentLng: dLng,
          distanceKm: haversineKm(dLat, dLng, mLat, mLng),
          score: scoreDriver(dLat, dLng, driverRating, deliveriesCount, activeCount || 0, mLat, mLng),
          lastLocationUpdate: d.lastLocationUpdate
            ? new Date(d.lastLocationUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : 'Enkoni',
        };
      })
    );
    const filtered = scored.filter(d => d.distanceKm <= 7 && d.activeOrdersCount < 3).sort((a, b) => b.score - a.score);
    // Si pa gen chofè nan 7 km, montre tout lòt chofè an lig yo pou admin ka toujou dispatche
    setAvailableDrivers(filtered.length > 0 ? filtered : scored.sort((a, b) => a.distanceKm - b.distanceKm));
  }, []);

  async function assignDriver(orderId: string, driverId: string, driverName: string) {
    setAssigning(driverId);
    setErrorMsg('');
    const orderNumber = selectedOrder?.orderNumber || orderId.slice(0, 8);

    // Mete eta ap tann repons chofè a
    setPendingAssignment({
      orderId,
      orderNumber,
      driverId,
      driverName,
      status: 'WAITING',
      message: `Kòmand voye ba ${driverName}. Ap tann li aksepte sou telefòn li (25 segonn kont-a-rebou)...`,
      assignedAt: Date.now(),
    });

    try {
      // Rele NestJS backend API — li asinye chofè EPI voye WebSocket alèt ba chofè a
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

      const res = await fetch(`${BACKEND_URL}/api/v1/orders/${orderId}/assign-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ driverId }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Erè serveur ${res.status}`);
      }

      // Emèt tou nan WebSocket pou chofè a resevwa alèt la dirèkteman san okenn delè
      if (socketRef.current?.connected) {
        socketRef.current.emit('admin:assign_driver', { orderId, driverId });
      }

      setSuccessMsg(`⚡ Alèt voye ba ${driverName}! N ap tann konfimasyon li...`);
      setSelectedOrder(null);
      await loadUnassigned();
    } catch (err: any) {
      console.warn('Backend unavailable or fallback triggered, updating Supabase and emitting WebSocket:', err.message);
      try {
        const { error } = await supabase.from('orders')
          .update({ driverId, status: 'DRIVER_ASSIGNED', updatedAt: new Date().toISOString() })
          .eq('id', orderId);
        if (error) throw new Error(error.message);

        // Emèt tou nan WebSocket pou chofè a resevwa alèt la dirèkteman
        if (socketRef.current?.connected) {
          socketRef.current.emit('admin:assign_driver', { orderId, driverId });
        }
        setPendingAssignment({
          orderId,
          orderNumber,
          driverId,
          driverName,
          status: 'ACCEPTED',
          message: `⚡ Alèt voye ba ${driverName} pou kòmand #${orderNumber}.`,
          assignedAt: Date.now(),
        });
        setSelectedOrder(null);
        await loadUnassigned();
      } catch (fbErr: any) {
        setPendingAssignment(null);
        setErrorMsg(`Erè asiyasyon: ${fbErr.message}`);
      }
    } finally {
      setAssigning(null);
    }
  }

  async function refresh() {
    setLoading(true);
    await Promise.all([loadUnassigned(), loadAvailableDrivers(selectedOrder)]);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => {
    refresh();

    // 1. WebSocket dirèk ak NestJS backend pou resevwa repons chofè a an tan reyèl
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const socket: Socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Admin Dispatch konekte ak WebSocket');
      socket.emit('admin:join');
      socket.emit('admin:join_dispatch');
    });

    // Lè chofè klike "AKSEPTE KOUS LA"
    socket.on('admin:mission_accepted', (data: any) => {
      console.log('🎉 Chofè aksepte misyon:', data);
      setPendingAssignment(prev => ({
        orderId: data.orderId,
        orderNumber: (prev && prev.orderId === data.orderId) ? prev.orderNumber : (data.orderNumber || data.orderId?.slice(0, 8)),
        driverId: data.driverId,
        driverName: (prev && prev.driverId === data.driverId) ? prev.driverName : 'Chofè a',
        status: 'ACCEPTED',
        message: `🎉 CHOFÈ A AKSEPTE! ${(prev && prev.driverName) || 'Chofè a'} aksepte kòmand lan avèk siksè. Kous la kòmanse!`,
        assignedAt: Date.now(),
      }));
      setSuccessMsg(`🎉 Chofè a aksepte kòmand lan avèk siksè!`);
      loadUnassigned();
    });

    // Lè chofè klike "Refize" oswa kont-a-rebou 25s fini
    socket.on('admin:mission_rejected', (data: any) => {
      console.log('⚠️ Chofè refize misyon:', data);
      setPendingAssignment(prev => ({
        orderId: data.orderId,
        orderNumber: (prev && prev.orderId === data.orderId) ? prev.orderNumber : (data.orderNumber || data.orderId?.slice(0, 8)),
        driverId: data.driverId,
        driverName: (prev && prev.driverId === data.driverId) ? prev.driverName : 'Chofè a',
        status: 'REJECTED',
        message: `⚠️ Chofè a pa aksepte kòmand lan (refize oswa 25s pase). Kòmand lan retounen pou dispatch!`,
        assignedAt: Date.now(),
      }));
      setErrorMsg(`⚠️ Chofè a pa aksepte kòmand lan. Ou ka chwazi yon lòt chofè kounye a.`);
      loadUnassigned();
    });

    socket.on('admin:order:status_updated', () => {
      loadUnassigned();
    });

    // 2. Supabase Realtime channel
    const channel = supabase.channel('dispatch-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        loadUnassigned();
        if (payload?.new?.status === 'DRIVER_ASSIGNED' || payload?.new?.status === 'DRIVER_ARRIVING') {
          setPendingAssignment(prev => prev && prev.orderId === payload.new.id ? {
            ...prev,
            status: 'ACCEPTED',
            message: `🎉 CHOFÈ A AKSEPTE! Kòmand #${payload.new.orderNumber || prev.orderNumber} konfime.`,
            assignedAt: Date.now(),
          } : null);
        }
      })
      .subscribe();

    const interval = setInterval(refresh, 20000);
    return () => {
      socket.disconnect();
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []); // eslint-disable-line

  // Otomatikman chwazi kòmand si gen ?orderId= nan URL la
  useEffect(() => {
    if (unassigned.length > 0 && !selectedOrder) {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const targetId = params?.get('orderId');
      if (targetId) {
        const found = unassigned.find(o => o.id === targetId);
        if (found) {
          setSelectedOrder(found);
          loadAvailableDrivers(found);
        }
      }
    }
  }, [unassigned, selectedOrder, loadAvailableDrivers]);

  useEffect(() => { if (selectedOrder) loadAvailableDrivers(selectedOrder); }, [selectedOrder, loadAvailableDrivers]);

  return (
    <>
      {/* ── TOPBAR ─────────────────────────────────── */}
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
              <IconOrders size={18} color="#FFFFFF" />
            </div>
            <span>Centre Dispatch Temps Réel</span>
          </div>
          <div className="topbar-subtitle">
            Cap-Haïtien &bull; Santvil &bull; Boulevard &bull; Carénage &bull; Vertières
          </div>
        </div>

        <div className="topbar-actions">
          {/* Indicateur de statut live */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--success-bg)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 20,
            padding: '5px 12px',
          }}>
            <span className="live-dot" style={{ width: 7, height: 7 }} />
            <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
              Dispatch Actif
            </span>
          </div>

          {/* Bouton rafraîchissement */}
          <button
            className="btn btn-sm btn-secondary"
            onClick={refresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" className={loading ? 'spin-icon' : ''} />
            <span>{loading ? 'Chargement...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* ── PAGE CONTAINER ─────────────────────────── */}
      <div className="page-container">
        {/* STATS RAPIDES EN-TÊTE */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          <div className="stat-card" style={{ padding: '16px 20px' }}>
            <div className="stat-card-header">
              <span className="stat-card-label">À Dispatcher</span>
              <div className="stat-card-icon" style={{ background: unassigned.length > 0 ? 'rgba(239,68,68,0.15)' : 'var(--success-bg)', color: unassigned.length > 0 ? '#EF4444' : '#10B981' }}>
                📦
              </div>
            </div>
            <div className="stat-card-value" style={{ color: unassigned.length > 0 ? '#EF4444' : 'var(--text-primary)' }}>
              {unassigned.length}
            </div>
            <div className="stat-card-sub">
              {unassigned.length === 0 ? 'Aucune commande en attente' : 'Commandes nécessitant un coursier'}
            </div>
          </div>

          <div className="stat-card" style={{ padding: '16px 20px' }}>
            <div className="stat-card-header">
              <span className="stat-card-label">Coursiers Disponibles</span>
              <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                🏍️
              </div>
            </div>
            <div className="stat-card-value">{availableDrivers.length}</div>
            <div className="stat-card-sub">Prêts pour prise en charge immédiate</div>
          </div>

          <div className="stat-card" style={{ padding: '16px 20px' }}>
            <div className="stat-card-header">
              <span className="stat-card-label">Dernière Synchro</span>
              <div className="stat-card-icon" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
                ⏱️
              </div>
            </div>
            <div className="stat-card-value" style={{ fontSize: 20, marginTop: 4 }}>
              {lastRefresh.toLocaleTimeString('fr-FR')}
            </div>
            <div className="stat-card-sub">Polling auto toutes les 10 secondes</div>
          </div>
        </div>

        {/* NOTIFICATION DIRECTE RÉPONSE CHAUFFEUR */}
        {pendingAssignment && (
          <div style={{
            padding: '16px 20px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            background: pendingAssignment.status === 'ACCEPTED'
              ? 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,78,59,0.3) 100%)'
              : pendingAssignment.status === 'REJECTED'
              ? 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(127,29,29,0.3) 100%)'
              : 'linear-gradient(135deg, rgba(255,107,0,0.18) 0%, rgba(154,52,18,0.3) 100%)',
            border: `1.5px solid ${
              pendingAssignment.status === 'ACCEPTED'
                ? '#10B981'
                : pendingAssignment.status === 'REJECTED'
                ? '#EF4444'
                : '#FF6B00'
            }`,
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                background: pendingAssignment.status === 'ACCEPTED'
                  ? '#10B981'
                  : pendingAssignment.status === 'REJECTED'
                  ? '#EF4444'
                  : '#FF6B00',
                color: '#FFFFFF',
                fontWeight: 'bold',
                boxShadow: '0 0 16px rgba(0,0,0,0.3)',
              }}>
                {pendingAssignment.status === 'ACCEPTED' ? '✓' : pendingAssignment.status === 'REJECTED' ? '✕' : '⏳'}
              </div>
              <div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: pendingAssignment.status === 'ACCEPTED'
                    ? '#10B981'
                    : pendingAssignment.status === 'REJECTED'
                    ? '#EF4444'
                    : '#FF6B00',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {pendingAssignment.status === 'ACCEPTED' && '🎉 CHAUFFEUR ASSIGNÉ AVEC SUCCÈS !'}
                  {pendingAssignment.status === 'REJECTED' && '⚠️ MISSION REFUSÉE PAR LE CHAUFFEUR'}
                  {pendingAssignment.status === 'WAITING' && '📡 ALERTE TRANSMIS AU COURSIER — EN ATTENTE DE CONFIRMATION (25s)...'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {pendingAssignment.message}
                </div>
              </div>
            </div>
            <button
              onClick={() => setPendingAssignment(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && !pendingAssignment && (
          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', color: 'var(--success)', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}
        {errorMsg && !pendingAssignment && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', color: 'var(--danger)', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {/* ── CORPS PRINCIPAL DE DISPATCH ──────────────── */}
        <div className="dispatch-main-grid" style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 440px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* LISTE DES COMMANDES À DISPATCHER */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                  Commandes en Attente de Dispatch
                </h3>
                {unassigned.length > 0 && (
                  <span style={{
                    background: 'var(--gradient-brand)',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}>
                    {unassigned.length}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Triées par ancienneté</span>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
                <p>Recherche des commandes en cours...</p>
              </div>
            ) : unassigned.length === 0 ? (
              <div style={{
                padding: '64px 32px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)',
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1.5px solid rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  margin: '0 auto 16px',
                  boxShadow: 'var(--shadow-glow-emerald)',
                }}>
                  ✨
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Toutes les commandes sont assignées !
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 18px' }}>
                  Aucune course n'est en attente de chauffeur pour le moment. Les nouvelles commandes apparaîtront automatiquement dès leur validation par le restaurant.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}>
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  <span>Surveillance active &bull; Cap-Haïtien</span>
                </div>
              </div>
            ) : unassigned.map(order => {
              const isSelected = selectedOrder?.id === order.id;
              const isUrgent = order.waitingMinutes >= 10;
              const delivDist = haversineKm(order.merchantLat, order.merchantLng, order.customerLat, order.customerLng);
              const sc = STATUS_COLORS[order.status] || '#FF6B00';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(isSelected ? null : order)}
                  style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(255, 48, 8, 0.08)'
                      : isUrgent
                      ? 'rgba(239, 68, 68, 0.04)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '4px solid var(--primary-500)'
                      : isUrgent
                      ? '4px solid var(--danger)'
                      : '4px solid transparent',
                    transition: 'all var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary-500)', fontSize: '15px' }}>
                          #{order.orderNumber}
                        </span>
                        <span style={{
                          background: sc + '22',
                          color: sc,
                          padding: '3px 9px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: `1px solid ${sc}44`,
                        }}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {isUrgent && (
                          <span style={{
                            background: 'rgba(239,68,68,0.2)',
                            color: '#EF4444',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            border: '1px solid rgba(239,68,68,0.3)',
                          }}>
                            URGENT ({order.waitingMinutes} min)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                            🏪 RESTAURANT
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.merchantName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.merchantAddress}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                            🎯 CLIENT
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.customerAddress}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Distance estimée: <strong style={{ color: 'var(--text-primary)' }}>{delivDist} km</strong> &bull;{' '}
                        Paiement: <strong style={{ color: 'var(--text-primary)' }}>{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'En Espèces (Cash)' : order.paymentMethod}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981' }}>
                        {order.deliveryFee.toLocaleString()} HTG
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Frais livreur</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Attente: <strong>{order.waitingMinutes} min</strong>
                      </div>
                      <div style={{
                        marginTop: '10px',
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--gradient-brand)' : 'var(--surface-3)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '11px',
                        boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                      }}>
                        {isSelected ? '✓ Sélectionnée' : 'Choisir Livreur'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PANNEAU LATÉRAL DES CHAUFFEURS DISPONIBLES */}
          {selectedOrder && (
            <div>
              <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '80px', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--gradient-brand-subtle)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--primary-500)', fontWeight: 800, letterSpacing: 0.5, marginBottom: '4px' }}>
                    ASSIGNATION INTELLIGENTE
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '17px', color: 'var(--text-primary)' }}>
                    Commande #{selectedOrder.orderNumber}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedOrder.merchantName} &rarr; {selectedOrder.customerName}
                  </div>
                </div>

                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {availableDrivers.length} COURSIER(S) DISPONIBLE(S) DANS LE PÉRIMÈTRE
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Algorithme de proximité : Distance + Note + Disponibilité
                  </div>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {availableDrivers.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛵</div>
                      <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Aucun coursier en ligne à proximité immédiate.</p>
                      <p style={{ fontSize: '12px', marginTop: 4 }}>Les coursiers doivent être en ligne et avec GPS actif.</p>
                    </div>
                  ) : availableDrivers.map((driver, idx) => (
                    <div
                      key={driver.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx === 0 ? 'rgba(16,185,129,0.06)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            {idx === 0 && (
                              <span style={{
                                background: '#10B981',
                                color: '#FFFFFF',
                                padding: '1px 7px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}>
                                OPTIMAL
                              </span>
                            )}
                            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                              {driver.name}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            🏍️ {driver.vehiclePlate} &bull; {driver.phone}
                          </div>

                          <div style={{ fontSize: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
                            <span>📍 <strong>{driver.distanceKm} km</strong> du resto</span>
                            <span>⭐ <strong>{driver.rating.toFixed(1)}/5</strong></span>
                            <span>📦 <strong>{driver.activeOrdersCount}</strong> active(s)</span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Dernier signal GPS: {driver.lastLocationUpdate}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: driver.score >= 70 ? 'rgba(16,185,129,0.18)' : driver.score >= 50 ? 'rgba(245,158,11,0.18)' : 'rgba(239,68,68,0.18)',
                            border: `2px solid ${driver.score >= 70 ? '#10B981' : driver.score >= 50 ? '#F59E0B' : '#EF4444'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '14px',
                            color: driver.score >= 70 ? '#10B981' : driver.score >= 50 ? '#F59E0B' : '#EF4444',
                            marginBottom: '8px',
                            marginLeft: 'auto',
                          }}>
                            {driver.score}
                          </div>

                          <button
                            className="btn btn-sm btn-primary"
                            disabled={assigning === driver.id}
                            onClick={() => assignDriver(selectedOrder.id, driver.id, driver.name)}
                            style={{
                              width: '100%',
                              fontWeight: 800,
                              fontSize: '11px',
                              padding: '6px 12px',
                            }}
                          >
                            {assigning === driver.id ? 'Attribution...' : 'Assigner'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setSelectedOrder(null)}
                  >
                    Fermer la sélection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
