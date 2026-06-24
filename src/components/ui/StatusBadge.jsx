import { STATUSES } from '../../utils/constants'

export default function StatusBadge({ status }) {
  const config = STATUSES.find(s => s.value === status) || STATUSES[0]
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-1 ${config.color}`}>
      {config.label}
    </span>
  )
}
