import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Filter, X } from 'lucide-react'
import { api } from '../../services/api'
import ProductCard from '../../components/products/ProductCard'
import type { Product, Category } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'

export default function Shop() {
  const { category: categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const sort = searchParams.get('sort') || 'newest'
  const search = searchParams.get('q') || ''

  useEffect(() => {
    api.get('/api/categories').then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (sort) params.set('sort', sort)
    if (search) params.set('search', search)
    params.set('limit', '24')
    api
      .get(`/api/products?${params}`)
      .then((d) => {
        setProducts(d?.items || [])
        setTotal(d?.total || 0)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categorySlug, sort, search])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl">
            {categorySlug ? categorySlug.replace(/-/g, ' ') : 'Shop'}
          </h1>
          <p className="text-sm opacity-50 mt-1">{total} products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden flex items-center gap-2 text-xs tracking-widest uppercase border px-3 py-2"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => setFilterOpen(true)}
          >
            <Filter size={14} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => {
              const p = new URLSearchParams(searchParams)
              p.set('sort', e.target.value)
              setSearchParams(p)
            }}
            className="text-xs bg-transparent border px-3 py-2 outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="featured">Featured</option>
          </select>
        </div>
      </div>

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-8">
          <div>
            <h3 className="text-xs tracking-widest uppercase mb-3 opacity-50">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/shop" className={!categorySlug ? 'font-medium' : 'opacity-60 hover:opacity-100'}>
                  All
                </a>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/shop/${c.slug}`}
                    className={categorySlug === c.slug ? 'font-medium' : 'opacity-60 hover:opacity-100'}
                  >
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] animate-pulse" style={{ backgroundColor: 'var(--bg2)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 opacity-50 text-sm">No products found. Configure Supabase and add products via admin.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 h-full w-72 z-50 p-6 border-r lg:hidden"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs tracking-widest uppercase">Filters</span>
                <button onClick={() => setFilterOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <h3 className="text-xs tracking-widest uppercase mb-3 opacity-50">Categories</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="/shop" onClick={() => setFilterOpen(false)}>All</a>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <a href={`/shop/${c.slug}`} onClick={() => setFilterOpen(false)}>
                      {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}