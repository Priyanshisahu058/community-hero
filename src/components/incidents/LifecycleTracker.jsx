import { Clock, CheckCircle2, AlertCircle, Loader } from 'lucide-react'

const STAGES = [
  { key: 'Emerging',     label: 'Emerging',     icon: '📡', desc: 'AI identified new civic incident from citizen reports' },
  { key: 'Verified',     label: 'Verified',     icon: '✅', desc: 'Admin reviewed and confirmed the incident' },
  { key: 'Assigned',     label: 'Assigned',     icon: '🏛️', desc: 'Assigned to responsible municipal authority' },
  { key: 'In Progress',  label: 'In Progress',  icon: '🔧', desc: 'Authority is actively working on resolution' },
  { key: 'Resolved',     label: 'Resolved',     icon: '✔️', desc: 'Issue fixed. Resolution proof uploaded.' },
  { key: 'Monitoring',   label: 'Monitoring',   icon: '👁️', desc: 'Monitoring for recurrence' },
]

const ORDER = STAGES.map(s => s.key)

export default function LifecycleTracker({ status, createdAt, resolvedAt }) {
  const currentIdx = ORDER.indexOf(status)

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock size={15} className="text-indigo-500" />
        Incident Lifecycle
      </h3>

      <div className="space-y-1">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isPending = idx > currentIdx
          const isLast = idx === STAGES.length - 1

          return (
            <div key={stage.key} className="flex gap-3">
              {/* Timeline column */}
              <div className="flex flex-col items-center w-6 flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                  isDone ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/30' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {isDone ? <CheckCircle2 size={12} /> :
                   isCurrent ? <Loader size={12} className="animate-spin" /> :
                   <span className="text-[10px]">{idx + 1}</span>}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 min-h-[16px] ${
                    isDone ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-3 flex-1 min-w-0 ${isLast ? '' : 'border-b-0'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{stage.icon}</span>
                  <span className={`text-sm font-semibold ${
                    isCurrent ? 'text-indigo-700 dark:text-indigo-400' :
                    isDone ? 'text-green-700 dark:text-green-400' :
                    'text-gray-400 dark:text-gray-600'
                  }`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium ml-auto">
                      Current
                    </span>
                  )}
                </div>
                {(isCurrent || isDone) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{stage.desc}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Resolution time if resolved */}
      {resolvedAt && createdAt && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Resolved in{' '}
            <strong className="text-green-600 dark:text-green-400">
              {Math.round((new Date(resolvedAt) - new Date(createdAt)) / (1000 * 60 * 60))} hours
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}
