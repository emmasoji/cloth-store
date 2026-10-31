import { Outlet, Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Image,
  Tag,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/media', label: 'Media', icon: Image },
  { to: '/admin/discounts', label: 'Discounts', icon: Tag },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { resolved, toggle } = useTheme()

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <aside
        className="hidden lg:flex flex-col w-56 border-r shrink-0"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
      >
        <div className="h-14 flex items-center px-5 font-display text-lg font-semibold border-b" style={{ borderColor: 'var(--border)' }}>
          NEON Admin
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm transition-opacity ${
                  isActive ? 'opacity-100 font-medium' : 'opacity-60 hover:opacity-100'
                }`
              }
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link to="/" className="text-xs opacity-50 hover:opacity-100">
            View Storefront
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="lg:hidden font-display font-semibold">NEON Admin</span>
          <div className="flex-1" />
          <button onClick={toggle} className="p-2 opacity-70 hover:opacity-100">
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