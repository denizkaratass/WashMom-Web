import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase, SUPABASE_NOT_CONFIGURED_MESSAGE } from '../services/supabase.js'

const AuthContext = createContext(null)

const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'E-posta ya da şifre hatalı.',
  'Email not confirmed': 'E-postanı henüz doğrulamamışsın. Gelen kutunu kontrol et.',
  'User already registered': 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.',
}

function toTurkish(error) {
  // Sunucuya hiç ulaşılamadı (internet yok / Supabase projesi duraklatılmış)
  if (error.name === 'AuthRetryableFetchError' || error.message?.includes('Failed to fetch')) {
    return 'Hesap sunucusuna ulaşamadım. İnternet bağlantını kontrol edip biraz sonra tekrar dener misin?'
  }
  if (error.message?.includes('Password should be')) return 'Şifre en az 6 karakter olmalı.'
  if (error.message?.includes('rate limit')) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.'
  return AUTH_ERROR_MESSAGES[error.message] ?? 'Bir şeyler ters gitti. Lütfen tekrar dene.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    // Sayfa açılınca mevcut oturumu oku, sonra değişiklikleri (giriş/çıkış) dinle
    // Hata olsa bile loading bitmeli; yoksa korumalı sayfalar sonsuza kadar spinner gösterir.
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((err) => console.error('Oturum okunamadı:', err))
      .finally(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(() => {
    async function run(fn) {
      if (!isSupabaseConfigured) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE)
      const { data, error } = await fn()
      if (error) throw new Error(toTurkish(error))
      return data
    }

    return {
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      signIn: (email, password) => run(() => supabase.auth.signInWithPassword({ email, password })),
      /** data.session null ise e-posta doğrulaması bekleniyor demektir */
      signUp: (email, password) =>
        run(() =>
          supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          }),
        ),
      signOut: () => run(() => supabase.auth.signOut()),
    }
  }, [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı')
  return ctx
}
