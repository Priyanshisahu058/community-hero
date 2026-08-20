import { CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react'

const PRIORITY_CONFIG = {
  Urgent: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  High:   { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  Normal: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-400' },
}

export default function RecommendationList({ recommendations = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={15} className="text-amber-500 animate-pulse" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">Generating AI Recommendations…</span>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-14 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <p className="text-sm text-gray-400 text-center py-4">No recommendations generated yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
          <Zap size={13} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Recommended Actions</h3>
        <span className="ml-auto text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
          {recommendations.length} steps
        </span>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((rec, idx) => {
          const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.Normal
          return (
            <div
              key={idx}
              className={`rounded-xl border p-3 flex items-start gap-3 animate-slide-up ${cfg.bg} ${cfg.border}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Step number */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{rec.action}</p>
                {rec.timeframe && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={10} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{rec.timeframe}</span>
                    {rec.priority === 'Urgent' && (
                      <span className={`text-xs font-bold ${cfg.color} flex items-center gap-0.5 ml-auto`}>
                        <AlertTriangle size={9} /> URGENT
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-start gap-2">
        <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          AI recommendations are advisory. Human verification and authority judgment are required before action.
        </p>
      </div>
    </div>
  )
}
