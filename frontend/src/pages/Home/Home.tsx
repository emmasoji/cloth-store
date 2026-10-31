import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, Award, RefreshCw, Headphones } from 'lucide-react'
import { api } from '../../services/api'
import ProductCard from '../../components/products/ProductCard'
import type { Product, Category } from '../../types'

const iconMap: Record<string, any> = {
  Truck,
  Award,
  RefreshCw,
  Headphones,
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [hero, setHero] = useState({
    heading: 'NEW ARRIVALS',
    subheading: 'THRIFTED.\nCURATED.',
    description: 'Premium thrifted pieces. Handpicked for quality. Priced for you.',
    cta_text: 'SHOP NOW',
    cta_link: '/shop',
  })

  useEffect(() => {
    api.get('/api/products?trending=true&limit=8').then((d) => setProducts(d?.items || [])).catch(() => {})
    api.get('/api/categories').then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
    api.get('/api/settings/homepage').then((sections) => {
      const h = (sections || []).find((s: any) => s.section_key === 'hero')
      if (h?.content) setHero((prev) => ({ ...prev, ...h.content }))
    }).catch(() => {})
  }, [])

  const benefits = [
    { icon: 'Truck', title: 'Free Shipping', desc: 'On orders above threshold' },
    { icon: 'Award', title: 'Premium Quality', desc: 'Handpicked pieces' },
    { icon: 'RefreshCw', title: 'Easy Returns', desc: '14-day return policy' },
    { icon: 'Headphones', title: '24/7 Support', desc: 'Always here for you' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] lg:min-h-[85vh] flex items-center">
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--bg2)' }}>
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <span className="font-display text-6xl lg:text-9xl tracking-tight">NEON</span>
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-xl"
          >
            <p className="text-xs tracking-[0.3em] uppercase mb-4 opacity-60">{hero.heading}</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] whitespace-pre-line mb-6">
              {hero.subheading}
            </h1>
            <p className="text-sm sm:text-base opacity-70 max-w-md mb-8 leading-relaxed">
              {hero.description}
            </p>
            <Link to={hero.cta_link || '/shop'} className="btn-primary">
              {hero.cta_text}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b) => {
            const Icon = iconMap[b.icon] || Truck
            return (
              <div key={b.title} className="flex flex-col items-center text-center gap-2">
                <Icon size={22} strokeWidth={1.5} />
                <h3 className="text-xs tracking-widest uppercase font-medium">{b.title}</h3>
                <p className="text-xs opacity-50">{b.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl">Shop by Category</h2>
          <Link to="/shop" className="text-xs tracking-widest uppercase opacity-60 hover:opacity-100">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(categories.length ? categories : [
            { id: '1', name: 'Hoodies', slug: 'hoodies' },
            { id: '2', name: 'T-Shirts', slug: 't-shirts' },
            { id: '3', name: 'Pants', slug: 'pants' },
            { id: '4', name: 'Jackets', slug: 'jackets' },
            { id: '5', name: 'Accessories', slug: 'accessories' },
          ]).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop/${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden"
              style={{ backgroundColor: 'var(--bg2)' }}
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs tracking-widest uppercase opacity-40">{cat.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-white text-sm tracking-widest uppercase font-medium">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl">Trending Now</h2>
          <Link to="/shop" className="text-xs tracking-widest uppercase opacity-60 hover:opacity-100">
            Shop All
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4]" style={{ backgroundColor: 'var(--bg2)' }}>
                <div className="w-full h-full flex items-center justify-center text-xs opacity-30 tracking-widest uppercase">
                  Product
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promo banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'NEW DROPS', sub: 'Every Week' },
            { title: 'PREMIUM THRIFT', sub: 'Handpicked Pieces' },
            { title: 'UP TO 50% OFF', sub: 'Limited Time Only' },
          ].map((b) => (
            <div
              key={b.title}
              className="relative aspect-[16/10] md:aspect-square flex flex-col items-center justify-center text-center p-6"
              style={{ backgroundColor: 'var(--bg2)' }}
            >
              <p className="text-xs tracking-[0.25em] uppercase opacity-50 mb-2">{b.sub}</p>
              <h3 className="font-display text-2xl lg:text-3xl">{b.title}</h3>
              <Link to="/shop" className="mt-4 text-xs tracking-widest uppercase underline underline-offset-4 opacity-70 hover:opacity-100">
                Shop Now
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}