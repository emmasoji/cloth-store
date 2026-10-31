import { motion } from 'framer-motion'
import { Heart, Eye } from 'lucide-react'
import { Product } from '../../types'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useCart } from '../../contexts/CartContext'

interface Props {
  product: Product
  onQuickView?: (p: Product) => void
}

export default function ProductCard({ product, onQuickView }: Props) {
  const { format } = useCurrency()
  const { addItem } = useCart()
  const img = product.product_images?.find((i) => i.is_primary) || product.product_images?.[0]
  const hasDiscount = product.original_price && product.original_price > product.price

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="relative aspect-[3/4] overflow-hidden mb-3" style={{ backgroundColor: 'var(--bg2)' }}>
        {img?.url ? (
          <img
            src={img.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs opacity-40 gap-1">
            <span className="tracking-widest uppercase">{product.categories?.name || 'NEON'}</span>
            <span>{product.name}</span>
          </div>
        )}
        {hasDiscount && (
          <span
            className="absolute top-2 left-2 text-[10px] tracking-widest uppercase px-2 py-1"
            style={{ backgroundColor: 'var(--btn)', color: 'var(--btn-text)' }}
          >
            Sale
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          <button
            onClick={() => addItem(product)}
            className="flex-1 btn-primary text-[10px] py-2"
          >
            Add to Cart
          </button>
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="p-2 border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              aria-label="Quick view"
            >
              <Eye size={14} />
            </button>
          )}
        </div>
        <button
          className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: 'var(--bg)' }}
          aria-label="Wishlist"
        >
          <Heart size={14} />
        </button>
      </div>
      <h3 className="text-sm font-medium truncate">{product.name}</h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm">{format(product.price)}</span>
        {hasDiscount && (
          <span className="text-xs opacity-50 line-through">{format(product.original_price!)}</span>
        )}
      </div>
    </motion.article>
  )
}