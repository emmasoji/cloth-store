import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import Home from './pages/Home/Home'
import Shop from './pages/Shop/Shop'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import Account from './pages/Account/Account'
import AdminLayout from './admin/components/AdminLayout'
import AdminDashboard from './admin/dashboard/Dashboard'
import { CartProvider } from './contexts/CartContext'
import { ToastProvider } from './contexts/ToastContext'
import ScrollToTop from './components/common/ScrollToTop'

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <ToastProvider>
      <CartProvider>
        <ScrollToTop />
        <AnimatePresence mode="wait">
          {isAdmin ? (
            <Routes location={location} key="admin">
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminDashboard />} />
                <Route path="*" element={<AdminDashboard />} />
              </Route>
            </Routes>
          ) : (
            <Layout>
              <Routes location={location} key="store">
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/account/*" element={<Account />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </Layout>
          )}
        </AnimatePresence>
      </CartProvider>
    </ToastProvider>
  )
}