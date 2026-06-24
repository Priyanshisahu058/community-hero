import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { MapPin, CheckCircle, ThumbsUp } from 'lucide-react'
import CategoryBadge from '../ui/CategoryBadge'
import SeverityBadge from '../ui/SeverityBadge'
import StatusBadge from '../ui/StatusBadge'

export default function IssueCard({ issue }) {
  const {
    id, title, category, severity, status, address, landmark, media_urls,
    vote_genuine, vote_fake, vote_resolved, vote_needs_proof, created_at,
    profiles,
  } = issue

  const totalVotes = (vote_genuine || 0) + (vote_fake || 0) + (vote_resolved || 0) + (vote_needs_proof || 0)
  const thumbnail = Array.isArray(media_urls) && media_urls.length > 0 ? media_urls[0] : null

  return (
    <Link
      to={`/issues/${id}`}
      className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-750 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">
              {{ Roads: '🛣️', Water: '💧', Electricity: '⚡', Sanitation: '🗑️', Encroachment: '🚧' }[category] || '📌'}
            </span>
          </div>
        )}
        {/* Severity overlay badge */}
        <div className="absolute top-3 right-3">
          <SeverityBadge severity={severity} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CategoryBadge category={category} />
          <StatusBadge status={status} />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 mb-2 group-hover:text-teal-600 transition-colors">
          {title}
        </h3>

        {/* Address */}
        {address && (
          <div className="flex items-start gap-1.5 mb-1">
            <MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{address}</span>
          </div>
        )}
        {/* Landmark */}
        {landmark && (
          <div className="flex items-start gap-1.5 mb-3">
            <span className="text-xs flex-shrink-0 mt-0.5">📍</span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-medium line-clamp-1">Near {landmark}</span>
          </div>
        )}
        {!address && !landmark && <div className="mb-3" />}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-green-500" />
              {vote_genuine || 0}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp size={12} className="text-blue-500" />
              {totalVotes}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  )
}
