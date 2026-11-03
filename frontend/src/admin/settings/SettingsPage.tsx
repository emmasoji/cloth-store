import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

export default function SettingsPage() {
  const [announcement, setAnnouncement] = useState({ enabled: true, text: '', link: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    api
      .get('/api/settings/public')
      .then((d) => {
        if (d?.announcement_bar) {
          setAnnouncement({
            enabled: d.announcement_bar.enabled !== false,
            text: d.announcement_bar.text || '',
            link: d.announcement_bar.link || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/api/admin/settings/announcement_bar', {
        enabled: announcement.enabled,
        text: announcement.text,
        link: announcement.link,
      })
      toast('Settings saved', 'success')
    } catch (e: any) {
      toast(e?.message || 'Save failed — ensure backend supports admin settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-32 animate-pulse" style={{ backgroundColor: 'var(--bg2)' }} />
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-6">Settings</h1>

      <section className="border p-5 mb-6" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-xs tracking-widest uppercase opacity-50 mb-4">Announcement bar</h2>
        <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={announcement.enabled}
            onChange={(e) => setAnnouncement((a) => ({ ...a, enabled: e.target.checked }))}
          />
          Enabled
        </label>
        <label className="block mb-4">
          <span className="text-xs opacity-50 mb-1 block">Text</span>
          <input
            value={announcement.text}
            onChange={(e) => setAnnouncement((a) => ({ ...a, text: e.target.value }))}
            className="w-full px-3 py-2 text-sm border bg-transparent outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </label>
        <label className="block mb-4">
          <span className="text-xs opacity-50 mb-1 block">Link (optional)</span>
          <input
            value={announcement.link}
            onChange={(e) => setAnnouncement((a) => ({ ...a, link: e.target.value }))}
            className="w-full px-3 py-2 text-sm border bg-transparent outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="/shop"
          />
        </label>
        <button onClick={save} disabled={saving} className="btn-primary text-xs">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </section>

      <p className="text-xs opacity-50">
        Homepage content, pages, and currency rates can be edited in Supabase Table Editor or extended here later.
      </p>
    </div>
  )
}