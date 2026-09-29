import {
  COLOR_LABELS,
  COLOR_SWATCHES,
  PROFILE_BADGE_CLASSES,
  PROFILE_LABELS,
} from '../constants/labels.js'

export function ProfileBadge({ profile, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ${PROFILE_BADGE_CLASSES[profile]} ${className}`}>
      {PROFILE_LABELS[profile]}
    </span>
  )
}

export function ColorDot({ colorGroup, className = 'size-3.5' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border border-ink/20 ${className}`}
      style={{ background: COLOR_SWATCHES[colorGroup] }}
    />
  )
}

export function ColorLabel({ colorGroup }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ColorDot colorGroup={colorGroup} />
      {COLOR_LABELS[colorGroup]}
    </span>
  )
}
