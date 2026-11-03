import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

interface ProductRow {
  id: string
  name: string
  slug: string
  price: number
  original_price?: number
  stock_quantity?: number
  status: string
  is_featured?: boolean
  is_trending?: boolean
  is_active?: boolean
  category_id?: string
  description?: string
  sku?: string
  categories?: { name: string }
}

interface Category {
  id: string
  name: string
  slug: string
}

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  price: 0,
  original_price: 0,
  stock_quantity: 0,
  status: 'published',
  is_featured: false,
  is_trending: false,
  is_active: true,
  category_id: '',
  image_url: '',
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api
      .get('/api/admin/products?limit=100')
      .then((d) => {
        setItems(d?.items || [])
        setTotal(d?.total || 0)
      })
      .catch((e) => toast(e.message || 'Failed to load products', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/api/categories').then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (p: ProductRow) => {
    setEditing(p)
    setForm({
      name: p.name || '',
      slug: p.slug || '',
      sku: p.sku || '',
      description: p.description || '',
      price: Number(p.price) || 0,
      original_price: Number(p.original_price) || 0,
      stock_quantity: Number(p.stock_quantity) || 0,
      status: p.status || 'published',
      is_featured: !!p.is_featured,
      is_trending: !!p.is_trending,
      is_active: p.is_active !== false,
      category_id: p.category_id || '',
      image_url: (p as any).product_images?.[0]?.url || '',
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error')
      return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      sku: form.sku || null,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: Number(form.stock_quantity),
      status: form.status,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_active: form.is_active,
      category_id: form.category_id || null,
    }
    try {
      let productId = editing?.id
      if (editing) {
        await api.patch(`/api/admin/products/${editing.id}`, payload)
        toast('Product updated', 'success')
      } else {
        const created = await api.post('/api/admin/products', payload)
        productId = created?.id
        toast('Product created', 'success')
      }
      if (productId && form.image_url?.trim()) {
        try {
          await api.post(`/api/admin/products/${productId}/images`, {
            url: form.image_url.trim(),
            is_primary: true,
          })
        } catch {
          /* image optional */
        }
      }
      setModalOpen(false)
      load()
    } catch (e: any) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/api/admin/products/${id}`)
      toast('Product deleted', 'success')
      load()
    } catch (e: any) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  const toggleStatus = async (p: ProductRow) => {
    const next = p.status === 'published' ? 'draft' : 'published'
    try {
      await api.patch(`/api/admin/products/${p.id}`, { status: next })
      toast(`Marked as ${next}`, 'success')
      load()
    } catch (e: any) {
      toast(e?.message || 'Update failed', 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="text-sm opacity-50 mt-1">{total} products</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs inline-flex items-center gap-2">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse" style={{ backgroundColor: 'var(--bg2)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border p-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm opacity-60 mb-4">No products yet</p>
          <button onClick={openCreate} className="btn-primary text-xs">
            Create first product
          </button>
        </div>
      ) : (
        <div className="border overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-xs tracking-widest uppercase opacity-50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs opacity-50">{p.categories?.name || '—'}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell opacity-60">{p.sku || '—'}</td>
                  <td className="px-4 py-3">₦{Number(p.price).toLocaleString()}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{p.stock_quantity ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(p)}
                      className="text-xs tracking-wide uppercase px-2 py-1 border"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 opacity-60 hover:opacity-100" aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(p.id)} className="p-1.5 opacity-60 hover:opacity-100" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border p-6"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Name *">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: editing ? f.slug : slugify(e.target.value),
                    }))
                  }
                  className="input"
                />
              </Field>
              <Field label="Slug">
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (NGN) *">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="input"
                  />
                </Field>
                <Field label="Original price">
                  <input
                    type="number"
                    min={0}
                    value={form.original_price || ''}
                    onChange={(e) => setForm((f) => ({ ...f, original_price: Number(e.target.value) }))}
                    className="input"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    value={form.stock_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, stock_quantity: Number(e.target.value) }))}
                    className="input"
                  />
                </Field>
                <Field label="SKU">
                  <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="input" />
                </Field>
              </div>
              <Field label="Category">
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="input"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Image URL">
                <input
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="input"
                  placeholder="https://... or Supabase storage URL"
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input resize-none"
                />
              </Field>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_trending}
                    onChange={(e) => setForm((f) => ({ ...f, is_trending: e.target.checked }))}
                  />
                  Trending
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={save} disabled={saving} className="btn-primary flex-1 text-xs inline-flex items-center justify-center gap-2">
                <Check size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setModalOpen(false)} className="btn-outline text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          outline: none;
        }
        .input:focus { border-color: var(--text); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}