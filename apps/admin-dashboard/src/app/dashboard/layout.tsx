'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import LiveMissionToast from '../../components/LiveMissionToast';
import { IconMenu, IconLogo } from '../../components/Icons';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'A';

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle props */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Sleek Mobile Header (Only visible on <= 1024px) */}
        <header className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
            aria-label="Ouvrir le menu"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'var(--surface-3)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <IconMenu size={20} color="var(--primary-500)" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="Delivery Lakay"
              style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#FFFFFF', padding: '1px' }}
            />
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: -0.3 }}>
              Delivery Lakay
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--surface-4)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {initials}
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '1.5px solid var(--surface-1)',
                }}
              />
            </div>
          </div>
        </header>

        <LiveMissionToast />
        {children}
      </main>
    </div>
  );
}
