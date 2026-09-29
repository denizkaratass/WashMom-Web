import { useState } from 'react'
import { COLOR_GROUPS, COLOR_LABELS, FABRICS, FABRIC_LABELS } from '../constants/labels.js'
import { getWashingProfile } from '../rules/washingRules.js'
import { ColorDot } from './Badges.jsx'

/**
 * Kullanıcı kumaşı ve rengi düzeltir. Model yeniden eğitilmez; sadece bu kayıt değişir
 * ve profil washingRules ile anında yeniden hesaplanır.
 */
export default function CorrectionPanel({ fabric, colorGroup, onSave, onCancel, saveText = 'Düzeltmeyi Uygula', busy }) {
  const [draftFabric, setDraftFabric] = useState(fabric)
  const [draftColor, setDraftColor] = useState(colorGroup)
  const preview = getWashingProfile({ fabric: draftFabric, color_group: draftColor })

  return (
    <div className="rounded-3xl border-2 border-leaf/30 bg-leaf-light/40 p-5">
      <fieldset>
        <legend className="label">Kumaş / yapı</legend>
        <div className="flex flex-wrap gap-2">
          {FABRICS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={draftFabric === f}
              className={`chip ${draftFabric === f ? 'chip-active' : ''}`}
              onClick={() => setDraftFabric(f)}
            >
              {FABRIC_LABELS[f]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="label">Renk grubu</legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_GROUPS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={draftColor === c}
              className={`chip inline-flex items-center gap-2 ${draftColor === c ? 'chip-active' : ''}`}
              onClick={() => setDraftColor(c)}
            >
              <ColorDot colorGroup={c} />
              {COLOR_LABELS[c]}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="mt-5 text-sm text-ink-soft">
        Yeni yıkama profili: <strong className="text-ink">{preview.label}</strong>
      </p>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Vazgeç
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => onSave({ fabric: draftFabric, color_group: draftColor })}
        >
          {busy ? 'Kaydediliyor...' : saveText}
        </button>
      </div>
    </div>
  )
}
