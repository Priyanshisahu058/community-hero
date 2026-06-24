import { CATEGORIES, STATUSES, SEVERITIES } from '../../utils/constants'

export default function Sidebar({ filters, onChange, onReset }) {
  const { category, status, severity } = filters

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Filters</h3>
          <button
            onClick={onReset}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            Reset all
          </button>
        </div>

        {/* Category */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-col gap-1">
            {[{ value: 'All', label: 'All Categories', icon: '📋' }, ...CATEGORIES].map(cat => (
              <button
                key={cat.value}
                onClick={() => onChange('category', cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                  category === cat.value
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</p>
          <div className="flex flex-col gap-1">
            {[{ value: 'All', label: 'All Statuses' }, ...STATUSES].map(st => (
              <button
                key={st.value}
                onClick={() => onChange('status', st.value)}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                  status === st.value
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Severity</p>
          <div className="flex flex-col gap-1">
            {[{ value: 'All', label: 'All Severities', dot: 'bg-gray-400' }, ...SEVERITIES].map(sv => (
              <button
                key={sv.value}
                onClick={() => onChange('severity', sv.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                  severity === sv.value
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${sv.dot}`} />
                {sv.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
