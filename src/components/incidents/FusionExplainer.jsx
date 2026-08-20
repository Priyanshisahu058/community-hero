import { Zap, MapPin, Clock, MessageSquare } from 'lucide-react'

/**
 * Visualises WHY the AI grouped reports into this incident.
 * Shows the multi-dimensional similarity breakdown + explanation text.
 */
export default function FusionExplainer({ incident, relatedIssues = [], explanation }) {
  const reportCount = relatedIssues.length || incident.report_count || 1

  // Compute average scores
  const avgSemantic = relatedIssues.length > 0
    ? Math.round(relatedIssues.reduce((s, r) => s + (r.semantic_score || 0), 0) / relatedIssues.length)
    : incident.ai_confidence || 70
  const avgLocation = relatedIssues.length > 0
    ? Math.round(relatedIssues.reduce((s, r) => s + (r.location_score || 0), 0) / relatedIssues.length)
    : Math.min(95, incident.ai_confidence + 10)
  const avgTime = relatedIssues.length > 0
    ? Math.round(relatedIssues.reduce((s, r) => s + (r.time_score || 0), 0) / relatedIssues.length)
    : 85
  const avgCategory = relatedIssues.length > 0
    ? Math.round(relatedIssues.reduce((s, r) => s + (r.category_score || 0), 0) / relatedIssues.length)
    : 100

  const metrics = [
    { label: 'Semantic Similarity', value: avgSemantic, icon: MessageSquare, color: '#6366F1' },
    { label: 'Location Proximity', value: avgLocation, icon: MapPin, color: '#0EA5E9' },
    { label: 'Time Proximity', value: avgTime, icon: Clock, color: '#10B981' },
    { label: 'Category Consistency', value: avgCategory, icon: Zap, color: '#F59E0B' },
  ]

  const overallConfidence = incident.ai_confidence || Math.round(
    0.35 * avgSemantic + 0.30 * avgLocation + 0.20 * avgTime + 0.15 * avgCategory
  )

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/60 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/20 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center ai-glow">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Why did AI create this incident?</h3>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">AI Incident Fusion — CivicMind</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{overallConfidence}%</p>
          <p className="text-[10px] text-indigo-500 font-medium">Fusion Confidence</p>
        </div>
      </div>

      {/* Visual: Reports → Fusion → Incident */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto py-1">
        {/* Reports stack */}
        <div className="flex-shrink-0">
          <div className="space-y-1">
            {Array.from({ length: Math.min(reportCount, 4) }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-24 h-6 rounded-lg bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 flex items-center px-2 text-[10px] text-gray-600 dark:text-gray-400 truncate shadow-sm">
                  Report {i + 1}
                </div>
                <div className="w-3 h-px bg-indigo-400 animate-flow" style={{ animationDelay: `${i * 200}ms` }} />
              </div>
            ))}
            {reportCount > 4 && (
              <p className="text-[10px] text-indigo-500 pl-2">+{reportCount - 4} more</p>
            )}
          </div>
        </div>

        {/* Arrow + AI box */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="w-px h-full bg-indigo-300 dark:bg-indigo-700" />
          <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg ai-glow text-center leading-tight">
            🧠 AI<br/>FUSION
          </div>
          <div className="w-px h-full bg-indigo-300 dark:bg-indigo-700" />
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <div className="h-px w-6 bg-indigo-400" />
          <span className="text-indigo-400">▶</span>
        </div>

        {/* Result */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-2 border-indigo-400 dark:border-indigo-600 rounded-xl px-3 py-2 shadow-md">
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">1 INCIDENT</p>
          <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight" style={{ maxWidth: 100 }}>
            {incident.title?.split(' ').slice(0, 4).join(' ')}{incident.title?.split(' ').length > 4 ? '…' : ''}
          </p>
        </div>
      </div>

      {/* Similarity metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/70 dark:bg-gray-900/50 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Icon size={10} style={{ color }} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              <span className="text-xs font-black" style={{ color }}>{value}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-fill"
                style={{ width: `${value}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Explanation text */}
      {(explanation || incident.ai_fusion_reasoning) && (
        <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">AI Reasoning</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
            "{explanation || incident.ai_fusion_reasoning}"
          </p>
        </div>
      )}
    </div>
  )
}
