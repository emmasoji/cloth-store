import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Search, User, Heart, ShoppingBag, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { motion, AnimatePresence } from 'framer-motion'
import CurrencyIcon from '../common/CurrencyIcon'

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
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const { count, openCart } = useCart()
  const { resolved, toggle } = useTheme()
  const { currency, setCurrency } = useCurrency()

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="font-display text-2xl tracking-tight">
            NEON
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `text-[11px] tracking-[0.18em] uppercase transition-opacity duration-200 hover:opacity-70 ${
                    isActive ? 'opacity-100' : 'opacity-55'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Custom currency dropdown */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setCurrencyOpen((o) => !o)}
                className="flex items-center gap-1 text-[11px] tracking-widest uppercase opacity-70 hover:opacity-100 px-2 py-1.5 rounded-lg transition-opacity"
                aria-label="Currency"
              >
                <CurrencyIcon code={currency} size={18} />
                <span>{currency}</span>
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {currencyOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-50 min-w-[88px] py-1 border shadow-lg"
                      style={{
                        backgroundColor: 'var(--bg)',
                        borderColor: 'var(--border)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {currencies.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCurrency(c)
                            setCurrencyOpen(false)
                          }}
                          className={`block w-full text-left px-3 py-2 text-[11px] tracking-widest uppercase transition-colors ${
                            c === currency ? 'opacity-100 font-medium' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c === currency ? 'var(--bg2)' : 'transparent' }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <CurrencyIcon code={c} size={18} />
                            {c}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggle}
              className="p-2 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Toggle theme"
            >
              {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="hidden sm:block p-2 rounded-lg opacity-70 hover:opacity-100" aria-label="Search">
              <Search size={18} />
            </button>

            <Link to="/account" className="p-2 rounded-lg opacity-70 hover:opacity-100" aria-label="Account">
              <User size={18} />
            </Link>

            <button className="hidden sm:block p-2 rounded-lg opacity-70 hover:opacity-100" aria-label="Wishlist">
              <Heart size={18} />
            </button>

            <button onClick={openCart} className="relative p-2 rounded-lg opacity-70 hover:opacity-100" aria-label="Cart">
              <ShoppingBag size={18} />
              {count > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-text)' }}
                >
                  {count}
                </span>
              )}
            </button>

            <button
              className="lg:hidden p-2 rounded-lg"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — smoother slide + fade */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[min(100%,320px)] flex flex-col border-l lg:hidden"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div
                className="flex items-center justify-between px-5 h-16 border-b shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="font-display text-xl">NEON</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.div
                    key={l.label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 text-sm tracking-[0.12em] uppercase rounded-lg px-2 hover:opacity-70 transition-opacity"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="px-5 py-5 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
                <p className="text-[10px] tracking-widest uppercase opacity-50">Currency</p>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] tracking-widest uppercase rounded-lg border transition-colors"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: c === currency ? 'var(--btn)' : 'transparent',
                        color: c === currency ? 'var(--btn-text)' : 'var(--text)',
                      }}
                    >
                      <CurrencyIcon code={c} size={16} />
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
