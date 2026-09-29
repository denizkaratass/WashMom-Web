import { formatPercent, getConfidenceLevel } from '../constants/labels.js'

const STYLES = {
  high: 'bg-leaf-light text-leaf-dark',
  medium: 'bg-honey-light text-honey',
  low: 'bg-coral-light text-coral-dark',
}

export default function ConfidenceBadge({ confidence }) {
  const level = getConfidenceLevel(confidence)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${STYLES[level.key]}`}>
      {level.label}
      <span className="font-semibold opacity-80">{formatPercent(confidence)}</span>
    </span>
  )
}
