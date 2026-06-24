import { CATEGORIES } from '../../utils/constants'

export default function CategoryBadge({ category, showIcon = true }) {
  const config = CATEGORIES.find(c => c.value === category) || CATEGORIES[5]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-1 ${config.color}`}>
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  )
}
