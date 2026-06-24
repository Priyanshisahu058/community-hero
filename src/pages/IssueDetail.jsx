import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import { formatDistanceToNow } from 'date-fns'
import { ChevronLeft, ChevronRight, MapPin, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import { useIssue } from '../hooks/useIssues'
import CategoryBadge from '../components/ui/CategoryBadge'
import SeverityBadge from '../components/ui/SeverityBadge'
import StatusBadge from '../components/ui/StatusBadge'
import CommunityPoll from '../components/issues/CommunityPoll'
import IssueTimeline from '../components/issues/IssueTimeline'
import ResolutionProof from '../components/issues/ResolutionProof'
import FeedbackPrompt from '../components/issues/FeedbackPrompt'
import EmergencyContacts from '../components/ui/EmergencyContacts'
import { SEVERITIES } from '../utils/constants'
import 'leaflet/dist/leaflet.css'

export default function IssueDetail() {
  const { id } = useParams()
  const { data: issue, isLoading, isError, refetch } = useIssue(id)
  const [imgIdx, setImgIdx] = useState(0)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-5">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    )
  }

  if (isError || !issue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Issue not found</h2>
          <p className="text-sm text-gray-500 mb-4">This issue may have been removed or doesn't exist.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={refetch} className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">
              <RefreshCw size={14} /> Retry
            </button>
            <Link to="/" className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium">
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mediaUrls = Array.isArray(issue.media_urls) ? issue.media_urls : []
  const isResolved = ['Resolved', 'Closed'].includes(issue.status)
  const severityColor = SEVERITIES.find(s => s.value === issue.severity)?.mapColor || '#CA8A04'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors">
        <ChevronLeft size={16} /> Back to Feed
      </Link>

      {/* Image Carousel */}
      {mediaUrls.length > 0 && (
        <div className="relative bg-black rounded-2xl overflow-hidden">
          <img
            src={mediaUrls[imgIdx]}
            alt={`Photo ${imgIdx + 1}`}
            className="w-full h-72 sm:h-96 object-cover"
          />
          {mediaUrls.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => (i - 1 + mediaUrls.length) % mediaUrls.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setImgIdx(i => (i + 1) % mediaUrls.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {mediaUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${i === imgIdx ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Title + Badges */}
      <div>
        <div className="flex gap-2 mb-2 flex-wrap">
          <CategoryBadge category={issue.category} />
          <SeverityBadge severity={issue.severity} />
          <StatusBadge status={issue.status} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-snug">{issue.title}</h1>
        {issue.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{issue.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Reported {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
          {issue.profiles?.name && <> by <span className="text-gray-500 font-medium">{issue.profiles.name}</span></>}
          {issue.profiles?.ward && <span className="text-gray-400"> · {issue.profiles.ward}</span>}
        </p>
      </div>

      {/* Location */}
      {issue.lat && issue.lng && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-teal-600" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Location</span>
          </div>
          {issue.address && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{issue.address}</p>}
          {issue.landmark && (
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-3 flex items-center gap-1">
              <span>📍</span> Near {issue.landmark}
            </p>
          )}
          {!issue.landmark && issue.address && <div className="mb-3" />}
          <div className="h-40 rounded-xl overflow-hidden">
            <MapContainer center={[issue.lat, issue.lng]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker
                center={[issue.lat, issue.lng]}
                radius={12}
                pathOptions={{ fillColor: severityColor, fillOpacity: 0.85, color: '#fff', weight: 2 }}
              />
            </MapContainer>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {issue.ai_reasoning && (
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-purple-500" />
            <h3 className="font-semibold text-purple-800 dark:text-purple-400 text-sm">AI Analysis</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {[
              { label: 'AI Category', val: issue.ai_category },
              { label: 'AI Severity', val: issue.ai_severity },
              { label: 'Priority Score', val: issue.ai_priority_score ? `${issue.ai_priority_score}/100` : '—' },
            ].map(item => (
              <div key={item.label} className="bg-white/60 dark:bg-purple-900/20 rounded-xl p-2.5">
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.val || '—'}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">{issue.ai_reasoning}</p>
        </div>
      )}

      {/* Community Poll */}
      <CommunityPoll issue={issue} />

      {/* Resolution Proof */}
      {isResolved && <ResolutionProof issueId={issue.id} />}

      {/* Feedback / Rating — shows for original reporter on resolved issues */}
      {isResolved && <FeedbackPrompt issue={issue} />}

      {/* Emergency Contacts */}
      <EmergencyContacts category={issue.category} />

      {/* Timeline */}
      <IssueTimeline issueId={issue.id} currentStatus={issue.status} />

      {/* Reporter */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
          {issue.profiles?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{issue.profiles?.name || 'Anonymous'}</p>
          {issue.profiles?.ward && <p className="text-xs text-gray-400">{issue.profiles.ward}</p>}
        </div>
      </div>
    </div>
  )
}
