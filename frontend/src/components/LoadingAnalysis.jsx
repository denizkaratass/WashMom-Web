import { useEffect, useState } from 'react'

// UX mesajları; her adım için ayrı model yok.
const STEPS = ['Görsel hazırlanıyor', 'Kumaş yapısı analiz ediliyor', 'Renk grubu belirleniyor', 'Yıkama profili oluşturuluyor']
const STEP_MS = 600
const SLOW_MS = 8000 // cold start uyarısı

export default function LoadingAnalysis({ previewUrl }) {
  const [done, setDone] = useState(0)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    // Son adım istek bitene kadar "devam ediyor" olarak kalır
    const stepTimer = setInterval(() => setDone((d) => Math.min(d + 1, STEPS.length - 1)), STEP_MS)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => {
      clearInterval(stepTimer)
      clearTimeout(slowTimer)
    }
  }, [])

  return (
    <div className="card flex flex-col items-center gap-6 sm:flex-row sm:items-start" role="status" aria-live="polite">
      {previewUrl && (
        <div className="relative w-40 shrink-0 overflow-hidden rounded-2xl">
          <img src={previewUrl} alt="Analiz edilen kıyafet" className="aspect-square w-full object-cover" />
          <div className="absolute inset-x-0 h-1/3 animate-[scan_1.6s_ease-in-out_infinite] bg-linear-to-b from-transparent via-white/50 to-transparent" />
        </div>
      )}
      <div className="w-full">
        <p className="text-lg font-extrabold">Kıyafet inceleniyor...</p>
        <ul className="mt-4 space-y-2.5">
          {STEPS.map((step, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'waiting'
            return (
              <li key={step} className={`flex items-center gap-3 ${state === 'waiting' ? 'text-ink-faint' : 'text-ink'}`}>
                <span
                  aria-hidden="true"
                  className={`grid size-6 place-items-center rounded-full text-xs font-extrabold ${
                    state === 'done' ? 'bg-leaf text-white' : state === 'active' ? 'animate-pulse bg-leaf-light text-leaf' : 'bg-cream-dark'
                  }`}
                >
                  {state === 'done' ? '✓' : ''}
                </span>
                <span className="font-semibold">{step}</span>
              </li>
            )
          })}
        </ul>
        {slow && (
          <p className="mt-5 rounded-2xl bg-honey-light p-3 text-sm font-semibold text-honey">
            WashMom biraz uykulu, uyanıyor... ☕ İlk analiz biraz uzun sürebilir.
          </p>
        )}
      </div>
    </div>
  )
}
