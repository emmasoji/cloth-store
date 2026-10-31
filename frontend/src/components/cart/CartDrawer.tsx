import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCart()
  const { format } = useCurrency()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[70]"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-[80] flex flex-col border-l"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm tracking-widest uppercase">Shopping Bag ({items.length})</h2>
              <button onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <p className="text-sm opacity-60 text-center py-12">Your bag is empty</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div
                      className="w-20 h-24 flex-shrink-0 flex items-center justify-center text-xs opacity-40"
                      style={{ backgroundColor: 'var(--bg2)' }}
                    >
                      {item.product?.product_images?.[0]?.url ? (
                        <img
                          src={item.product.product_images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        'IMG'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name || 'Product'}</p>
                      <p className="text-xs opacity-60 mt-0.5">
                        {item.variant?.size} {item.variant?.colour}
                      </p>
                      <p className="text-sm mt-1">{format(item.unit_price)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Plus size={12} />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="ml-auto opacity-50 hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Subtotal</span>
                  <span className="font-medium">{format(subtotal)}</span>
                </div>
                <button className="btn-primary w-full" onClick={closeCart}>
                  Checkout
                </button>
                <Link to="/shop" onClick={closeCart} className="block text-center text-xs tracking-widest uppercase opacity-60 hover:opacity-100">
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}