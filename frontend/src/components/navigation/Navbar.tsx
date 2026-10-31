import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Search, User, Heart, ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop', label: 'Collections' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
]

const currencies = ['NGN', 'USD', 'GBP', 'EUR'] as const

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count, openCart } = useCart()
  const { resolved, toggle } = useTheme()
  const { currency, setCurrency } = useCurrency()

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl tracking-tight font-semibold">
            NEON
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `text-xs tracking-widest uppercase transition-opacity hover:opacity-70 ${
                    isActive ? 'opacity-100' : 'opacity-60'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="hidden sm:block text-xs bg-transparent border-0 outline-none cursor-pointer opacity-70 hover:opacity-100"
              style={{ color: 'var(--text)' }}
              aria-label="Currency"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button onClick={toggle} className="p-1.5 opacity-70 hover:opacity-100" aria-label="Toggle theme">
              {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="hidden sm:block p-1.5 opacity-70 hover:opacity-100" aria-label="Search">
              <Search size={18} />
            </button>

            <Link to="/account" className="p-1.5 opacity-70 hover:opacity-100" aria-label="Account">
              <User size={18} />
            </Link>

            <button className="hidden sm:block p-1.5 opacity-70 hover:opacity-100" aria-label="Wishlist">
              <Heart size={18} />
            </button>

            <button onClick={openCart} className="relative p-1.5 opacity-70 hover:opacity-100" aria-label="Cart">
              <ShoppingBag size={18} />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-text)' }}
                >
                  {count}
                </span>
              )}
            </button>

            <button
              className="lg:hidden p-1.5"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            <div className="flex items-center justify-between px-4 h-16 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-display text-xl font-semibold">NEON</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-6">
              {links.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg tracking-wide uppercase"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="text-sm bg-transparent outline-none"
                  style={{ color: 'var(--text)' }}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}