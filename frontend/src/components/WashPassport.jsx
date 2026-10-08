import { DISCLAIMER, FABRIC_LABELS, formatPercent } from '../constants/labels.js'
import { getGroupingHints } from '../rules/compatibilityRules.js'
import { ColorLabel, ProfileBadge } from './Badges.jsx'
import ConfidenceBadge from './ConfidenceBadge.jsx'

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-sand py-3 last:border-0">
      <dt className="text-sm font-bold text-ink-soft">{label}</dt>
      <dd className="text-right font-extrabold">{children}</dd>
    </div>
  )
}

function HintList({ title, colors, profiles, tone }) {
  const items = [
    colors.length && `${colors.join(', ')} renkler`,
    profiles.length && `${profiles.join(', ')} profilli kıyafetler`,
  ].filter(Boolean)
  const style = tone === 'good' ? 'bg-leaf-light text-leaf-dark' : 'bg-coral-light text-coral-dark'
  return (
    <div className={`rounded-2xl p-4 ${style}`}>
      <p className="text-sm font-extrabold">{title}</p>
      <p className="mt-1 text-sm">{items.length ? items.join(' · ') : 'Makinede yıkama önerilmez; kuru temizleme veya uzman bakımı tercih et.'}</p>
    </div>
  )
}

/**
 * Wash Passport kartı — sadece gösterir; state tutmaz.
 * profile: getWashingProfile() çıktısı
 */
export default function WashPassport({
  imageUrl,
  title,
  fabric,
  colorGroup,
  confidence,
  profile,
  topPredictions = [],
  userCorrected,
  aiFabric,
  reviewBox,
  demo = false,
  children,
}) {
  const hints = getGroupingHints(colorGroup, profile.washing_profile)
  // Özel bakım kıyafetler hiçbir şeyle makinede yıkanmaz
  if (profile.washing_profile === 'special_care') hints.together = { colors: [], profiles: [] }

  return (
    <article className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div>
        <img
          src={imageUrl}
          alt={title}
          className="aspect-[4/5] w-full rounded-3xl border border-sand bg-cream-dark object-cover shadow-sm"
        />
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-extrabold tracking-wide text-coral-dark uppercase">Wash Passport</p>
          <h1 className="mt-1 text-3xl font-extrabold">{title}</h1>
        </div>

        {demo && (
          <p role="alert" className="rounded-2xl border-2 border-coral bg-coral-light p-4 text-sm font-bold text-coral-dark">
            Demo modu: Bu sonuç gerçek yapay zekâ modelinden gelmedi, rastgele üretildi. Kıyafetin için kullanma.
          </p>
        )}

        {reviewBox}

        <dl className="card py-2 sm:py-2">
          <Row label="Yapı">
            {FABRIC_LABELS[fabric]}
            {userCorrected && aiFabric !== fabric && <span className="ml-2 text-xs font-semibold text-ink-faint">(düzeltildi)</span>}
          </Row>
          <Row label="AI Güveni">
            <ConfidenceBadge confidence={confidence} />
          </Row>
          <Row label="Renk">
            <ColorLabel colorGroup={colorGroup} />
          </Row>
          <Row label="Yıkama Profili">
            <span className="inline-flex flex-wrap items-center justify-end gap-2">
              <ProfileBadge profile={profile.washing_profile} />
              <span>{profile.label}</span>
            </span>
          </Row>
          <Row label="Önerilen program">
            <span className="text-sm">
              {profile.program}
              {profile.temperature !== '—' && ` · ${profile.temperature}`}
            </span>
          </Row>
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          <HintList title="Birlikte değerlendirilebilir" tone="good" {...hints.together} />
          <HintList title="Ayrı tutmak daha güvenli" tone="bad" {...hints.apart} />
        </div>

        <details className="card group">
          <summary className="cursor-pointer list-none font-extrabold marker:hidden">
            <span className="flex items-center justify-between">
              WashMom neden böyle düşündü?
              <span className="transition group-open:rotate-180" aria-hidden="true">
                ⌄
              </span>
            </span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-ink-soft">
            <p>{profile.explanation}</p>
            {topPredictions.length > 0 && (
              <div>
                <p className="mb-2 font-bold text-ink">AI’ın kumaş tahminleri</p>
                <ul className="space-y-2">
                  {topPredictions.map((p) => (
                    <li key={p.label} className="flex items-center gap-3">
                      <span className="w-16 shrink-0">{FABRIC_LABELS[p.label] ?? p.label}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark">
                        <span className="block h-full rounded-full bg-leaf" style={{ width: `${Math.round(p.confidence * 100)}%` }} />
                      </span>
                      <span className="w-10 text-right font-semibold">{formatPercent(p.confidence)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              AI güveni, modelin bu tahmine ne kadar emin olduğunu gösterir; doğru olduğunun garantisi değildir.
              Model kıyafet dışı fotoğraflarda bile bir kumaş seçer.
            </p>
            <p>Renk grubu, kıyafet arka plandan ayrıldıktan sonra yalnızca kıyafete ait piksellerden hesaplandı.</p>
            <ul className="list-disc space-y-1 pl-5">
              {profile.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </details>

        {children}

        <p className="text-xs text-ink-faint">{DISCLAIMER}</p>
      </div>
    </article>
  )
}
