import { Link } from 'react-router-dom'
import { AlertTriangle, Users, MapPin, TrendingUp, Clock, ChevronRight, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const SEVERITY_CONFIG = {
  Critical: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800' },
  High:     { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500', ring: 'ring-orange-200' },
  Medium:   { bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500', ring: 'ring-yellow-200' },
  Low:      { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', ring: 'ring-green-200' },
}

const STATUS_CONFIG = {
  Emerging:    { label: 'Emerging',    color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  Verified:    { label: 'Verified',    color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  Assigned:    { label: 'Assigned',    color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  'In Progress': { label: 'In Progress', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  Resolved:    { label: 'Resolved',    color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20' },
  Monitoring:  { label: 'Monitoring',  color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-900/20' },
}

const CATEGORY_ICONS = {
  Roads: '🛣️', Water: '💧', Electricity: '⚡', Sanitation: '🗑️', Encroachment: '🚧', Other: '📌',
}

export default function IncidentCard({ incident, rank }) {
  const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.Medium
  const status = STATUS_CONFIG[incident.status] || STATUS_CONFIG.Emerging
  const isCritical = incident.severity === 'Critical'

  return (
    <Link
      to={`/incidents/${incident.id}`}
      className={`block group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${sev.bg} ${sev.border} ${isCritical ? 'animate-pulse-ring ring-2 ' + sev.ring : ''}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {rank && (
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900/10 dark:bg-white/10 text-xs font-black flex items-center justify-center text-gray-700 dark:text-gray-300 mt-0.5">
              {rank}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sev.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${isCritical ? 'animate-pulse' : ''}`} />
                {incident.severity}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {CATEGORY_ICONS[incident.category] || '📌'} {incident.title}
            </h3>
          </div>
        </div>

        {/* Priority score ring */}
        <div className="flex-shrink-0 text-center">
          <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 ${
            incident.priority_score >= 80 ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
            incident.priority_score >= 60 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' :
            'border-gray-300 bg-gray-50 dark:bg-gray-800'
          }`}>
            <span className={`text-sm font-black leading-none ${
              incident.priority_score >= 80 ? 'text-red-600' :
              incident.priority_score >= 60 ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400'
            }`}>{incident.priority_score}</span>
            <span className="text-[9px] text-gray-400 font-medium">PRIORITY</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
        <span className="flex items-center gap-1">
          <AlertTriangle size={11} className={incident.report_count >= 3 ? 'text-orange-500' : ''} />
          <strong className="text-gray-700 dark:text-gray-300">{incident.report_count}</strong> report{incident.report_count !== 1 ? 's' : ''}
        </span>
        {incident.affected_population > 0 && (
          <span className="flex items-center gap-1">
            <Users size={11} />
            ~{incident.affected_population.toLocaleString()} affected
          </span>
        )}
        {incident.address && (
          <span className="flex items-center gap-1 flex-1 min-w-0">
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{incident.address?.split(',')[0]}</span>
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto flex-shrink-0">
          <Clock size={11} />
          {formatDistanceToNow(new Date(incident.first_reported_at || incident.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* AI confidence bar */}
      {incident.ai_confidence > 0 && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Zap size={9} /> AI Fusion Confidence
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{incident.ai_confidence}%</span>
          </div>
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${incident.ai_confidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Hover arrow */}
      <div className="flex justify-end mt-2">
        <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200" />
      </div>
    </Link>
  )
}
