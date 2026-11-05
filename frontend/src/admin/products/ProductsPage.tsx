import { useEffect, useState, useRef } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const IMAGE_SLOTS = 4

interface ProductOption {
  id?: string
  colour: string
  size: string
  weight: string
  stock_quantity: string
}

interface ProductImage {
  id?: string
  url: string
  is_primary?: boolean
  localPreview?: boolean
  file?: File
}

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
  product_images?: ProductImage[]
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
}

function titleCase(s: string) {
  return s
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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
  const [view, setView] = useState<'list' | 'form'>('list')
  const [items, setItems] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState<ProductImage[]>([])
  const [options, setOptions] = useState<ProductOption[]>([
    { colour: '', size: '', weight: '', stock_quantity: '' },
  ])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [catOpen, setCatOpen] = useState(false)
  const slotInputRefs = useRef<(HTMLInputElement | null)[]>([])
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

  useEffect(() => {
    if (images.length <= 1) {
      setCarouselIndex(0)
      return
    }
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(t)
  }, [images.length])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setImages([])
    setOptions([{ colour: '', size: '', weight: '', stock_quantity: '' }])
    setCarouselIndex(0)
    setView('form')
  }

  const openEdit = async (p: ProductRow) => {
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
    })
    setImages(p.product_images || [])
    setOptions([{ colour: '', size: '', weight: '', stock_quantity: '' }])
    setCarouselIndex(0)
    setView('form')

    // Always reload full product so variants/images are present
    try {
      const full = await api.get(`/api/admin/products/${p.id}`)
      if (!full) return
      setEditing(full)
      setForm({
        name: full.name || '',
        slug: full.slug || '',
        sku: full.sku || '',
        description: full.description || '',
        price: Number(full.price) || 0,
        original_price: Number(full.original_price) || 0,
        stock_quantity: Number(full.stock_quantity) || 0,
        status: full.status || 'published',
        is_featured: !!full.is_featured,
        is_trending: !!full.is_trending,
        is_active: full.is_active !== false,
        category_id: full.category_id || '',
      })
      setImages(full.product_images || [])
      const vars = full.product_variants || []
      if (vars.length) {
        setOptions(
          vars.map((v: any) => ({
            id: v.id,
            colour: v.colour || '',
            size: v.size || '',
            weight: v.weight != null ? String(v.weight) : '',
            stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '',
          }))
        )
      } else {
        // fallback: show total stock as one blank option stock if product has stock only
        const ts = Number(full.stock_quantity) || 0
        setOptions([
          {
            colour: '',
            size: '',
            weight: '',
            stock_quantity: ts ? String(ts) : '',
          },
        ])
      }
    } catch (e: any) {
      toast(e?.message || 'Could not load product options', 'error')
    }
  }

  const goBack = () => {
    setView('list')
    setEditing(null)
    setImages([])
    setOptions([{ colour: '', size: '', weight: '', stock_quantity: '' }])
    setForm(emptyForm)
  }

  const addLocalFile = (file: File, slotIndex?: number) => {
    if (!file.type.startsWith('image/')) {
      toast('Only images allowed', 'error')
      return
    }
    const url = URL.createObjectURL(file)
    const entry: ProductImage = { url, file, localPreview: true, is_primary: images.length === 0 }
    setImages((prev) => {
      if (typeof slotIndex === 'number' && slotIndex < prev.length) {
        const next = [...prev]
        next[slotIndex] = entry
        return next
      }
      return [...prev, entry]
    })
  }

  const uploadFileToProduct = async (file: File, productId: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'products')
    fd.append('product_id', productId)
    const res = await fetch(`${API_BASE}/api/media/upload`, { method: 'POST', body: fd })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(typeof err.detail === 'string' ? err.detail : 'Upload failed')
    }
    const data = await res.json()
    const row = await api.post(`/api/admin/products/${productId}/images`, {
      url: data.url,
      is_primary: false,
    })
    return { url: data.url as string, id: row?.id as string | undefined }
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast('Product name is required', 'error')
      return
    }
    if (images.length < 1) {
      toast('Add at least one image', 'error')
      return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      name: titleCase(form.name),
      slug: form.slug.trim() || slugify(form.name),
      sku: form.sku || null,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_quantity: options.reduce((sum, o) => sum + (Number(o.stock_quantity) || 0), 0),
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
      } else {
        const created = await api.post('/api/admin/products', payload)
        productId = created?.id
        setEditing(created)
      }

      const pending = images.filter((img) => img.file)
      if (productId && pending.length) {
        setUploading(true)
        const uploaded: ProductImage[] = images.filter((img) => !img.file)
        for (let i = 0; i < pending.length; i++) {
          const up = await uploadFileToProduct(pending[i].file!, productId)
          uploaded.push({ url: up.url, id: up.id, is_primary: uploaded.length === 0 })
        }
        setImages(uploaded)
        setUploading(false)
      }

      // Sync product options (colour / size / weight rows)
      if (productId) {
        const items = options
          .filter((o) => o.colour.trim() || o.size.trim() || o.weight.trim())
          .map((o) => ({
            colour: o.colour.trim() || null,
            size: o.size.trim() || null,
            weight: o.weight.trim() || null,
            stock_quantity: o.stock_quantity.trim() ? Number(o.stock_quantity) : 0,
          }))
        try {
          await api.put(`/api/admin/products/${productId}/variants`, { items })
        } catch (ve: any) {
          toast(ve?.message || 'Product saved, but options failed to save', 'error')
        }
      }

      toast(editing ? 'Product updated' : 'Product created', 'success')
      load()
      setView('list')
    } catch (e: any) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/admin/products/${id}`)
      toast('Product deleted', 'success')
      setConfirmDeleteId(null)
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

  const removeImageAt = async (index: number) => {
    const img = images[index]
    if (!img) return
    // Persist delete when image already exists in DB
    if (img.id) {
      try {
        await api.delete(`/api/admin/product-images/${img.id}`)
        toast('Image removed', 'success')
      } catch (e: any) {
        toast(e?.message || 'Could not delete image', 'error')
        return
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== index))
    setCarouselIndex((i) => Math.max(0, Math.min(i, images.length - 2)))
  }

  if (view === 'list') {
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
              <div key={i} className="h-14 animate-pulse rounded-xl" style={{ backgroundColor: 'var(--bg2)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="surface p-12 text-center">
            <p className="text-sm opacity-60 mb-4">No products yet</p>
            <button onClick={openCreate} className="btn-primary text-xs">
              Create first product
            </button>
          </div>
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-xs tracking-widest uppercase opacity-50" style={{ borderColor: 'var(--border)' }}>
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
                  <tr key={p.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center opacity-40"
                          style={{ backgroundColor: 'var(--bg)' }}
                        >
                          {p.product_images?.[0]?.url ? (
                            <img src={p.product_images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={14} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{p.name}</div>
                          <div className="text-xs opacity-50">{p.categories?.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell opacity-60">{p.sku || '—'}</td>
                    <td className="px-4 py-3">₦{Number(p.price).toLocaleString()}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{p.stock_quantity ?? 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(p)}
                        className="text-xs tracking-wide uppercase px-2.5 py-1 border rounded-lg"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg opacity-60 hover:opacity-100">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setConfirmDeleteId(p.id)} className="p-1.5 rounded-lg opacity-60 hover:opacity-100">
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

        <ConfirmDialog
          open={!!confirmDeleteId}
          title="Delete product"
          message="This product and its images will be removed. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => confirmDeleteId && remove(confirmDeleteId)}
        />
      </div>
    )
  }

  const slotCount = Math.max(IMAGE_SLOTS, images.length + 1)

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={goBack}
          className="p-2 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Back to products"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-display text-2xl">{editing ? 'Edit Product' : 'Create Product'}</h1>
        </div>
      </div>

      <section className="mb-8">
        <p className="text-xs tracking-widest uppercase opacity-50 mb-3">Images</p>

        {images.length > 1 && (
          <div className="relative mb-4 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <div className="aspect-[16/9] sm:aspect-[21/9]" style={{ backgroundColor: 'var(--bg2)' }}>
              <img src={images[carouselIndex]?.url} alt="" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              onClick={() => setCarouselIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              onClick={() => setCarouselIndex((i) => (i + 1) % images.length)}
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCarouselIndex(i)}
                  className="w-2 h-2 rounded-full transition-opacity"
                  style={{
                    backgroundColor: 'var(--text)',
                    opacity: i === carouselIndex ? 1 : 0.3,
                  }}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: slotCount }).map((_, index) => {
            const img = images[index]
            return (
              <div key={index} className="relative aspect-square">
                <button
                  type="button"
                  onClick={() => slotInputRefs.current[index]?.click()}
                  className="w-full h-full rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--bg2)',
                    borderStyle: img ? 'solid' : 'dashed',
                  }}
                >
                  {img ? (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Plus size={22} className="opacity-40" />
                      <span className="text-[10px] tracking-widest uppercase opacity-40">Add</span>
                    </>
                  )}
                </button>
                {img && (
                  <button
                    type="button"
                    onClick={() => removeImageAt(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full text-xs flex items-center justify-center"
                    style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-text)' }}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                )}
                <input
                  ref={(el) => {
                    slotInputRefs.current[index] = el
                  }}
                  type="file"
                  accept="image/*,.avif,.heic,.heif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) addLocalFile(file, img ? index : undefined)
                    e.target.value = ''
                  }}
                />
              </div>
            )
          })}
        </div>
      </section>

      <div className="space-y-4 max-w-xl">
        <label className="block">
          <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Product Name *</span>
          <input
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: editing ? f.slug : slugify(e.target.value),
              }))
            }
            className="field"
          />
        </label>
        <label className="block">
          <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Price (NGN) *</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.price || ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              setForm((f) => ({ ...f, price: v === '' ? 0 : Number(v) }))
            }}
            className="field"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Total stock</span>
            <input
              type="text"
              readOnly
              disabled
              value={options.reduce((sum, o) => sum + (Number(o.stock_quantity) || 0), 0)}
              className="field opacity-70 cursor-not-allowed"
            />
          </label>
          <label className="block">
            <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">SKU</span>
            <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="field" />
          </label>
        </div>
        <div className="block relative">
          <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Category</span>
          <button
            type="button"
            onClick={() => setCatOpen((o) => !o)}
            className="field w-full text-left flex items-center justify-between"
          >
            <span className={form.category_id ? '' : 'opacity-50'}>
              {categories.find((c) => c.id === form.category_id)?.name || 'Select category'}
            </span>
            <span className="opacity-40 text-xs">▼</span>
          </button>
          {catOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
              <div
                className="absolute z-20 left-0 right-0 mt-1 border py-1 max-h-48 overflow-y-auto"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}
              >
                <button
                  type="button"
                  className="block w-full text-left px-3.5 py-2.5 text-sm opacity-60 hover:opacity-100"
                  style={{ backgroundColor: !form.category_id ? 'var(--bg2)' : 'transparent' }}
                  onClick={() => { setForm((f) => ({ ...f, category_id: '' })); setCatOpen(false) }}
                >
                  None
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block w-full text-left px-3.5 py-2.5 text-sm hover:opacity-100"
                    style={{ backgroundColor: form.category_id === c.id ? 'var(--bg2)' : 'transparent', opacity: form.category_id === c.id ? 1 : 0.7 }}
                    onClick={() => { setForm((f) => ({ ...f, category_id: c.id })); setCatOpen(false) }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>


        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs tracking-widest uppercase opacity-50">Product options</span>
            <button
              type="button"
              onClick={() =>
                setOptions((prev) => [...prev, { colour: '', size: '', weight: '', stock_quantity: '' }])
              }
              className="text-[11px] tracking-widest uppercase opacity-60 hover:opacity-100 inline-flex items-center gap-1"
            >
              <Plus size={12} /> Add row
            </button>
          </div>
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2 text-[10px] tracking-widest uppercase opacity-50 border-b"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
            >
              <span>Colour</span>
              <span>Size</span>
              <span>Weight</span>
              <span>Stock</span>
              <span />
            </div>
            {options.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2 items-center border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <input
                  className="field py-1.5 text-sm"
                  placeholder="e.g. Black"
                  value={row.colour}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((r, i) => (i === idx ? { ...r, colour: e.target.value } : r)))
                  }
                />
                <input
                  className="field py-1.5 text-sm"
                  placeholder="e.g. M"
                  value={row.size}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((r, i) => (i === idx ? { ...r, size: e.target.value } : r)))
                  }
                />
                <input
                  className="field py-1.5 text-sm"
                  placeholder="kg"
                  inputMode="decimal"
                  value={row.weight}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, weight: e.target.value.replace(/[^0-9.]/g, '') } : r
                      )
                    )
                  }
                />
                <input
                  className="field py-1.5 text-sm"
                  placeholder="0"
                  inputMode="numeric"
                  value={row.stock_quantity}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, stock_quantity: e.target.value.replace(/[^0-9]/g, '') } : r
                      )
                    )
                  }
                />
                <button
                  type="button"
                  className="p-1.5 opacity-50 hover:opacity-100"
                  aria-label="Remove row"
                  onClick={() =>
                    setOptions((prev) =>
                      prev.length <= 1
                        ? [{ colour: '', size: '', weight: '', stock_quantity: '' }]
                        : prev.filter((_, i) => i !== idx)
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs tracking-widest uppercase opacity-50 mb-1.5 block">Description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="field resize-none"
          />
        </label>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
            Featured
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm((f) => ({ ...f, is_trending: e.target.checked }))} />
            Trending
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={save} disabled={saving || uploading || images.length < 1} className="btn-primary text-xs inline-flex items-center gap-2">
            <Check size={14} /> {saving || uploading ? 'Saving…' : 'Save product'}
          </button>
          <button type="button" onClick={goBack} className="btn-outline text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
