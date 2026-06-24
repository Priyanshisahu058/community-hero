import { formatDistanceToNow } from 'date-fns'
import CategoryBadge from '../ui/CategoryBadge'
import SeverityBadge from '../ui/SeverityBadge'
import StatusBadge from '../ui/StatusBadge'
import { MapPin, ChevronRight } from 'lucide-react'

export default function AdminIssueQueue({ issues = [], selectedId, onSelect, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
      {issues.map(issue => {
        const priority = (issue.vote_genuine || 0) * 2 + (issue.ai_priority_score || 50)
        return (
          <button
            key={issue.id}
            onClick={() => onSelect(issue)}
            className={`w-full text-left bg-white dark:bg-gray-900 rounded-xl border transition-all duration-150 hover:shadow-md ${
              selectedId === issue.id
                ? 'border-teal-500 ring-1 ring-teal-500/30 shadow-md'
                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="p-4">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex gap-1.5 flex-wrap">
                  <SeverityBadge severity={issue.severity} size="xs" />
                  <CategoryBadge category={issue.category} showIcon={false} />
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge status={issue.status} />
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </div>

              {/* Title */}
              <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1.5">{issue.title}</p>

              {/* Location */}
              {issue.address && (
                <div className="flex items-center gap-1 mb-2">
                  <MapPin size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-400 truncate">{issue.address}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>✅ {issue.vote_genuine || 0} · 🎯 {priority}</span>
                <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </button>
        )
      })}

      {issues.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">🎉</p>
          <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm">All clear!</p>
          <p className="text-xs mt-1">No pending issues in the queue.</p>
        </div>
      )}
    </div>
  )
}
