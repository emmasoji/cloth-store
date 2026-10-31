import { ReactNode } from 'react'
import AnnouncementBar from '../navigation/AnnouncementBar'
import Navbar from '../navigation/Navbar'
import Footer from '../navigation/Footer'
import CartDrawer from '../cart/CartDrawer'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  )
}