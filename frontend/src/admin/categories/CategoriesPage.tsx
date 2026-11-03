import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  is_active?: boolean
  sort_order?: number
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api
      .get('/api/admin/categories')
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e) => toast(e.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', image_url: '', is_active: true, sort_order: 0 })
    setOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image_url: c.image_url || '',
      is_active: c.is_active !== false,
      sort_order: c.sort_order || 0,
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast('Name required', 'error')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    }
    try {
      if (editing) {
        await api.patch(`/api/admin/categories/${editing.id}`, payload)
        toast('Category updated', 'success')
      } else {
        await api.post('/api/admin/categories', payload)
        toast('Category created', 'success')
      }
      setOpen(false)
      load()
    } catch (e: any) {
      toast(e?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return
    try {
      await api.delete(`/api/admin/categories/${id}`)
      toast('Deleted', 'success')
      load()
    } catch (e: any) {
      toast(e?.message || 'Delete failed', 'error')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Categories</h1>
        <button onClick={openCreate} className="btn-primary text-xs inline-flex items-center gap-2">
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse" style={{ backgroundColor: 'var(--bg2)' }} />
      ) : (
        <div className="border overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-xs uppercase tracking-widest opacity-50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 opacity-60">{c.slug}</td>
                  <td className="px-4 py-3">{c.is_active !== false ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 opacity-60 hover:opacity-100">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(c.id)} className="p-1.5 opacity-60 hover:opacity-100">
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md border p-6" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between mb-4">
              <h2 className="font-display text-xl">{editing ? 'Edit' : 'New'} category</h2>
              <button onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border bg-transparent"
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 text-sm border bg-transparent"
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                className="w-full px-3 py-2 text-sm border bg-transparent"
                style={{ borderColor: 'var(--border)' }}
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm border bg-transparent"
                style={{ borderColor: 'var(--border)' }}
                rows={2}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Active
              </label>
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full mt-6 text-xs inline-flex justify-center items-center gap-2">
              <Check size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
