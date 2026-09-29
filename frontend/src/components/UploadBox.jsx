import { useEffect, useRef, useState } from 'react'
import { resizeImage, validateImageFile } from '../utils/resizeImage.js'

/**
 * Fotoğraf seçme: dosya seçici, sürükle-bırak ve (mobilde) kamera.
 * Geçerli dosyayı küçültür ve onReady(resizedFile) ile üst bileşene verir.
 */
export default function UploadBox({ file, onReady, onClear, onSubmit, busy }) {
  const fileInput = useRef(null)
  const cameraInput = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [preparing, setPreparing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const previewRef = useRef(null)

  // Önizleme URL'si olayın içinde (dosya seçilince) oluşturulur; eskisi bellekten temizlenir.
  function replacePreview(nextFile) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = nextFile ? URL.createObjectURL(nextFile) : null
    setPreviewUrl(previewRef.current)
  }

  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), [])

  async function handleFile(selected) {
    setError('')
    const problem = validateImageFile(selected)
    if (problem) return setError(problem)

    setPreparing(true)
    try {
      const resized = await resizeImage(selected)
      replacePreview(resized)
      onReady(resized)
    } catch {
      setError('Bu fotoğrafı açamadım. Dosya bozuk olabilir, başka bir fotoğraf dener misin?')
    } finally {
      setPreparing(false)
    }
  }

  function onInputChange(e) {
    const selected = e.target.files?.[0]
    e.target.value = '' // aynı dosya tekrar seçilebilsin
    if (selected) handleFile(selected)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) handleFile(dropped)
  }

  const hiddenInputs = (
    <>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onInputChange} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onInputChange} />
    </>
  )

  if (file && previewUrl) {
    return (
      <div className="card">
        {hiddenInputs}
        <img src={previewUrl} alt="Seçilen kıyafet fotoğrafı" className="mx-auto max-h-96 w-full rounded-2xl bg-cream-dark object-contain" />
        <p className="mt-4 text-center font-extrabold text-leaf">Fotoğraf hazır ✓</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn btn-secondary" onClick={() => {
              setError('')
              replacePreview(null)
              onClear()
            }} disabled={busy}>
            Değiştir
          </button>
          <button type="button" className="btn btn-primary sm:min-w-52" onClick={onSubmit} disabled={busy}>
            WashMom’a Sor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {hiddenInputs}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition sm:py-16 ${
          dragging ? 'border-leaf bg-leaf-light' : 'border-sand bg-white'
        }`}
      >
        <div className="mb-4 grid size-16 place-items-center rounded-full bg-leaf-light text-3xl" aria-hidden="true">
          👕
        </div>
        <p className="text-lg font-extrabold">{preparing ? 'Fotoğraf hazırlanıyor...' : 'Fotoğrafını buraya bırak'}</p>
        <p className="mt-1 text-sm text-ink-faint">JPG, PNG ya da WEBP · en fazla 10 MB</p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={() => fileInput.current.click()} disabled={preparing}>
            Dosya Seç
          </button>
          <button type="button" className="btn btn-secondary sm:hidden" onClick={() => cameraInput.current.click()} disabled={preparing}>
            📷 Kamerayla Çek
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-coral-light p-4 text-sm font-semibold text-coral-dark">
          {error}
        </p>
      )}
    </div>
  )
}
