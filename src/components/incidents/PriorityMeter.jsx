/**
 * PriorityMeter — Animated explainable priority score breakdown.
 * Shows each contributing factor so the score is never a black box.
 */
export default function PriorityMeter({ score, breakdown }) {
  const totalScore = score || breakdown?.total_score || 0

  const scoreColor = totalScore >= 80 ? '#DC2626' : totalScore >= 60 ? '#D97706' : totalScore >= 40 ? '#CA8A04' : '#16A34A'
  const scoreLabel = totalScore >= 80 ? 'Critical Priority' : totalScore >= 60 ? 'High Priority' : totalScore >= 40 ? 'Medium Priority' : 'Low Priority'

  const factors = breakdown ? [
    { label: 'Severity',           pts: breakdown.severity_pts,          max: 40, desc: 'Based on incident severity level' },
    { label: 'Report Frequency',   pts: breakdown.report_count_pts,       max: 25, desc: '+5 per additional report, capped at 5' },
    { label: 'Geographic Spread',  pts: breakdown.geo_spread_pts,         max: 5,  desc: 'Radius > 0.5km adds 5 points' },
    { label: 'Time Persistence',   pts: breakdown.time_persistence_pts,   max: 10, desc: '>12h: +5pts, >24h: +10pts' },
    { label: 'Safety Category',    pts: breakdown.category_urgency_pts,   max: 10, desc: 'Roads, Water, Electricity = +10' },
    { label: 'Recurrence',         pts: breakdown.recurrence_pts,         max: 5,  desc: '3+ reports = +5 points' },
  ] : []

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      {/* Score ring */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative flex-shrink-0">
          <svg width={88} height={88} viewBox="0 0 88 88">
            {/* Background ring */}
            <circle cx={44} cy={44} r={36} fill="none" stroke="#e5e7eb" strokeWidth={8} />
            {/* Score arc */}
            <circle
              cx={44} cy={44} r={36}
              fill="none"
              stroke={scoreColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36 * totalScore / 100} ${2 * Math.PI * 36}`}
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
            <text x={44} y={44} textAnchor="middle" dominantBaseline="middle" className="font-black" fontSize={18} fontWeight={900} fill={scoreColor}>
              {totalScore}
            </text>
            <text x={44} y={58} textAnchor="middle" fontSize={9} fill="#9CA3AF" fontWeight={600}>
              /100
            </text>
          </svg>
        </div>
        <div>
          <p className="text-lg font-black" style={{ color: scoreColor }}>{scoreLabel}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Calculated from 6 independent factors. Each factor is transparent and auditable.
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      {factors.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Score Breakdown</p>
          {factors.map(({ label, pts, max, desc }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{label}</span>
                  <span className="text-[10px] text-gray-400" title={desc}>ℹ</span>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">+{pts}<span className="text-gray-400 font-normal">/{max}</span></span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-fill"
                  style={{
                    width: `${max > 0 ? (pts / max) * 100 : 0}%`,
                    background: pts >= max ? scoreColor : '#6366F1',
                  }}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 mt-3">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Total Priority Score</span>
            <span className="text-sm font-black" style={{ color: scoreColor }}>{totalScore}/100</span>
          </div>
        </div>
      )}
    </div>
  )
}
