import { useState, useEffect } from 'react'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
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

export type Page = 'home' | 'checkout' | 'profile' | 'auth' | 'orders'
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

  // Category in query param: ?cat=RESTAURANT
  const cat = searchParams.get('cat') || searchParams.get('category')
  const validCategories: MerchantCategory[] = ['ALL', 'RESTAURANT', 'FAST_FOOD', 'SUPERMARKET', 'PHARMACY', 'CONSTRUCTION', 'BEVERAGE_DEPOT']
  const matchedCat = cat ? validCategories.find(c => c.toLowerCase() === cat.toLowerCase()) : undefined

  return { page: 'home', category: matchedCat }
}

function AppInner() {
  const { user, logout } = useAuth()
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
    } else {
      // Home /
      targetPage = 'home'
      targetPath = '/'
    }

    // Auth guards
    if ((targetPage === 'profile' || targetPage === 'orders') && !user) {
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
    navigate('home')
    setTimeout(() => {
      const el = document.getElementById('merchants-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
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
      </main>

      <ToastContainer />

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
