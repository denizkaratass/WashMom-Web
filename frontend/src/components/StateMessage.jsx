// Boş durum / hata durumu için ortak kutu.
export default function StateMessage({ icon = '🧺', title, children, action, tone = 'neutral' }) {
  const toneClass = tone === 'error' ? 'border-coral/40 bg-coral-light/60' : 'border-sand bg-white'
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`rounded-3xl border ${toneClass} px-6 py-12 text-center`}>
      <div className="mb-3 text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-ink-soft">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
