import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

interface OrderRow {
  id: string
  order_number: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  status: string
  total_amount: number
  currency?: string
  created_at?: string
  tracking_number?: string
  shipping_provider?: string
  shipping_address?: Record<string, string>
  order_items?: Array<{
    product_name: string
    quantity: number
    unit_price: number
    size?: string
    colour?: string
  }>
  payments?: Array<{ status: string; reference?: string }>
}

const STATUSES = [
  'pending',
  'payment_pending',
  'payment_failed',
  'paid',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
]

export default function OrdersPage() {
  const [items, setItems] = useState<OrderRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<OrderRow | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [tracking, setTracking] = useState('')
  const [provider, setProvider] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    const q = filter ? `?status=${filter}&limit=100` : '?limit=100'
    api
      .get(`/api/admin/orders${q}`)
      .then((d) => {
        setItems(d?.items || [])
        setTotal(d?.total || 0)
      })
      .catch((e) => toast(e.message || 'Failed to load orders', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [filter])

  const open = (o: OrderRow) => {
    setSelected(o)
    setEditStatus(o.status)
    setTracking(o.tracking_number || '')
    setProvider(o.shipping_provider || '')
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/api/admin/orders/${selected.id}`, {
        status: editStatus,
        tracking_number: tracking || null,
        shipping_provider: provider || null,
      })
      toast('Order updated', 'success')
      setSelected(null)
      load()
    } catch (e: any) {
      toast(e?.message || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Orders</h1>
          <p className="text-sm opacity-50 mt-1">{total} orders</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border px-3 py-2 bg-transparent outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse" style={{ backgroundColor: 'var(--bg2)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border p-12 text-center text-sm opacity-60" style={{ borderColor: 'var(--border)' }}>
          No orders yet
        </div>
      ) : (
        <div className="border overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-xs tracking-widest uppercase opacity-50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr
                  key={o.id}
                  className="border-b cursor-pointer hover:opacity-80"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => open(o)}
                >
                  <td className="px-4 py-3 font-medium">{o.order_number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell opacity-70">{o.guest_name || o.guest_email || '—'}</td>
                  <td className="px-4 py-3">₦{Number(o.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase tracking-wide">{o.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell opacity-50 text-xs">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border p-6"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">{selected.order_number}</h2>
              <button onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <Row label="Customer" value={selected.guest_name || '—'} />
              <Row label="Email" value={selected.guest_email || '—'} />
              <Row label="Phone" value={selected.guest_phone || '—'} />
              <Row label="Total" value={`₦${Number(selected.total_amount).toLocaleString()}`} />
              {selected.order_items && selected.order_items.length > 0 && (
                <div>
                  <p className="text-xs tracking-widest uppercase opacity-50 mb-2">Items</p>
                  <ul className="space-y-1">
                    {selected.order_items.map((it, i) => (
                      <li key={i} className="opacity-80">
                        {it.quantity}x {it.product_name}
                        {(it.size || it.colour) && ` (${[it.size, it.colour].filter(Boolean).join(', ')})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <label className="block">
                <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Tracking number</span>
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  className="w-full px-3 py-2 text-sm border bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </label>
              <label className="block">
                <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Shipping provider</span>
                <input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm border bg-transparent outline-none"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </label>
              <button onClick={save} disabled={saving} className="btn-primary w-full text-xs">
                {saving ? 'Saving...' : 'Update order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="opacity-50">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}