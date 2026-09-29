export default function Spinner({ label = 'Yükleniyor...' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-ink-soft">
      <span className="size-9 animate-spin rounded-full border-4 border-sand border-t-leaf" aria-hidden="true" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}
