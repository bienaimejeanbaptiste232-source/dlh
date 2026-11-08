'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase, getDrivers, getOrders } from '../../../lib/supabase';
import {
  IconLiveMap,
  IconDrivers,
  IconOrders,
  IconRefresh,
  IconCheck,
  IconClock,
  IconMobile,
} from '../../../components/Icons';

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  status: string; // 'ONLINE' | 'BUSY'
  vehicleType: string;
  vehiclePlate: string;
  lat: number;
  lng: number;
  rating: number;
  totalDeliveries: number;
  activeOrder?: string;
  lastUpdate?: string;
  hasGpsFix: boolean;
}

interface ActiveOrder {
  id: string;
  orderNumber: string;
  merchantName: string;
  customerAddress: string;
  status: string;
  total: number;
  driverId?: string;
  lat?: number;
  lng?: number;
}

export default function LiveMapPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'BUSY'>('ALL');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [mapEngineReady, setMapEngineReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<'DARK' | 'SATELLITE' | 'STREET'>('DARK');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const simIntervalRef = useRef<any>(null);

  // 1. Initialiser le chargement des vrais chauffeurs en ligne et des commandes
  async function loadData() {
    try {
      const [driversData, ordersData] = await Promise.all([
        getDrivers(),
        getOrders(30),
      ]);

      const inTransitOrders: ActiveOrder[] = (ordersData || [])
        .filter((o: any) =>
          ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'PICKED_UP', 'IN_TRANSIT', 'PREPARING'].includes(o.status)
        )
        .map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber || o.id.substring(0, 8),
          merchantName: o.merchant?.name || 'Marchand',
          customerAddress: o.deliveryAddress || 'Adres livrezon',
          status: o.status,
          total: Number(o.total || 0),
          driverId: o.driverId,
          lat: o.deliveryLatitude ? Number(o.deliveryLatitude) : undefined,
          lng: o.deliveryLongitude ? Number(o.deliveryLongitude) : undefined,
        }));

      // RÈGLE CRITIQUE :
      // 1. Chofè a dwe ONLINE / BUSY / AVAILABLE / IN_DELIVERY (Si li OFFLINE li PA dwe parèt sou kat la)
      // 2. Chofè a parèt avèk vrè pozisyon GPS li (oswa zòn santral operasyon si li fenk konekte)
      const realOnlineDrivers: DriverItem[] = (driversData || [])
        .filter((d: any) => {
          const status = (d.status || '').toUpperCase();
          const isOnline =
            status === 'ONLINE' ||
            status === 'AVAILABLE' ||
            status === 'BUSY' ||
            status === 'IN_DELIVERY' ||
            status === 'IN_TRANSIT';

          // Si chofè a pa sou liy (OFFLINE), pa afichel sou kat la
          return isOnline;
        })
        .map((d: any) => {
          const rawLat = typeof d.currentLatitude === 'number' ? d.currentLatitude : parseFloat(d.currentLatitude);
          const rawLng = typeof d.currentLongitude === 'number' ? d.currentLongitude : parseFloat(d.currentLongitude);
          const hasRealGps = !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0;

          // Si chofè a gen bon kowòdone GPS reyèl li, sèvi ak li; sinon sèvi ak sant Pétion-Ville
          const lat = hasRealGps ? rawLat : 18.5125;
          const lng = hasRealGps ? rawLng : -72.2860;

          // Tcheke si chofè a gen yon kòmand an kous
          const matchingOrder = inTransitOrders.find((o) => o.driverId === d.driverId);
          const status = matchingOrder ? 'BUSY' : (d.status === 'AVAILABLE' ? 'ONLINE' : d.status);

          let lastUpdateFormatted = hasRealGps ? 'Live' : 'GPS ap inisyalize...';
          if (d.lastLocationUpdate) {
            try {
              lastUpdateFormatted = new Date(d.lastLocationUpdate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
            } catch (_) {}
          }

          return {
            id: d.driverId,
            name: d.name,
            phone: d.phone,
            status,
            vehicleType: d.vehicleType || 'MOTO',
            vehiclePlate: d.vehiclePlate || 'MOTO',
            lat,
            lng,
            rating: typeof d.rating === 'number' ? d.rating : 5.0,
            totalDeliveries: d.totalDeliveries || 0,
            activeOrder: matchingOrder?.orderNumber,
            lastUpdate: lastUpdateFormatted,
            hasGpsFix: hasRealGps,
          };
        });

      setDrivers(realOnlineDrivers);
      setActiveOrders(inTransitOrders);

      setSelectedDriver((prev) => {
        if (!prev) return realOnlineDrivers[0] || null;
        const stillExists = realOnlineDrivers.find((d) => d.id === prev.id);
        return stillExists || realOnlineDrivers[0] || null;
      });
    } catch (e) {
      console.error('Erreur chargement live map:', e);
    } finally {
      setLoading(false);
    }
  }

  // 2. Initialisation Leaflet OpenStreetMap
  useEffect(() => {
    let isMounted = true;

    // Charger CSS Leaflet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Charger JS Leaflet
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;

    script.onload = () => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      try {
        if (!mapInstanceRef.current) {
          // Centrer par défaut sur Haïti (Vue globale équilibrée)
          const map = L.map(mapContainerRef.current, {
            center: [18.9712, -72.2852],
            zoom: 9,
            zoomControl: false,
          });

          // OpenStreetMap 100% sans filigrane
          const initialTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          tileLayerRef.current = initialTile;
          if (mapContainerRef.current) {
            mapContainerRef.current.classList.add('dark-osm-map');
          }

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          mapInstanceRef.current = map;
          setMapEngineReady(true);
        }
      } catch (err) {
        console.warn('Map initialization note:', err);
      }
    };

    document.head.appendChild(script);

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (_) {}
      }
    };
  }, []);

  // 3. Adapter automatiquement la vue aux positions réelles des chauffeurs
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapEngineReady || drivers.length === 0) return;

    if (drivers.length === 1) {
      map.setView([drivers[0].lat, drivers[0].lng], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(drivers.map((d) => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [drivers.length, mapEngineReady]);

  // 4. Changer le style de la carte dynamiquement (Nwa, Satelit HD, Lari)
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapEngineReady) return;

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch (_) {}
    }

    if (mapStyle === 'DARK') {
      mapContainerRef.current?.classList.add('dark-osm-map');
      tileLayerRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    } else if (mapStyle === 'SATELLITE') {
      mapContainerRef.current?.classList.remove('dark-osm-map');
      tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 19,
      }).addTo(map);
    } else {
      mapContainerRef.current?.classList.remove('dark-osm-map');
      tileLayerRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }
  }, [mapStyle, mapEngineReady]);

  // 5. Dessiner et mettre à jour les marqueurs GPS réels sur la carte
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapEngineReady) return;

    // Nettoyer les marqueurs des chauffeurs qui ne sont plus en ligne
    const currentIds = new Set(drivers.map((d) => d.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Mettre à jour ou ajouter les marqueurs des vrais chauffeurs
    drivers.forEach((driver) => {
      const isSelected = selectedDriver?.id === driver.id;
      const isOnline = driver.status === 'ONLINE';
      const color = isOnline ? '#10B981' : '#FF6B00';

      const customHtml = `
        <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: ${color};
            opacity: ${isSelected ? 0.45 : 0.25};
            animation: pulse-ring 2s infinite ease-out;
          "></div>
          <div style="
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #FFFFFF;
            border: 2.5px solid ${isSelected ? '#EB1700' : color};
            box-shadow: 0 2px 10px rgba(0,0,0,0.15), 0 0 10px ${isSelected ? '#EB1700' : color}66;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${color};
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path d="M15 6h4l2 4-5 1" />
              <path d="M9 17.5l3-7.5h4" />
              <path d="M5.5 17.5L8 10l4 1" />
              <circle cx="12" cy="5" r="1.5" />
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -18px;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 1px 7px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            color: #fff;
            white-space: nowrap;
            letter-spacing: 0.2px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          ">
            ${driver.name.split(' ')[0]}
          </div>
        </div>
      `;

      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: customHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      if (markersRef.current.has(driver.id)) {
        const marker = markersRef.current.get(driver.id);
        marker.setLatLng([driver.lat, driver.lng]);
        marker.setIcon(driverIcon);
      } else {
        const marker = L.marker([driver.lat, driver.lng], { icon: driverIcon })
          .addTo(map)
          .on('click', () => setSelectedDriver(driver));
        markersRef.current.set(driver.id, marker);
      }
    });
  }, [drivers, selectedDriver, mapEngineReady]);

  // 6. Centrer la carte sur le chauffeur sélectionné
  useEffect(() => {
    if (mapInstanceRef.current && selectedDriver) {
      mapInstanceRef.current.panTo([selectedDriver.lat, selectedDriver.lng], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedDriver?.id]);

  // 7. Abonnement Supabase Realtime (WebSockets)
  useEffect(() => {
    loadData();

    // S'abonner aux changements dans `driver_profiles`
    const channel = supabase
      .channel('admin-live-fleet-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_profiles' },
        (payload) => {
          setRealtimeActive(true);
          const updated = payload.new as any;
          if (!updated || !updated.id) return;

          // Si le chauffeur passe OFFLINE -> le retirer immédiatement de la carte
          if (updated.status === 'OFFLINE') {
            setDrivers((prev) => prev.filter((d) => d.id !== updated.id));
            setSelectedDriver((prev) => (prev?.id === updated.id ? null : prev));
            return;
          }

          // Si le chauffeur est en ligne avec de vraies coordonnées GPS
          const rawLat = Number(updated.currentLatitude);
          const rawLng = Number(updated.currentLongitude);
          const hasCoords = !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0;

          setDrivers((prev) => {
            const existingIndex = prev.findIndex((d) => d.id === updated.id);
            const lastUpdateStr = new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            if (existingIndex >= 0) {
              const nextList = [...prev];
              nextList[existingIndex] = {
                ...nextList[existingIndex],
                lat: hasCoords ? rawLat : nextList[existingIndex].lat,
                lng: hasCoords ? rawLng : nextList[existingIndex].lng,
                status: updated.status || nextList[existingIndex].status,
                lastUpdate: lastUpdateStr,
                hasGpsFix: hasCoords || nextList[existingIndex].hasGpsFix,
              };
              return nextList;
            } else {
              // Nouveau chauffeur qui vient de passer en ligne: recharger pour récupérer nom & véhicule
              loadData();
              return prev;
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Recharger les commandes en transit automatiquement
          loadData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true);
        }
      });

    // Polling de synchronisation douce toutes les 12 secondes
    const syncInterval = setInterval(loadData, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(syncInterval);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // 8. Tès simulation mouvman (pou tès lokal si admin lan vle wè animasyon)
  function toggleSimulation() {
    if (simulationRunning) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setSimulationRunning(false);
      loadData(); // retabli bon pozisyon reyèl
    } else {
      setSimulationRunning(true);
      simIntervalRef.current = setInterval(() => {
        setDrivers((prev) =>
          prev.map((d) => {
            const deltaLat = (Math.random() - 0.48) * 0.0004;
            const deltaLng = (Math.random() - 0.48) * 0.0004;
            return {
              ...d,
              lat: d.lat + deltaLat,
              lng: d.lng + deltaLng,
              lastUpdate: new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            };
          })
        );
      }, 2000);
    }
  }

  const filteredDrivers = drivers.filter((d) => {
    if (filterStatus === 'ALL') return true;
    return d.status === filterStatus;
  });

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
              <IconLiveMap size={18} color="#FFFFFF" />
            </div>
            <span>Carte en Direct & Flotte GPS</span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: realtimeActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,184,0,0.15)',
              border: `1px solid ${realtimeActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,184,0,0.3)'}`,
              padding: '3px 10px',
              borderRadius: 20,
              marginLeft: 8,
            }}>
              <span className="live-dot" style={{ width: 7, height: 7, background: realtimeActive ? '#10B981' : '#F59E0B' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: realtimeActive ? '#10B981' : '#F59E0B' }}>
                {realtimeActive ? 'GPS Realtime Aktif' : 'Koneksyon Supabase...'}
              </span>
            </div>
          </div>
          <div className="topbar-subtitle">
            Flòt Chofè Reyèl — Se sèl chofè ki <strong style={{ color: '#10B981' }}>AN LIY</strong> avèk bon GPS ki parèt sou kat la
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className={`btn btn-sm ${simulationRunning ? 'btn-primary' : 'btn-secondary'}`}
            onClick={toggleSimulation}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            title="Pèmèt teste animasyon deplasman sou chofè ki deja an liy yo"
          >
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: simulationRunning ? '#fff' : '#10B981',
              display: 'inline-block'
            }} />
            <span>{simulationRunning ? 'Kite Mòd Tès' : 'Tès Mouvman Flòt'}</span>
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <IconRefresh size={13} color="currentColor" />
            <span>Rafrechi</span>
          </button>
        </div>
      </div>

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column' }}>

      <style jsx global>{`
        @media (max-width: 960px) {
          .live-map-grid {
            grid-template-columns: 1fr !important;
          }
          .live-map-badges {
            position: static !important;
            margin-bottom: 10px;
          }
        }
      `}</style>

      {/* Grille principale : Carte + Panneau Flotte */}
      <div className="live-map-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(320px, 1fr)', gap: 16 }}>
        {/* Conteneur de la Carte Leaflet */}
        <div className="card p-0 overflow-hidden relative" style={{ minHeight: 640, height: 'calc(100vh - 220px)', position: 'relative' }}>
          {/* Conteneur HTML pour la carte Leaflet */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }} />

          {/* Badges d'information Flottants sur la Carte (Top-Left) */}
          <div className="live-map-badges" style={{
            position: 'absolute',
            top: 14,
            left: 14,
            zIndex: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <IconDrivers size={16} color="var(--primary-500)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                {drivers.filter(d => d.status === 'ONLINE').length} Disponibles
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FF6B00' }}>
                {drivers.filter(d => d.status === 'BUSY').length} Nan Kous
              </span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 14,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <IconOrders size={15} color="#00E5FF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00E5FF' }}>
                {activeOrders.length} Livrezon An Kous
              </span>
            </div>
          </div>

          {/* Chwa Tip Kat la (Top-Right) */}
          <div style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 14,
            padding: 4,
            display: 'flex',
            gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {(['DARK', 'SATELLITE', 'STREET'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setMapStyle(st)}
                style={{
                  background: mapStyle === st ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: mapStyle === st ? '#fff' : 'var(--text-secondary)',
                  border: mapStyle === st ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  borderRadius: 10,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'DARK' ? 'Nwa (Dark)' : st === 'SATELLITE' ? 'Satelit HD' : 'Lari (OSM)'}
              </button>
            ))}
          </div>

          {/* Légende Bas Gauche */}
          <div style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 11,
            display: 'flex',
            gap: 14,
            color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ color: '#fff', fontWeight: 600 }}>Chofè Disponib</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B00' }} />
              <span style={{ color: '#fff', fontWeight: 600 }}>Chofè Nan Kous</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748B' }} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Hòs Liy (Kache)</span>
            </div>
          </div>
        </div>

        {/* Panneau Latéral : Liste des Livreurs & Fiche Détail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          {/* Fiche détaillée du livreur sélectionné */}
          {selectedDriver && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(255,48,8,0.08) 0%, rgba(15,23,42,0.95) 100%)',
              border: '1.5px solid rgba(255,48,8,0.25)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--primary-500)',
                    background: 'rgba(255,48,8,0.15)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    letterSpacing: 0.5,
                  }}>
                    CHOFÈ EN DIRECT
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                    {selectedDriver.name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedDriver.vehicleType} · {selectedDriver.vehiclePlate}
                  </div>
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 800,
                  background: selectedDriver.status === 'ONLINE' ? 'rgba(16,185,129,0.15)' : 'rgba(255,107,0,0.15)',
                  color: selectedDriver.status === 'ONLINE' ? '#10B981' : '#FF6B00',
                  border: `1px solid ${selectedDriver.status === 'ONLINE' ? '#10B981' : '#FF6B00'}44`,
                }}>
                  {selectedDriver.status === 'ONLINE' ? 'DISPONIB' : 'NAN KOUS'}
                </span>
              </div>

              {/* Infos Clés */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                <div style={{ background: 'var(--surface-2)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>NÒT</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold-500)', marginTop: 2 }}>
                    ★ {selectedDriver.rating.toFixed(1)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>LIVREZON</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                    {selectedDriver.totalDeliveries}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '8px 10px', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>DÈNYE GPS</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
                    {selectedDriver.lastUpdate || 'Live'}
                  </div>
                </div>
              </div>

              {/* Commande en cours si actif */}
              {selectedDriver.activeOrder && (
                <div style={{
                  background: 'rgba(255,107,0,0.1)',
                  border: '1px solid rgba(255,107,0,0.3)',
                  padding: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FF6B00' }}>KÒMAND AN KOUS</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{selectedDriver.activeOrder}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Chofè a ap fè livrezon sa a kounye a
                  </div>
                </div>
              )}

              {/* Coordonnées & Contact */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`tel:${selectedDriver.phone}`}
                  className="btn btn-sm btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12 }}
                >
                  <IconMobile size={13} color="currentColor" />
                  <span>{selectedDriver.phone}</span>
                </a>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([selectedDriver.lat, selectedDriver.lng], 16, { animate: true });
                    }
                  }}
                  style={{ fontSize: 12, padding: '0 12px' }}
                >
                  Zoomer
                </button>
              </div>
            </div>
          )}

          {/* Liste complète de la flotte */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="card-title">Chofè ki Sou Kat la ({filteredDrivers.length})</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                GPS Realtime
              </span>
            </div>

            {/* Filtè Estati Chofè */}
            <div style={{
              display: 'flex',
              gap: 6,
              background: 'var(--surface-2)',
              padding: 4,
              borderRadius: 10,
              marginBottom: 12,
            }}>
              {(['ALL', 'ONLINE', 'BUSY'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    flex: 1,
                    background: filterStatus === st ? 'var(--primary-500)' : 'transparent',
                    color: filterStatus === st ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  {st === 'ALL' ? 'Tout' : st === 'ONLINE' ? 'Disponib' : 'Nan Kous'}
                </button>
              ))}
            </div>

            {filteredDrivers.length === 0 ? (
              <div style={{
                padding: '30px 20px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 14,
                border: '1px dashed rgba(255,255,255,0.12)',
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,48,8,0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  color: 'var(--primary-500)',
                }}>
                  <IconDrivers size={22} color="currentColor" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  Pa gen okenn chofè an liy
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Lè yon chofè pase <strong style={{ color: '#10B981' }}>An Liy</strong> nan aplikasyon chofè a epi li emèt pozisyon GPS li, li ap parèt otomatikman sou kat la an tan reyèl. Chofè ki hòs liy (OFFLINE) pa parèt sou kat la.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredDrivers.map((driver) => {
                  const isSelected = selectedDriver?.id === driver.id;
                  const isOnline = driver.status === 'ONLINE';

                  return (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: isSelected ? 'rgba(255,48,8,0.12)' : 'var(--surface-2)',
                        border: `1px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(255,107,0,0.15)',
                          border: `1.5px solid ${isOnline ? '#10B981' : '#FF6B00'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isOnline ? '#10B981' : '#FF6B00',
                          flexShrink: 0,
                        }}>
                          <IconDrivers size={17} color="currentColor" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                            {driver.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {driver.vehiclePlate} &bull; {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 10,
                          background: isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(255,107,0,0.15)',
                          color: isOnline ? '#10B981' : '#FF6B00',
                        }}>
                          {isOnline ? 'DISPO' : 'NAN KOUS'}
                        </span>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                          {driver.lastUpdate}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
}
