import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'
import type { CartItem, Product, ProductVariant } from '../types'
import { useToast } from './ToastContext'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const SESSION_KEY = 'neon-session-id'

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const loadCart = useCallback(async () => {
    try {
      const data = await api.get('/api/cart', {
        headers: { 'X-Session-Id': getSessionId() },
      })
      if (data?.cart_items) {
        setItems(data.cart_items)
      } else if (Array.isArray(data?.items)) {
        setItems(data.items)
      }
    } catch {
      // offline / not configured
    }
  }, [])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const addItem = async (product: Product, quantity = 1, variant?: ProductVariant) => {
    try {
      const res = await api.post(
        '/api/cart/items',
        {
          product_id: product.id,
          variant_id: variant?.id,
          quantity,
        },
        { headers: { 'X-Session-Id': getSessionId() } }
      )
      if (res?.session_id) {
        localStorage.setItem(SESSION_KEY, res.session_id)
      }
      // Optimistic local add
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.product_id === product.id && i.variant_id === variant?.id
        )
        if (existing) {
          return prev.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
          )
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            product_id: product.id,
            variant_id: variant?.id,
            quantity,
            unit_price: product.price + (variant?.price_adjustment || 0),
            product,
            variant,
          },
        ]
      })
      toast('Added to cart', 'success')
      setIsOpen(true)
    } catch (e: any) {
      toast(e?.message || 'Could not add to cart', 'error')
    }
  }

  const removeItem = async (id: string) => {
    try {
      await api.delete(`/api/cart/items/${id}`)
    } catch {}
    setItems((prev) => prev.filter((i) => i.id !== id))
    toast('Removed from cart', 'info')
  }

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id)
    try {
      await api.patch(`/api/cart/items/${id}`, { quantity })
    } catch {}
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const clear = () => setItems([])

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        removeItem,
        updateQuantity,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}