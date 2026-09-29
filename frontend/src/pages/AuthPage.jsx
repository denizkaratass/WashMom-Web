import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import AuthForm from '../components/AuthForm.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// /login ve /register aynı bileşeni kullanır; sadece mode farklı.
export default function AuthPage({ mode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/wardrobe'

  if (user) return <Navigate to={from} replace />

  return (
    <div className="page max-w-md">
      <div className="card">
        <h1 className="text-2xl font-extrabold">{mode === 'login' ? 'Tekrar hoş geldin 👋' : 'WashMom’a katıl'}</h1>
        <p className="mt-1 mb-6 text-ink-soft">
          {mode === 'login' ? 'Gardırobuna ulaşmak için giriş yap.' : 'Kıyafetlerini kaydetmek için bir hesap oluştur.'}
        </p>
        <AuthForm
          mode={mode}
          onModeChange={(m) => navigate(m === 'login' ? '/login' : '/register', { state: location.state, replace: true })}
          onSuccess={() => navigate(from, { replace: true })}
        />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Hesap olmadan da <Link to="/analyze" className="font-bold text-leaf hover:underline">kıyafet analiz edebilirsin</Link>.
      </p>
    </div>
  )
}
