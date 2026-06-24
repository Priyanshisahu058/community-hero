import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { formatDistanceToNow, format } from 'date-fns'

const STATUS_COLORS = {
  Submitted: 'bg-gray-400',
  Verified: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Resolved: 'bg-green-500',
  Closed: 'bg-gray-300',
}

export default function IssueTimeline({ issueId, currentStatus }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!issueId) return
    supabase
      .from('status_history')
      .select('*, profiles:actor_id(name)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('IssueTimeline error:', error)
        setHistory(data || [])
        setLoading(false)
      })
  }, [issueId])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-1" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Status Timeline</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-3 bottom-3 w-px bg-gray-100 dark:bg-gray-800" />

        <div className="space-y-5">
          {history.map((entry, idx) => {
            const isLast = idx === history.length - 1
            const dotColor = STATUS_COLORS[entry.new_status] || 'bg-gray-400'
            return (
              <div key={entry.id} className="flex gap-4 relative">
                {/* Dot */}
                <div className={`relative z-10 flex-shrink-0 mt-0.5`}>
                  {isLast ? (
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
                    </span>
                  ) : (
                    <span className={`block h-3 w-3 rounded-full ${dotColor} ring-2 ring-white dark:ring-gray-900`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {entry.new_status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {entry.old_status && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      From: <span className="text-gray-500">{entry.old_status}</span>
                    </p>
                  )}
                  {entry.note && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5">
                      {entry.note}
                    </p>
                  )}
                  {entry.profiles?.name && (
                    <p className="text-xs text-gray-400 mt-1">by {entry.profiles.name}</p>
                  )}
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                    {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )
          })}

          {history.length === 0 && (
            <p className="text-sm text-gray-400 pl-6">No status history yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
