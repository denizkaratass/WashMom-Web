import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from '../services/supabase.js'

/**
 * Giriş / kayıt formu. Hem /login, /register sayfalarında hem de AuthModal içinde kullanılır.
 * mode: 'login' | 'register'
 */
export default function AuthForm({ mode, onModeChange, onSuccess }) {
  const { signIn, signUp, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isLogin = mode === 'login'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (isLogin) {
        await signIn(email, password)
        onSuccess?.()
      } else {
        const data = await signUp(email, password)
        if (data.session) onSuccess?.()
        else setInfo('Hesabın oluşturuldu! E-postana gelen doğrulama linkine tıklayıp giriş yapabilirsin.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!isConfigured) {
    return <p className="rounded-2xl bg-honey-light p-4 text-sm text-honey">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="auth-email" className="label">
          E-posta
        </label>
        <input
          id="auth-email"
          type="email"
          className="input"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="auth-password" className="label">
          Şifre
        </label>
        <input
          id="auth-password"
          type="password"
          className="input"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {!isLogin && <p className="mt-1 text-xs text-ink-faint">En az 6 karakter.</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-coral-light p-3 text-sm text-coral-dark">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="rounded-2xl bg-leaf-light p-3 text-sm text-leaf-dark">
          {info}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? 'Bekle...' : isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
      </button>

      <p className="text-center text-sm text-ink-soft">
        {isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
        <button
          type="button"
          className="font-bold text-leaf underline-offset-2 hover:underline"
          onClick={() => {
            setError('')
            setInfo('')
            onModeChange(isLogin ? 'register' : 'login')
          }}
        >
          {isLogin ? 'Kayıt ol' : 'Giriş yap'}
        </button>
      </p>
    </form>
  )
}
