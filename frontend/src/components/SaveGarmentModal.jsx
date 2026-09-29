import { useState } from 'react'
import Modal from './Modal.jsx'

// "Gardırobuma Kaydet" formu: isim (önerilen varsayılanla) + not.
export default function SaveGarmentModal({ open, defaultName, onClose, onSave }) {
  const [name, setName] = useState(defaultName)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave({ name: name.trim(), user_note: note.trim() })
    } catch (err) {
      console.error(err)
      setError('Kıyafeti kaydedemedim. İnternet bağlantını kontrol edip tekrar dener misin?')
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Gardırobuma Kaydet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="garment-name" className="label">
            Kıyafetin adı
          </label>
          <input
            id="garment-name"
            className="input"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink-faint">Örn: “Lacivert kazak”, “Sevdiğim kot”</p>
        </div>
        <div>
          <label htmlFor="garment-note" className="label">
            Not (isteğe bağlı)
          </label>
          <textarea
            id="garment-note"
            className="input min-h-24"
            maxLength={500}
            placeholder="Örn: Annemin hediyesi, kurutucuya atma!"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-coral-light p-3 text-sm text-coral-dark">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={busy || !name.trim()}>
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </Modal>
  )
}
