import { useState, useEffect } from 'react'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider, useCart } from './contexts/CartContext'
import { registerToastNotifier } from './lib/toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import CartDrawer from './components/CartDrawer'
import SplashScreen from './components/SplashScreen'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import CheckoutPage from './pages/CheckoutPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import LegalPage from './pages/LegalPage'

export type Page = 'home' | 'checkout' | 'profile' | 'auth' | 'orders' | 'terms' | 'privacy'
export type MerchantCategory = 'ALL' | 'RESTAURANT' | 'FAST_FOOD' | 'SUPERMARKET' | 'PHARMACY' | 'CONSTRUCTION' | 'BEVERAGE_DEPOT'

// ─── Toast ────────────────────────────────────────────────────
interface ToastItem { id: number; msg: string; type: 'success' | 'error' | 'info' }

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    registerToastNotifier((msg, type) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, msg, type }])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500)
    })
  }, [])

  const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={16} height={16}><polyline points="20 6 9 17 4 12"/></svg>
  const IconX    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={16} height={16}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  const IconInfo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={16} height={16}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? <IconCheck /> : t.type === 'error' ? <IconX /> : <IconInfo />}
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─── Inner App with History API Routing ───────────────────────
function parseInitialRoute(): {
  page: Page
  storeId?: string | null
  trackNumber?: string | null
  category?: MerchantCategory
} {
  if (typeof window === 'undefined') return { page: 'home' }
  const path = window.location.pathname.toLowerCase()
  const searchParams = new URLSearchParams(window.location.search)

  // 1. Store routes: /store/:id or /boutik/:id or ?store=xyz
  const storeMatch = window.location.pathname.match(/^\/(?:store|boutik)\/([^/?#]+)/i)
  const storeParam = searchParams.get('store') || searchParams.get('boutik')
  if (storeMatch || storeParam) {
    return { page: 'home', storeId: storeMatch ? storeMatch[1] : storeParam }
  }

  // 2. Track routes: /track/:orderNumber or /orders?track=xyz
  const trackMatch = window.location.pathname.match(/^\/track\/([^/?#]+)/i)
  const trackParam = searchParams.get('track')
  if (trackMatch || trackParam) {
    return { page: 'orders', trackNumber: trackMatch ? trackMatch[1] : trackParam }
  }

  // 3. Orders: /orders or /komand
  if (path === '/orders' || path === '/komand' || path.startsWith('/orders') || path.startsWith('/komand')) {
    return { page: 'orders', trackNumber: trackParam || null }
  }

  // 4. Checkout: /checkout or /kes
  if (path === '/checkout' || path === '/kes') {
    return { page: 'checkout' }
  }

  // 5. Profile: /profile or /pwofil
  if (path === '/profile' || path === '/pwofil') {
    return { page: 'profile' }
  }

  // 6. Auth: /auth or /login or /koneksyon
  if (path === '/auth' || path === '/login' || path === '/koneksyon') {
    return { page: 'auth' }
  }

  // 7. Legal pages: /terms or /kondisyon
  if (path === '/terms' || path === '/kondisyon') {
    return { page: 'terms' }
  }

  // 8. Privacy: /privacy or /vi-prive
  if (path === '/privacy' || path === '/vi-prive') {
    return { page: 'privacy' }
  }

  // 9. Category routes: /category/:cat or /kategori/:cat or ?cat=RESTAURANT
  const catMatch = window.location.pathname.match(/^\/(?:category|kategori)\/([^/?#]+)/i)
  const catParam = searchParams.get('cat') || searchParams.get('category')
  const rawCat = catMatch ? catMatch[1] : catParam
  const validCategories: MerchantCategory[] = ['ALL', 'RESTAURANT', 'FAST_FOOD', 'SUPERMARKET', 'PHARMACY', 'CONSTRUCTION', 'BEVERAGE_DEPOT']
  const matchedCat = rawCat ? validCategories.find(c => c.toLowerCase() === rawCat.toLowerCase()) : undefined

  return { page: 'home', category: matchedCat }
}

function AppInner() {
  const { user, logout } = useAuth()
  const { totalItems, subtotal, openCart } = useCart()
  const initial = parseInitialRoute()

  const [page, setPage] = useState<Page>(initial.page)
  const [storeId, setStoreId] = useState<string | null>(initial.storeId || null)
  const [trackNumber, setTrackNumber] = useState<string | null>(initial.trackNumber || null)
  const [navCategory, setNavCategory] = useState<MerchantCategory>(initial.category || 'ALL')

  const [splashFinished, setSplashFinished] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('dlh_splash_seen') === '1'
  })

  // Synchronize on browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseInitialRoute()
      setPage(route.page)
      setStoreId(route.storeId || null)
      setTrackNumber(route.trackNumber || null)
      if (route.category) setNavCategory(route.category)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (user && page === 'auth') {
      navigate('home')
    }
  }, [user])

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('dlh_splash_seen', '1')
    } catch {}
    setSplashFinished(true)
  }

  // Universal navigator accepting both page names and specific URL paths
  const navigate = (target: Page | string) => {
    let targetPage: Page = 'home'
    let targetPath = '/'
    let newStoreId: string | null = null
    let newTrackNumber: string | null = null

    if (target.startsWith('/store/') || target.startsWith('/boutik/')) {
      const parts = target.split('/')
      newStoreId = parts[2] || null
      targetPage = 'home'
      targetPath = target
    } else if (target.startsWith('/track/')) {
      const parts = target.split('/')
      newTrackNumber = parts[2] || null
      targetPage = 'orders'
      targetPath = target
    } else if (target.startsWith('/category/') || target.startsWith('/kategori/')) {
      const parts = target.split('/')
      const catKey = parts[2]?.toUpperCase() as MerchantCategory
      targetPage = 'home'
      targetPath = target
      if (catKey) setNavCategory(catKey)
      newStoreId = null
    } else if (target === 'orders' || target === '/orders') {
      targetPage = 'orders'
      targetPath = '/orders'
    } else if (target === 'checkout' || target === '/checkout') {
      targetPage = 'checkout'
      targetPath = '/checkout'
    } else if (target === 'profile' || target === '/profile') {
      targetPage = 'profile'
      targetPath = '/profile'
    } else if (target === 'auth' || target === '/auth' || target === '/login') {
      targetPage = 'auth'
      targetPath = '/auth'
    } else if (target === 'terms' || target === '/terms' || target === '/kondisyon') {
      targetPage = 'terms'
      targetPath = '/terms'
    } else if (target === 'privacy' || target === '/privacy' || target === '/vi-prive') {
      targetPage = 'privacy'
      targetPath = '/privacy'
    } else {
      // Home /
      targetPage = 'home'
      targetPath = '/'
    }

    // Auth guards (Profile and Checkout require login; Orders allows tracking without login)
    if (targetPage === 'profile' && !user) {
      targetPage = 'auth'
      targetPath = '/auth'
    }
    if (targetPage === 'checkout' && !user) {
      targetPage = 'auth'
      targetPath = '/auth'
    }

    setPage(targetPage)
    setStoreId(newStoreId)
    setTrackNumber(newTrackNumber)

    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryFilter = (cat: MerchantCategory) => {
    setNavCategory(cat)
    setStoreId(null)
    const targetPath = cat === 'ALL' ? '/' : `/category/${cat.toLowerCase()}`
    navigate(targetPath)
    setTimeout(() => {
      const el = document.getElementById('merchants-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  const handleLogout = () => {
    logout()
    navigate('home')
  }

  return (
    <div className="app-container">
      {/* Modern Brand Opening Splash (Session-persisted) */}
      {!splashFinished && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      <Navbar page={page} onNavigate={navigate} onCategoryFilter={handleCategoryFilter} activeCategory={navCategory} />
      <CartDrawer onCheckout={() => navigate('checkout')} />

      <main className="app-main">
        {page === 'auth'     && <AuthPage />}
        {page === 'home'     && (
          <HomePage
            initialFilter={navCategory}
            initialStoreId={storeId}
            onSelectStore={(id) => navigate(id ? `/store/${id}` : '/')}
            onFilterChange={(f) => setNavCategory(f as MerchantCategory)}
          />
        )}
        {page === 'checkout' && (
          <CheckoutPage
            onGoHome={() => navigate('home')}
            onGoOrders={() => navigate('orders')}
          />
        )}
        {page === 'profile'  && (
          <ProfilePage
            onLogout={handleLogout}
            onOrders={() => navigate('orders')}
          />
        )}
        {page === 'orders'   && (
          <OrdersPage
            initialTrackNumber={trackNumber}
            onSelectOrder={(num) => navigate(num ? `/track/${num}` : '/orders')}
            onGoHome={() => navigate('home')}
          />
        )}
        {(page === 'terms' || page === 'privacy') && (
          <LegalPage
            initialTab={page === 'privacy' ? 'privacy' : 'terms'}
            onGoHome={() => navigate('home')}
            onSwitchTab={(tab) => navigate(tab)}
          />
        )}
      </main>

      <ToastContainer />

      {/* Mobile Sticky Cart Bar (Shown when cart has items) */}
      {totalItems > 0 && page !== 'checkout' && (
        <div className="ma-mobile-cart-bar">
          <div className="ma-mobile-cart-info">
            <span className="ma-mobile-cart-badge">{totalItems} atik</span>
            <span className="ma-mobile-cart-total">
              {Math.round(subtotal).toLocaleString('fr-HT')} HTG
            </span>
          </div>
          <button className="ma-mobile-cart-btn" onClick={openCart}>
            <span>Wè Panyen</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/50940553636?text=Bonjou%20Delivery%20Lakay,%20mwen%20sou%20sit%20la%20e%20mwen%20ta%20renmen%20yon%20èd"
        target="_blank"
        rel="noopener noreferrer"
        className="ma-floating-whatsapp"
        title="Pale ak yon ajan sou WhatsApp (Okap)"
        aria-label="Sipò WhatsApp 24/7"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#FFFFFF">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.486-8.414z" />
        </svg>
      </a>

      {/* Footer */}
      <Footer onNavigate={navigate} user={user} />

      {/* Mobile Bottom Navigation (Visible only on mobile devices) */}
      <BottomNav page={page} onNavigate={navigate} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AuthProvider>
  )
}
