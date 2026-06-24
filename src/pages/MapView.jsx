import { useIssues } from '../hooks/useIssues'
import IssueMap from '../components/map/IssueMap'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function MapView() {
  const { data: issues = [], isLoading, isError, refetch } = useIssues({ limit: 200 })

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">Issue Map</h1>
          <p className="text-xs text-gray-400">{issues.length} issues plotted on map</p>
        </div>
        <div className="flex gap-2 text-xs">
          {['Critical', 'High', 'Medium', 'Low'].map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${['bg-red-600', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][i]}`} />
              <span className="hidden sm:block text-gray-500">{s}</span>
            </span>
          ))}
        </div>
      </div>

      {isError && (
        <div className="mx-4 mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">Failed to load issues</span>
          <button onClick={refetch} className="ml-auto"><RefreshCw size={14} className="text-red-500" /></button>
        </div>
      )}

      <div className="flex-1 p-4 relative">
        {isLoading ? (
          <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden relative animate-pulse">
            {/* Skeleton map grid lines */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(to right, #d1d5db 1px, transparent 1px), linear-gradient(to bottom, #d1d5db 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            {/* Fake marker pins */}
            {[[20, 30], [45, 55], [65, 25], [35, 70], [75, 65]].map(([top, left], i) => (
              <div key={i} className="absolute w-5 h-5 bg-gray-400 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-700 shadow-md"
                style={{ top: `${top}%`, left: `${left}%` }} />
            ))}
            {/* Zoom controls skeleton */}
            <div className="absolute top-4 left-4 flex flex-col gap-0.5">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-t-md" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-b-md" />
            </div>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg text-center">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading issues...</p>
              </div>
            </div>
          </div>
        ) : (
          <IssueMap issues={issues} height="100%" zoom={13} />
        )}
      </div>
    </div>
  )
}
