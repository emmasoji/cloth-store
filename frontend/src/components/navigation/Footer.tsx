import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await api.post('/api/newsletter/subscribe', { email })
      toast('Subscribed successfully', 'success')
      setEmail('')
    } catch (err: any) {
      toast(err?.message || 'Subscription failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="border-t mt-20" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="font-display text-2xl font-semibold mb-4">NEON</div>
            <p className="text-sm opacity-70 leading-relaxed">
              Premium thrifted streetwear. Curated culture. Individual style.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase mb-4 opacity-50">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="opacity-80 hover:opacity-100">All Products</Link></li>
              <li><Link to="/shop/hoodies" className="opacity-80 hover:opacity-100">Hoodies</Link></li>
              <li><Link to="/shop/t-shirts" className="opacity-80 hover:opacity-100">T-Shirts</Link></li>
              <li><Link to="/shop/pants" className="opacity-80 hover:opacity-100">Pants</Link></li>
              <li><Link to="/shop/accessories" className="opacity-80 hover:opacity-100">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase mb-4 opacity-50">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="opacity-80 hover:opacity-100">About Us</Link></li>
              <li><Link to="/contact" className="opacity-80 hover:opacity-100">Contact</Link></li>
              <li><button type="button" className="opacity-80 hover:opacity-100 text-left">Track Your Order</button></li>
              <li><Link to="/about" className="opacity-80 hover:opacity-100">Shipping & Delivery</Link></li>
              <li><Link to="/about" className="opacity-80 hover:opacity-100">Returns & Refunds</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase mb-4 opacity-50">Newsletter</h4>
            <form onSubmit={subscribe} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="px-3 py-2.5 text-sm border bg-transparent outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <button type="submit" disabled={loading} className="btn-primary text-xs">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div
          className="mt-12 pt-8 border-t text-xs opacity-50 flex flex-col sm:flex-row justify-between gap-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <span>&copy; {new Date().getFullYear()} NEON. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/about">Privacy Policy</Link>
            <Link to="/about">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}