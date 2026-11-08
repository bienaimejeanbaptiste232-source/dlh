'use client';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconDashboard,
  IconLiveMap,
  IconOrders,
  IconDrivers,
  IconMerchants,
  IconCustomers,
  IconFinance,
  IconTransactions,
  IconWallets,
  IconPayouts,
  IconZones,
  IconPricing,
  IconSettings,
  IconLogo,
  IconX,
} from './Icons';

const NAV_ITEMS = [
  {
    section: 'Vue d\'ensemble',
    items: [
      { href: '/dashboard', Icon: IconDashboard, label: 'Tableau de bord' },
      { href: '/dashboard/live-map', Icon: IconLiveMap, label: 'Carte en direct', badge: 'LIVE' },
    ],
  },
  {
    section: 'Opérations',
    items: [
      { href: '/dashboard/dispatch', Icon: IconOrders, label: 'Centre Dispatch', badge: 'LIVE' },
      { href: '/dashboard/orders', Icon: IconOrders, label: 'Commandes' },
      { href: '/dashboard/drivers', Icon: IconDrivers, label: 'Livreurs' },
      { href: '/dashboard/merchants', Icon: IconMerchants, label: 'Restaurants & Boutiques' },
      { href: '/dashboard/customers', Icon: IconCustomers, label: 'Clients' },
    ],
  },
  {
    section: 'Finance & Trésorerie',
    items: [
      { href: '/dashboard/finance', Icon: IconFinance, label: 'Vue Financière' },
      { href: '/dashboard/finance/transactions', Icon: IconTransactions, label: 'Transactions' },
      { href: '/dashboard/finance/wallets', Icon: IconWallets, label: 'Portefeuilles' },
      { href: '/dashboard/finance/payouts', Icon: IconPayouts, label: 'Retraits' },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { href: '/dashboard/zones', Icon: IconZones, label: 'Zones de livraison' },
      { href: '/dashboard/pricing', Icon: IconPricing, label: 'Tarification' },
      { href: '/dashboard/settings/content', Icon: IconSettings, label: 'Kontni & Mesaj Platfòm' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'A';

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Administrateur',
    FINANCE: 'Équipe Finance',
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.png"
            alt="Delivery Lakay"
            style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: '#FFFFFF', padding: '1px 2px' }}
          />
          <div className="sidebar-logo-text">
            <h1>Delivery Lakay</h1>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--surface-3)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Fermer le menu"
          >
            <IconX size={16} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const { Icon } = item;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-item-icon">
                    <Icon size={18} color={isActive ? '#EB1700' : '#475569'} />
                  </span>
                  <span>{item.label}</span>
                  {(item as any).badge && (
                    <span
                      className="nav-badge"
                      style={{
                        background: 'rgba(16,185,129,0.16)',
                        color: '#10B981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        fontSize: 9,
                        letterSpacing: 0.6,
                        fontWeight: 800,
                        padding: '2px 7px',
                      }}
                    >
                      ● {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="sidebar-user-avatar">{initials}</div>
            <div
              style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid #FFFFFF',
              }}
            />
          </div>
          <div className="sidebar-user-info">
            <div className="name">{user?.firstName} {user?.lastName}</div>
            <div className="role">{roleLabel[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            style={{
              color: 'var(--text-muted)',
              fontSize: 16,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EB1700';
              e.currentTarget.style.borderColor = 'rgba(235, 23, 0, 0.4)';
              e.currentTarget.style.background = 'rgba(235, 23, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'var(--surface-3)';
            }}
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
