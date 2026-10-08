import { useState } from 'react'
import { Link } from 'react-router'
import { COLOR_LABELS, FABRIC_LABELS } from '../constants/labels.js'
import { isUnresolvedReview } from '../rules/compatibilityRules.js'
import { ColorDot, ProfileBadge } from './Badges.jsx'

export function GarmentImage({ garment, className = '' }) {
  // Signed URL 1 saat geçerli; süresi dolarsa kırık resim yerine yer tutucu göster
  const [failedUrl, setFailedUrl] = useState(null)
  return garment.imageUrl && failedUrl !== garment.imageUrl ? (
    <img
      src={garment.imageUrl}
      alt={garment.name}
      loading="lazy"
      onError={() => setFailedUrl(garment.imageUrl)}
      className={`bg-cream-dark object-cover ${className}`}
    />
  ) : (
    <div role="img" className={`grid place-items-center bg-cream-dark text-4xl ${className}`} aria-label="Görsel yüklenemedi">
      👕
    </div>
  )
}

export default function GarmentCard({ garment }) {
  return (
    <Link
      to={`/wardrobe/${garment.id}`}
      className="group overflow-hidden rounded-3xl border border-sand bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <GarmentImage garment={garment} className="aspect-square w-full transition group-hover:scale-[1.02]" />
      <div className="space-y-2 p-4">
        <h3 className="truncate font-extrabold">{garment.name}</h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-soft">
          <ColorDot colorGroup={garment.color_group} className="size-3" />
          {FABRIC_LABELS[garment.fabric]} • {COLOR_LABELS[garment.color_group]}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ProfileBadge profile={garment.washing_profile} />
          {isUnresolvedReview(garment) && (
            <span className="rounded-full bg-honey-light px-2.5 py-1 text-xs font-bold text-honey">Kontrol et</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function GarmentCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-sand bg-white" aria-hidden="true">
      <div className="aspect-square bg-cream-dark" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded-full bg-cream-dark" />
        <div className="h-3 w-1/2 rounded-full bg-cream-dark" />
        <div className="h-6 w-20 rounded-full bg-cream-dark" />
      </div>
    </div>
  )
}
