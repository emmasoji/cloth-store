import { useEffect, useState } from 'react'
import { api } from '../../services/api'

interface Overview {
  total_revenue: number
  today_revenue: number
  monthly_revenue: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  average_order_value: number
  total_customers: number
  message?: string
}

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/analytics/overview')
      .then(setData)
      .catch(() =>
        setData({
          total_revenue: 0,
          today_revenue: 0,
          monthly_revenue: 0,
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          average_order_value: 0,
          total_customers: 0,
          message: 'Connect Supabase for live analytics',
        })
      )
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Revenue', value: data ? `₦${data.total_revenue.toLocaleString()}` : '—' },
    { label: "Today's Revenue", value: data ? `₦${data.today_revenue.toLocaleString()}` : '—' },
    { label: 'Monthly Revenue', value: data ? `₦${data.monthly_revenue.toLocaleString()}` : '—' },
    { label: 'Total Orders', value: data?.total_orders ?? '—' },
    { label: 'Pending Orders', value: data?.pending_orders ?? '—' },
    { label: 'Completed Orders', value: data?.completed_orders ?? '—' },
    { label: 'Avg Order Value', value: data ? `₦${Math.round(data.average_order_value).toLocaleString()}` : '—' },
    { label: 'Customers', value: data?.total_customers ?? '—' },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Overview</h1>
      {data?.message && (
        <p className="text-sm opacity-50 mb-4">{data.message}</p>
      )}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 animate-pulse" style={{ backgroundColor: 'var(--bg2)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="p-4 border"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
            >
              <p className="text-xs tracking-widest uppercase opacity-50 mb-2">{c.label}</p>
              <p className="text-xl font-medium">{c.value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-10 border p-6" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm tracking-widest uppercase opacity-50 mb-4">Quick Start</h2>
        <ol className="text-sm space-y-2 opacity-80 list-decimal list-inside">
          <li>Run Supabase SQL setup from <code className="text-xs">supabase/setup.sql</code></li>
          <li>Create Storage buckets (products, categories, homepage, etc.)</li>
          <li>Set environment variables in backend and frontend</li>
          <li>Create an admin user and set role = admin in profiles</li>
          <li>Add products via API or extend this dashboard</li>
        </ol>
      </div>
    </div>
  )
}