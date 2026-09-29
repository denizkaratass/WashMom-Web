import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from './Spinner.jsx'

// Giriş gerektiren sayfaları sarar. Giriş yoksa /login'e gönderir, sonra buraya geri döner.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Oturum kontrol ediliyor..." />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
