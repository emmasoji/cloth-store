import { Outlet, Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Tag,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { resolved, toggle } = useTheme()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <aside
        className="hidden lg:flex flex-col w-60 border-r shrink-0 fixed top-0 left-0 h-screen z-30"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
      >
        <div
          className="h-16 flex items-center px-6 font-display text-xl font-semibold border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          NEON Admin
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-base rounded-xl transition-all duration-200 ${
                  isActive ? 'font-medium opacity-100' : 'opacity-55 hover:opacity-100'
                }`
              }
              style={({ isActive }) => (isActive ? { backgroundColor: 'var(--bg)' } : undefined)}
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Link to="/" className="text-sm opacity-50 hover:opacity-100 transition-opacity">
            View Storefront
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 border-b sticky top-0 z-20"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
        >
          <span className="lg:hidden font-display font-semibold text-lg">NEON Admin</span>
          <div className="flex-1" />
          <button onClick={toggle} className="p-2 rounded-lg opacity-70 hover:opacity-100">
            {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
