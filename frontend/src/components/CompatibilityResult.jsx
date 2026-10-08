import { DISCLAIMER } from '../constants/labels.js'
import { NO, OK, WARN } from '../rules/compatibilityRules.js'

const STATUS_ICON = {
  [OK]: { icon: '✓', className: 'bg-leaf text-white', label: 'Uygun' },
  [WARN]: { icon: '⚠', className: 'bg-honey text-white', label: 'Dikkat' },
  [NO]: { icon: '✕', className: 'bg-coral-dark text-white', label: 'Uygun değil' },
}

const RESULT_STYLE = {
  HIGH_COMPATIBILITY: { emoji: '🫧', className: 'border-leaf/40 bg-leaf-light text-leaf-dark' },
  CAUTION: { emoji: '🤔', className: 'border-honey/40 bg-honey-light text-honey' },
  NOT_RECOMMENDED: { emoji: '🙅', className: 'border-coral/40 bg-coral-light text-coral-dark' },
}

/** result: checkCompatibility() çıktısı */
export default function CompatibilityResult({ result }) {
  const style = RESULT_STYLE[result.result]

  return (
    <section aria-live="polite" className="space-y-4">
      <div className={`rounded-3xl border-2 p-6 text-center ${style.className}`}>
        <div className="text-4xl" aria-hidden="true">
          {style.emoji}
        </div>
        <h2 className="mt-2 text-2xl font-extrabold">{result.title}</h2>
        <p className="mx-auto mt-2 max-w-lg font-semibold">{result.mainReason}</p>
      </div>

      <ul className="card divide-y divide-sand py-2 sm:py-2">
        {result.checks.map((check) => {
          const s = STATUS_ICON[check.status]
          return (
            <li key={check.key} className="flex items-start gap-4 py-4">
              <span role="img" className={`grid size-8 shrink-0 place-items-center rounded-full font-extrabold ${s.className}`} aria-label={s.label}>
                {s.icon}
              </span>
              <div>
                <p className="font-extrabold">{check.title}</p>
                <p className="text-sm text-ink-soft">{check.reason}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-ink-faint">{DISCLAIMER}</p>
    </section>
  )
}
