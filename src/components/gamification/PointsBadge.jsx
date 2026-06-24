import { BADGES } from '../../utils/constants'

export default function PointsBadge({ points = 0, badges = [] }) {
  const LEVELS = [
    { min: 0, label: 'Newcomer', color: 'from-gray-400 to-gray-500' },
    { min: 50, label: 'Activist', color: 'from-green-400 to-green-600' },
    { min: 150, label: 'Champion', color: 'from-blue-400 to-blue-600' },
    { min: 300, label: 'Guardian', color: 'from-purple-400 to-purple-600' },
    { min: 500, label: 'Hero', color: 'from-teal-400 to-teal-600' },
    { min: 1000, label: 'Legend', color: 'from-yellow-400 to-orange-500' },
  ]

  const level = [...LEVELS].reverse().find(l => points >= l.min) || LEVELS[0]
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1]
  const progressPct = nextLevel
    ? Math.min(100, ((points - level.min) / (nextLevel.min - level.min)) * 100)
    : 100

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      {/* Points header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center shadow-lg`}>
          <span className="text-2xl font-black text-white">{points >= 1000 ? '1K+' : points}</span>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Your Points</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{points.toLocaleString()}</p>
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white`}>
            {level.label}
          </span>
        </div>
      </div>

      {/* Progress to next level */}
      {nextLevel && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{points} pts</span>
            <span>{nextLevel.min} pts to {nextLevel.label}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${level.color} rounded-full transition-all duration-700`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Badges Earned</p>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((badge, idx) => {
            const earned = Array.isArray(badges) && badges.some(b => b?.id === badge.id)
            const CHIP_COLORS = [
              'from-teal-400 to-cyan-500',
              'from-purple-400 to-pink-500',
              'from-orange-400 to-amber-500',
              'from-blue-400 to-indigo-500',
              'from-green-400 to-emerald-500',
            ]
            const chipColor = CHIP_COLORS[idx % CHIP_COLORS.length]
            return earned ? (
              <span
                key={badge.id}
                title={badge.description}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${chipColor} shadow-sm cursor-default`}
              >
                <span className="text-sm">{badge.icon}</span>
                {badge.label}
              </span>
            ) : (
              <span
                key={badge.id}
                title={`${badge.description} (locked)`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 cursor-default opacity-60"
              >
                <span className="grayscale text-sm">{badge.icon}</span>
                {badge.label}
              </span>
            )
          })}
        </div>
        {Array.isArray(badges) && badges.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">Complete actions to earn badges! 🏆</p>
        )}
      </div>
    </div>
  )
}
