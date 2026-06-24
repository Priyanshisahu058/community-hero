import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications } from '../../hooks/useNotifications'
import useAuthStore from '../../store/authStore'

const NOTIF_ICONS = {
  status_change: '🔄',
  vote_milestone: '🏆',
  badge_earned: '🎖️',
  issue_resolved: '✅',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { user } = useAuthStore()
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-medium text-gray-500 dark:text-gray-400">You're all caught up!</p>
                <p className="text-xs mt-1">No new notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${
                    !n.read ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || '📢'}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
