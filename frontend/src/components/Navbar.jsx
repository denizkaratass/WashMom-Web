import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

const LINKS = [
  { to: '/', label: 'Ana Sayfa', end: true },
  { to: '/analyze', label: 'Analiz Et' },
  { to: '/wardrobe', label: 'Gardırobum' },
  { to: '/compare', label: 'Bununla Yıkanır mı?' },
  { to: '/dashboard', label: 'Dashboard' },
]

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-bold transition ${
    isActive ? 'bg-leaf-light text-leaf-dark' : 'text-ink-soft hover:bg-cream-dark hover:text-ink'
  }`

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  async function handleSignOut() {
    close()
    await signOut().catch(() => {})
    navigate('/')
  }

  const initial = user?.email?.[0]?.toLocaleUpperCase('tr-TR')

  const authArea = user ? (
    <div className="flex items-center gap-2">
      <span
        className="grid size-9 place-items-center rounded-full bg-coral text-sm font-extrabold text-white"
        title={user.email}
        aria-label={`Giriş yapan: ${user.email}`}
      >
        {initial}
      </span>
      <button type="button" onClick={handleSignOut} className="btn btn-ghost text-sm">
        Çıkış
      </button>
    </div>
  ) : (
    <NavLink to="/login" onClick={close} className="btn btn-primary px-4 py-2 text-sm">
      Giriş Yap
    </NavLink>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-sand bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Ana menü">
        <Logo onClick={close} />

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">{authArea}</div>

        <button
          type="button"
          className="btn btn-ghost px-2 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-sand bg-cream px-4 pb-4 lg:hidden">
          <ul className="flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} onClick={close} className={(s) => `${linkClass(s)} block py-3 text-base`}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {authArea}
        </div>
      )}
    </header>
  )
}
