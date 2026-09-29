import { useState } from 'react'
import Modal from './Modal.jsx'
import AuthForm from './AuthForm.jsx'

// Sayfadan ayrılmadan giriş: bellekteki analiz görseli (File) kaybolmasın diye modal.
export default function AuthModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState('login')

  return (
    <Modal open={open} onClose={onClose} title={mode === 'login' ? 'Kaydetmek için giriş yap' : 'Hesap oluştur'}>
      <p className="mb-5 text-sm text-ink-soft">Analiz sonucun kaybolmayacak; girişten sonra kaldığın yerden devam edeceğiz.</p>
      <AuthForm mode={mode} onModeChange={setMode} onSuccess={onSuccess} />
    </Modal>
  )
}
