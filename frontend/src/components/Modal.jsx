import { useEffect, useId, useRef } from 'react'

/**
 * Tarayıcının yerleşik <dialog> elementi: odak modal içinde kalır, Esc ile kapanır,
 * arka plan tıklanamaz. Ek kütüphane gerekmez.
 */
export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const ref = useRef(null)
  const pressedBackdrop = useRef(false)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const width = size === 'sm' ? 'max-w-sm' : 'max-w-md'

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault() // Esc → state üzerinden kapat
        onClose()
      }}
      // Arka plana tıklayınca kapat. Sadece "click" yetmez: input'ta metin seçip fareyi dışarıda
      // bırakınca da click dialog'un kendisine düşer ve yazılanlar kaybolur. Basış da arka planda olmalı.
      onMouseDown={(e) => (pressedBackdrop.current = e.target === ref.current)}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === ref.current) onClose()
        pressedBackdrop.current = false
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-3xl bg-cream p-0 text-ink shadow-xl`}
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-extrabold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="btn btn-ghost -mt-1 -mr-2 px-2 py-1" aria-label="Kapat">
              ✕
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
