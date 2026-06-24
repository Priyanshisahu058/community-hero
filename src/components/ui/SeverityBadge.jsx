import { SEVERITIES } from '../../utils/constants'

export default function SeverityBadge({ severity, size = 'sm' }) {
  const config = SEVERITIES.find(s => s.value === severity) || SEVERITIES[1]
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
