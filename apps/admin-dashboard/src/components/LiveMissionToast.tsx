'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface ToastItem {
  id: string;
  type: 'ACCEPTED' | 'REJECTED' | 'DISPATCHED';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  driverName?: string;
  createdAt: number;
}

export default function LiveMissionToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, 'id' | 'createdAt'>) => {
    const newToast: ToastItem = {
      ...toast,
      id: Math.random().toString(36).slice(2, 9),
      createdAt: Date.now(),
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

    // Auto-dismiss apre 8 segonn
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 8000);
  };

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    let socket: Socket | null = null;

    try {
      socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1500,
      });

      socket.on('connect', () => {
        socket?.emit('admin:join');
        socket?.emit('admin:join_dispatch');
      });

      // Lè chofè aksepte misyon
      socket.on('admin:mission_accepted', (data: any) => {
        addToast({
          type: 'ACCEPTED',
          title: '🎉 CHOFÈ A AKSEPTE KOUS LA !',
          message: data.message || `Chofè ${data.driverName || 'a'} aksepte kòmand #${data.orderNumber || data.orderId?.slice(0, 8)} avèk siksè.`,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          driverName: data.driverName,
        });
      });

      // Lè chofè refize misyon
      socket.on('admin:mission_rejected', (data: any) => {
        addToast({
          type: 'REJECTED',
          title: '⚠️ CHOFÈ A PA AKSEPTE KOUS LA',
          message: data.message || `Chofè a refize kòmand #${data.orderNumber || data.orderId?.slice(0, 8)}. Li retounen nan dispatch.`,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
        });
      });

      // Lè admin voye yon nouvo alèt bay chofè
      socket.on('admin:mission_dispatched', (data: any) => {
        const num = data.missionData?.orderNumber || data.missionData?.orderId?.slice(0, 8) || '';
        addToast({
          type: 'DISPATCHED',
          title: '📡 ALÈT VOYE BAY CHOFÈ',
          message: `Kòmand #${num} voye sou telefòn chofè a. Ap tann li aksepte (25s)...`,
          orderId: data.missionData?.orderId,
          orderNumber: num,
        });
      });
    } catch (e) {
      console.warn('LiveMissionToast socket connection error:', e);
    }

    // Supabase Realtime backup
    const channel = supabase.channel('global-toast-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
        const st = payload?.new?.status;
        const ordNum = payload?.new?.orderNumber || payload?.new?.id?.slice(0, 8);
        if (st === 'DRIVER_ASSIGNED' || st === 'DRIVER_ARRIVING') {
          addToast({
            type: 'ACCEPTED',
            title: '🎉 CHOFÈ ASINYE AVÈK SIKSÈ',
            message: `Kòmand #${ordNum} gen yon kousye ki konfime kous la.`,
            orderId: payload?.new?.id,
            orderNumber: ordNum,
          });
        }
      })
      .subscribe();

    return () => {
      socket?.disconnect();
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => {
        const isAccepted = toast.type === 'ACCEPTED';
        const isRejected = toast.type === 'REJECTED';
        const borderColor = isAccepted ? '#10b981' : isRejected ? '#EB1700' : '#3b82f6';
        const bgColor = isAccepted ? '#F0FDF4' : isRejected ? '#FFF1F0' : '#EFF6FF';
        const iconBg = isAccepted ? 'rgba(16,185,129,0.12)' : isRejected ? 'rgba(235,23,0,0.10)' : 'rgba(59,130,246,0.10)';
        const iconColor = isAccepted ? '#10b981' : isRejected ? '#EB1700' : '#3b82f6';
        const titleColor = isAccepted ? '#065F46' : isRejected ? '#7F1D1D' : '#1E3A8A';
        const textColor = isAccepted ? '#047857' : isRejected ? '#991B1B' : '#1D4ED8';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: bgColor,
              border: `1.5px solid ${borderColor}`,
              boxShadow: `0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px ${borderColor}22`,
              borderRadius: '14px',
              padding: '14px 18px',
              color: titleColor,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              backdropFilter: 'blur(8px)',
              animation: 'slideInRight 0.35s ease-out',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  fontWeight: 'bold',
                  color: iconColor,
                  border: `1px solid ${borderColor}33`,
                }}
              >
                {isAccepted ? '✓' : isRejected ? '✕' : '📡'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.3px', marginBottom: '3px', color: titleColor }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: '12.5px', color: textColor, lineHeight: '1.4' }}>
                  {toast.message}
                </div>
                {toast.orderId && (
                  <div style={{ marginTop: '8px' }}>
                    <Link
                      href={`/dashboard/dispatch?orderId=${toast.orderId}`}
                      style={{
                        display: 'inline-block',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: iconBg,
                        color: iconColor,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        border: `1px solid ${borderColor}44`,
                      }}
                    >
                      Wè nan Dispatch →
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{
                background: 'rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: titleColor,
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
                borderRadius: '6px',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
