export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  original_price?: number
  currency?: string
  stock_quantity?: number
  is_featured?: boolean
  is_trending?: boolean
  status?: string
  product_images?: ProductImage[]
  product_variants?: ProductVariant[]
  categories?: { name: string; slug: string }
}

export interface ProductImage {
  id: string
  url: string
  alt_text?: string
  is_primary?: boolean
  sort_order?: number
}

export interface ProductVariant {
  id: string
  size?: string
  colour?: string
  colour_hex?: string
  stock_quantity: number
  price_adjustment?: number
  weight?: number
  image_id?: string
  sku?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  is_active?: boolean
}

export interface CartItem {
  id: string
  product_id: string
  variant_id?: string
  quantity: number
  unit_price: number
  product?: Product
  variant?: ProductVariant
}

export interface Cart {
  id?: string
  items: CartItem[]
  subtotal: number
  currency: string
  session_id?: string
}