import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react'
import ProductQuickView from '../../components/modals/ProductQuickView'
import { api } from '../../services/api'
import ProductCard from '../../components/products/ProductCard'
import type { Product, Category } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'featured', label: 'Featured' },
]

export default function Shop() {
  const { category: categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [quickView, setQuickView] = useState<Product | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [priceMin, setPriceMin] = useState(searchParams.get('min') || '')
  const [priceMax, setPriceMax] = useState(searchParams.get('max') || '')

  const sort = searchParams.get('sort') || 'newest'
  const search = searchParams.get('q') || ''
  const sizeFilter = searchParams.get('size') || ''
  const minP = searchParams.get('min') || ''
  const maxP = searchParams.get('max') || ''

  useEffect(() => {
    api.get('/api/categories').then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (sort) params.set('sort', sort)
    if (search) params.set('search', search)
    if (sizeFilter) params.set('size', sizeFilter)
    if (minP) params.set('min_price', minP)
    if (maxP) params.set('max_price', maxP)
    params.set('limit', '24')
    api
      .get(`/api/products?${params}`)
      .then((d) => {
        setProducts(d?.items || [])
        setTotal(d?.total || 0)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categorySlug, sort, search, sizeFilter, minP, maxP])

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    setSearchParams(p)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    setPriceMin('')
    setPriceMax('')
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = []
    if (categorySlug) {
      const name = categories.find((c) => c.slug === categorySlug)?.name || categorySlug
      chips.push({
        key: 'cat',
        label: name,
        clear: () => {
          window.location.href = '/shop'
        },
      })
    }
    if (sizeFilter) {
      chips.push({ key: 'size', label: `Size ${sizeFilter}`, clear: () => setParam('size', '') })
    }
    if (minP || maxP) {
      chips.push({
        key: 'price',
        label: `₦${minP || '0'} – ₦${maxP || '∞'}`,
        clear: () => {
          const p = new URLSearchParams(searchParams)
          p.delete('min')
          p.delete('max')
          setSearchParams(p)
          setPriceMin('')
          setPriceMax('')
        },
      })
    }
    return chips
  }, [categorySlug, sizeFilter, minP, maxP, categories, searchParams])

  const applyPrice = () => {
    const p = new URLSearchParams(searchParams)
    if (priceMin) p.set('min', priceMin)
    else p.delete('min')
    if (priceMax) p.set('max', priceMax)
    else p.delete('max')
    setSearchParams(p)
  }

  const title = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name || categorySlug.replace(/-/g, ' ')
    : 'All Products'

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Newest'

  const FilterPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? 'space-y-8' : 'space-y-8'}>
      <div>
        <h3 className="text-sm font-medium mb-4">Filter Options</h3>
      </div>

      {/* Category */}
      <div>
        <h4 className="text-[11px] tracking-[0.15em] uppercase opacity-50 mb-3">Category</h4>
        <ul className="space-y-2.5">
          <li>
            <Link
              to="/shop"
              onClick={() => mobile && setFilterOpen(false)}
              className={`text-sm transition-opacity ${!categorySlug ? 'font-medium opacity-100' : 'opacity-55 hover:opacity-100'}`}
            >
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to={`/shop/${c.slug}`}
                onClick={() => mobile && setFilterOpen(false)}
                className={`text-sm transition-opacity capitalize ${
                  categorySlug === c.slug ? 'font-medium opacity-100' : 'opacity-55 hover:opacity-100'
                }`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <h4 className="text-[11px] tracking-[0.15em] uppercase opacity-50 mb-3">Price</h4>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
            className="field text-xs py-2 flex-1"
          />
          <span className="opacity-40 text-xs">–</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
            className="field text-xs py-2 flex-1"
          />
        </div>
        <button type="button" onClick={applyPrice} className="mt-2 text-[11px] tracking-widest uppercase opacity-60 hover:opacity-100">
          Apply
        </button>
      </div>

      {/* Size */}
      <div>
        <h4 className="text-[11px] tracking-[0.15em] uppercase opacity-50 mb-3">Size</h4>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setParam('size', sizeFilter === s ? '' : s)}
              className="min-w-[2.5rem] px-2.5 py-1.5 text-xs border rounded-lg transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: sizeFilter === s ? 'var(--btn)' : 'transparent',
                color: sizeFilter === s ? 'var(--btn-text)' : 'var(--text)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {activeChips.length > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-[11px] tracking-widest uppercase opacity-50 hover:opacity-100 underline underline-offset-4"
        >
          Clear all
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex gap-10 lg:gap-12 items-start">
        {/* Filter sidebar — top aligns with All Products column */}
        <aside
          className="hidden lg:block w-56 xl:w-64 flex-shrink-0 scroll-panel sticky top-[5.5rem] max-h-[calc(100vh-6rem)] overflow-y-auto border rounded-2xl p-5"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
        >
          <FilterPanel />
        </aside>

        {/* Main product column: title + grid */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl capitalize mb-2">{title}</h1>
            <nav className="text-xs opacity-50 flex items-center gap-2">
              <Link to="/" className="hover:opacity-100">
                Home
              </Link>
              <span>/</span>
              <Link to="/shop" className="hover:opacity-100">
                Shop
              </Link>
              {categorySlug && (
                <>
                  <span>/</span>
                  <span className="capitalize opacity-100">{title}</span>
                </>
              )}
            </nav>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p className="text-sm opacity-60">
              Showing <span className="opacity-100 font-medium">{products.length}</span>
              {total > products.length ? ` of ${total}` : ''} results
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="lg:hidden flex items-center gap-2 text-xs tracking-widest uppercase border px-3 py-2 rounded-lg"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => setFilterOpen(true)}
              >
                <SlidersHorizontal size={14} /> Filters
              </button>

              {/* Custom sort */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex items-center gap-2 text-xs border px-3 py-2 rounded-lg"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="opacity-50">Sort by:</span>
                  <span>{sortLabel}</span>
                  <ChevronDown size={12} className="opacity-50" />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute right-0 top-full mt-1 z-40 min-w-[180px] border py-1 shadow-lg"
                        style={{
                          backgroundColor: 'var(--bg)',
                          borderColor: 'var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {SORT_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            className="block w-full text-left px-3 py-2 text-xs hover:opacity-100"
                            style={{
                              backgroundColor: sort === o.value ? 'var(--bg2)' : 'transparent',
                              opacity: sort === o.value ? 1 : 0.65,
                            }}
                            onClick={() => {
                              setParam('sort', o.value)
                              setSortOpen(false)
                            }}
                          >
                            {o.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[11px] tracking-widest uppercase opacity-40 mr-1">Active</span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-full"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
                >
                  {chip.label}
                  <X size={12} className="opacity-50" />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="text-xs opacity-50 hover:opacity-100 ml-1">
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--bg2)' }} />
                  <div className="h-3 w-2/3 animate-pulse rounded" style={{ backgroundColor: 'var(--bg2)' }} />
                  <div className="h-3 w-1/3 animate-pulse rounded" style={{ backgroundColor: 'var(--bg2)' }} />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div
              className="text-center py-24 border rounded-2xl"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg2)' }}
            >
              <p className="text-sm opacity-60 mb-4">No products match these filters</p>
              <button type="button" onClick={clearFilters} className="btn-outline text-xs">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
          )}
        </div>
      </div>

      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}

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
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 h-full w-[min(100%,300px)] z-50 p-6 overflow-y-auto border-r lg:hidden"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-display text-lg">Filters</span>
                <button type="button" onClick={() => setFilterOpen(false)} className="p-2 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <FilterPanel mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
