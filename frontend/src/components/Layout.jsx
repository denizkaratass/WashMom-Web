import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()

  // Sayfa değişince en üste kaydır
  // Süslü parantez önemli: yeni tarayıcılarda scrollTo bir Promise döndürür; effect'ten
  // fonksiyon dışında bir şey dönerse React onu "temizlik fonksiyonu" sanıp çöker.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
