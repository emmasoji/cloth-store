import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm border p-6 shadow-xl"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-display text-xl mb-2" style={{ color: 'var(--accent)' }}>
              {title}
            </h3>
            <p className="text-sm opacity-70 leading-relaxed mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onCancel} className="btn-outline text-xs px-4 py-2.5">
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="text-xs px-4 py-2.5 rounded-lg font-medium uppercase tracking-wide transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: danger ? 'var(--accent)' : 'var(--btn)',
                  color: '#fff',
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
