import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'

export default function AnnouncementBar() {
  const [text, setText] = useState('FREE SHIPPING ON ALL ORDERS ABOVE ₦50,000')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    api.get('/api/settings/public').then((data) => {
      const bar = data?.announcement_bar
      if (bar) {
        setEnabled(bar.enabled !== false)
        if (bar.text) setText(bar.text)
      }
    }).catch(() => {})
  }, [])

  if (!enabled) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="text-center text-xs tracking-widest uppercase py-2.5 px-4"
        style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-text)' }}
      >
        {text}
      </motion.div>
    </AnimatePresence>
  )
}