import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '../../services/issues'
import { Trophy } from 'lucide-react'

const RANK_STYLES = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-orange-300 text-orange-900',
}

export default function Leaderboard() {
  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="animate-pulse space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-16 h-3 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Trophy size={18} className="text-yellow-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Leaderboard</h3>
        <span className="ml-auto text-xs text-gray-400">Top 10</span>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {leaders.map((profile, idx) => {
          const rank = idx + 1
          const badgeCount = Array.isArray(profile.badges) ? profile.badges.length : 0
          return (
            <div key={profile.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {/* Rank */}
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                RANK_STYLES[rank] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {rank}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {profile.name?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Name & ward */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.name || 'Anonymous'}</p>
                {profile.ward && <p className="text-xs text-gray-400 truncate">{profile.ward}</p>}
              </div>

              {/* Right side */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-teal-600">{profile.points?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400">{badgeCount} badge{badgeCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )
        })}

        {leaders.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-sm">
            No heroes yet. Be the first! 🏆
          </div>
        )}
      </div>
    </div>
  )
}
