import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import CompatibilityResult from '../components/CompatibilityResult.jsx'
import { GarmentImage } from '../components/GarmentCard.jsx'
import { ProfileBadge } from '../components/Badges.jsx'
import Spinner from '../components/Spinner.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { COLOR_LABELS, FABRIC_LABELS } from '../constants/labels.js'
import { useGarments } from '../hooks/useGarments.js'
import { checkCompatibility } from '../rules/compatibilityRules.js'

function GarmentPicker({ id, label, garments, value, excludeId, onChange }) {
  const selected = garments.find((g) => g.id === value)
  return (
    <div className="card flex flex-col gap-4">
      <label htmlFor={id} className="label mb-0">
        {label}
      </label>
      <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Kıyafet seç...</option>
        {garments.map((g) => (
          <option key={g.id} value={g.id} disabled={g.id === excludeId}>
            {g.name} ({FABRIC_LABELS[g.fabric]} • {COLOR_LABELS[g.color_group]})
          </option>
        ))}
      </select>
      {selected ? (
        <div className="flex items-center gap-4">
          <GarmentImage garment={selected} className="size-20 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <p className="truncate font-extrabold">{selected.name}</p>
            <p className="text-sm text-ink-soft">
              {FABRIC_LABELS[selected.fabric]} • {COLOR_LABELS[selected.color_group]}
            </p>
            <ProfileBadge profile={selected.washing_profile} className="mt-1" />
          </div>
        </div>
      ) : (
        <div className="grid h-20 place-items-center rounded-2xl border-2 border-dashed border-sand text-sm text-ink-faint">
          Henüz seçilmedi
        </div>
      )}
    </div>
  )
}

export default function Compare() {
  const location = useLocation()
  const { garments, loading, error, reload } = useGarments()
  const [firstId, setFirstId] = useState(location.state?.firstId ?? null)
  const [secondId, setSecondId] = useState(null)

  if (loading) return <Spinner label="Gardırobun açılıyor..." />

  const a = garments.find((g) => g.id === firstId)
  const b = garments.find((g) => g.id === secondId)
  const result = a && b && a.id !== b.id ? checkCompatibility(a, b) : null

  return (
    <div className="page">
      <h1 className="text-3xl font-extrabold">Bununla yıkanır mı?</h1>
      <p className="mt-2 text-ink-soft">Gardırobundan iki kıyafet seç, WashMom birlikte yıkanıp yıkanamayacağını söylesin.</p>

      <div className="mt-8">
        {error ? (
          <StateMessage
            tone="error"
            icon="😕"
            title="Gardırobunu açamadım"
            action={
              <button type="button" className="btn btn-primary" onClick={reload}>
                Tekrar Dene
              </button>
            }
          />
        ) : garments.length < 2 ? (
          <StateMessage
            icon="🧺"
            title="Karşılaştırmak için en az 2 kıyafet lazım"
            action={
              <Link to="/analyze" className="btn btn-primary">
                Kıyafet Analiz Et
              </Link>
            }
          >
            Gardırobunda şu an {garments.length} kıyafet var. Birkaç kıyafet daha analiz edip kaydet, sonra buraya dön.
          </StateMessage>
        ) : (
          <div className="space-y-6">
            <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
              <GarmentPicker id="garment-a" label="1. kıyafet" garments={garments} value={firstId} excludeId={secondId} onChange={setFirstId} />
              <div className="grid place-items-center text-2xl font-extrabold text-coral" aria-hidden="true">
                +
              </div>
              <GarmentPicker id="garment-b" label="2. kıyafet" garments={garments} value={secondId} excludeId={firstId} onChange={setSecondId} />
            </div>

            {result ? (
              <CompatibilityResult result={result} />
            ) : (
              <p className="text-center text-ink-soft">Sonucu görmek için iki farklı kıyafet seç.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
