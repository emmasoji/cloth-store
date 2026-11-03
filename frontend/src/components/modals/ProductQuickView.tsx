import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Heart } from 'lucide-react'
import type { Product, ProductVariant } from '../../types'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useCart } from '../../contexts/CartContext'
import { api } from '../../services/api'

interface Props {
  product: Product | null
  onClose: () => void
}

export default function ProductQuickView({ product: initial, onClose }: Props) {
  const [product, setProduct] = useState<Product | null>(initial)
  const [imgIndex, setImgIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState<string | null>(null)
  const [colour, setColour] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { format } = useCurrency()
  const { addItem } = useCart()

  useEffect(() => {
    setProduct(initial)
    setImgIndex(0)
    setQty(1)
    setSize(null)
    setColour(null)
    if (!initial?.slug && !initial?.id) return
    setLoading(true)
    const path = initial.slug
      ? `/api/products/${initial.slug}`
      : `/api/products/id/${initial.id}`
    api
      .get(path)
      .then((d) => {
        if (d) setProduct(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initial?.id, initial?.slug])

  const p = product || initial
  const images =
    p?.product_images && p.product_images.length > 0
      ? p.product_images
      : [{ url: '', id: 'placeholder' }]

  useEffect(() => {
    if (!initial || images.length <= 1) return
    const t = setInterval(() => {
      setImgIndex((i) => (i + 1) % images.length)
    }, 3500)
    return () => clearInterval(t)
  }, [initial, images.length])

  useEffect(() => {
    if (!initial) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [initial, onClose])

  if (!initial || !p) return null

  const variants = p.product_variants || []
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[]
  const sizeOptions = sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL']
  const colours = [...new Set(variants.map((v) => v.colour).filter(Boolean))] as string[]

  const selectedVariant: ProductVariant | undefined = variants.find((v) => {
    if (size && v.size !== size) return false
    if (colour && v.colour !== colour) return false
    return true
  })

  const stock = selectedVariant?.stock_quantity ?? p.stock_quantity ?? 0
  const hasDiscount = p.original_price && p.original_price > p.price
  const discountPct = hasDiscount
    ? Math.round((1 - p.price / p.original_price!) * 100)
    : 0

  const handleAdd = async () => {
    await addItem(p, qty, selectedVariant)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full sm:max-w-5xl max-h-[96vh] overflow-y-auto border flex flex-col lg:flex-row"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 rounded-full border"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="lg:w-[55%] shrink-0 p-4 sm:p-5 flex flex-col gap-3">
            <div
              className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl"
              style={{ backgroundColor: 'var(--bg2)' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={imgIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  {images[imgIndex]?.url ? (
                    <img
                      src={images[imgIndex].url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm opacity-40 capitalize">
                      {p.name}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scroll-panel">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    type="button"
                    onClick={() => setImgIndex(i)}
                    className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200"
                    style={{
                      borderColor: i === imgIndex ? 'var(--accent)' : 'transparent',
                      opacity: i === imgIndex ? 1 : 0.55,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.opacity = '1'
                      ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.opacity = i === imgIndex ? '1' : '0.55'
                      el.style.transform = 'scale(1)'
                    }}
                  >
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: 'var(--bg2)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:w-[45%] p-5 sm:p-8 flex flex-col">
            {loading && <p className="text-xs opacity-40 mb-2">Loading…</p>}

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {p.is_trending && (
                <span
                  className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: 'var(--bg2)' }}
                >
                  New
                </span>
              )}
              {hasDiscount && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                >
                  −{discountPct}%
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl capitalize mb-3 leading-tight">
              {p.name}
            </h2>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-xl font-medium">{format(p.price)}</span>
              {hasDiscount && (
                <span className="text-sm opacity-45 line-through">{format(p.original_price!)}</span>
              )}
            </div>

            <div className="mb-5">
              <p className="text-[11px] tracking-widest uppercase opacity-50 mb-2.5">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className="min-w-[2.75rem] px-3 py-2 text-xs border rounded-lg transition-colors"
                    style={{
                      borderColor: size === s ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: size === s ? 'var(--accent)' : 'transparent',
                      color: size === s ? '#fff' : 'var(--text)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {colours.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] tracking-widest uppercase opacity-50 mb-2.5">Colour</p>
                <div className="flex flex-wrap gap-2">
                  {colours.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColour(c)}
                      className="px-3 py-2 text-xs border rounded-lg capitalize"
                      style={{
                        borderColor: colour === c ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: colour === c ? 'var(--accent)' : 'transparent',
                        color: colour === c ? '#fff' : 'var(--text)',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-[11px] tracking-widest uppercase opacity-50 mb-2.5">Quantity</p>
              <div
                className="inline-flex items-center border rounded-lg"
                style={{ borderColor: 'var(--border)' }}
              >
                <button type="button" className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm tabular-nums">{String(qty).padStart(2, '0')}</span>
                <button
                  type="button"
                  className="p-2.5"
                  onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-xs opacity-45 mt-2">
                {stock > 0 ? `${stock} available` : 'Out of stock'}
              </p>
            </div>

            {p.description && (
              <div className="mb-6">
                <p className="text-[11px] tracking-widest uppercase opacity-50 mb-2">Description</p>
                <p className="text-sm opacity-75 leading-relaxed whitespace-pre-line">{p.description}</p>
              </div>
            )}

            {p.categories?.name && (
              <p className="text-xs opacity-45 mb-6 capitalize">
                Category · {p.categories.name}
              </p>
            )}

            <div className="mt-auto pt-4 flex gap-3">
              <button
                type="button"
                className="btn-primary flex-1 text-xs rounded-full py-3.5"
                disabled={stock <= 0}
                onClick={handleAdd}
              >
                Add to bag
              </button>
              <button
                type="button"
                className="p-3.5 border rounded-full"
                style={{ borderColor: 'var(--border)' }}
                aria-label="Wishlist"
              >
                <Heart size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
