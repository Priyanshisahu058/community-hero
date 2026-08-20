import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet'
import { ArrowLeft, AlertTriangle, Users, MapPin, Clock, Building2, Loader, CheckCircle2, Camera, Brain } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fetchIncidentById, fetchIncidentIssues, fetchIncidentScore, fetchIncidentRecommendations, updateIncidentStatus } from '../services/incidents'
import { getIncidentExplanation } from '../services/incidentFusion'
import FusionExplainer from '../components/incidents/FusionExplainer'
import PriorityMeter from '../components/incidents/PriorityMeter'
import RecommendationList from '../components/incidents/RecommendationList'
import LifecycleTracker from '../components/incidents/LifecycleTracker'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

const SEVERITY_COLORS = { Critical: '#DC2626', High: '#D97706', Medium: '#CA8A04', Low: '#16A34A' }
const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  High:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
  Medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200',
  Low:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200',
}
const CATEGORY_ICONS = { Roads: '🛣️', Water: '💧', Electricity: '⚡', Sanitation: '🗑️', Encroachment: '🚧', Other: '📌' }

const ADMIN_STATUS_TRANSITIONS = {
  Emerging:    ['Verified', 'Assigned'],
  Verified:    ['Assigned'],
  Assigned:    ['In Progress'],
  'In Progress': ['Resolved', 'Monitoring'],
  Resolved:    ['Monitoring'],
  Monitoring:  ['Emerging'],
}

function Skeleton({ className = '' }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'

  const [explanation, setExplanation] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const { data: incident, isLoading: incLoading, refetch: refetchInc } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncidentById(id),
    enabled: !!id,
  })

  const { data: relatedIssues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ['incident-issues', id],
    queryFn: () => fetchIncidentIssues(id),
    enabled: !!id,
  })

  const { data: scoreBreakdown } = useQuery({
    queryKey: ['incident-score', id],
    queryFn: () => fetchIncidentScore(id),
    enabled: !!id,
  })

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ['incident-recommendations', id],
    queryFn: () => fetchIncidentRecommendations(id),
    enabled: !!id,
  })

  // Fetch AI explanation once we have incident + issues
  useEffect(() => {
    if (incident && relatedIssues.length > 0 && !explanation) {
      getIncidentExplanation(incident, relatedIssues).then(setExplanation)
    }
  }, [incident, relatedIssues])

  const handleStatusChange = async (newStatus) => {
    if (!incident) return
    setStatusLoading(true)
    try {
      await updateIncidentStatus(incident.id, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      refetchInc()
    } catch (err) {
      toast.error('Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  if (incLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 md:col-span-2" />
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">Incident not found</p>
          <button onClick={() => navigate('/intelligence')} className="text-indigo-600 hover:underline text-sm">
            ← Back to City Intelligence
          </button>
        </div>
      </div>
    )
  }

  const sevColor = SEVERITY_COLORS[incident.severity] || '#CA8A04'
  const sevBadge = SEVERITY_BADGE[incident.severity] || SEVERITY_BADGE.Medium
  const allowedTransitions = (isAdmin && ADMIN_STATUS_TRANSITIONS[incident.status]) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      {/* ── Top bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/intelligence')} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">City Intelligence → Incident</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{incident.title}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sevBadge}`}>
            {incident.severity}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Incident Header Card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-2xl">{CATEGORY_ICONS[incident.category] || '📌'}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sevBadge}`}>
                  {incident.severity}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                  {incident.status}
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {incident.category}
                </span>
              </div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight">{incident.title}</h1>
              {incident.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{incident.description}</p>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: AlertTriangle, label: 'Reports', value: incident.report_count },
                  { icon: Users, label: 'Affected', value: `~${(incident.affected_population || 0).toLocaleString()}` },
                  { icon: MapPin, label: 'Radius', value: `${(incident.radius_km || 0.3).toFixed(1)} km` },
                  { icon: Clock, label: 'First reported', value: formatDistanceToNow(new Date(incident.first_reported_at || incident.created_at), { addSuffix: true }) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                    <Icon size={13} className="text-indigo-500 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority ring — compact */}
            <div className="flex-shrink-0 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={32} fill="none" stroke="#e5e7eb" strokeWidth={7} />
                  <circle cx={40} cy={40} r={32} fill="none" stroke={sevColor} strokeWidth={7}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32 * (incident.priority_score || 50) / 100} ${2 * Math.PI * 32}`}
                    transform="rotate(-90 40 40)"
                  />
                  <text x={40} y={40} textAnchor="middle" dominantBaseline="middle" fontSize={16} fontWeight={900} fill={sevColor}>{incident.priority_score}</text>
                  <text x={40} y={54} textAnchor="middle" fontSize={8} fill="#9CA3AF" fontWeight={600}>/100</text>
                </svg>
              </div>
              <p className="text-xs font-bold mt-1" style={{ color: sevColor }}>Priority</p>
              <p className="text-[10px] text-gray-400">AI Score</p>
            </div>
          </div>

          {/* Authority + Admin actions */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {incident.assigned_authority && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl px-3 py-2">
                <Building2 size={13} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{incident.assigned_authority}</p>
              </div>
            )}
            {isAdmin && allowedTransitions.length > 0 && (
              <div className="flex gap-2 ml-auto flex-wrap">
                {allowedTransitions.map(newStatus => (
                  <button
                    key={newStatus}
                    onClick={() => handleStatusChange(newStatus)}
                    disabled={statusLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-60 shadow"
                  >
                    {statusLoading ? <Loader size={12} className="animate-spin" /> : null}
                    → {newStatus}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main 2-col layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left col: Lifecycle + Priority Breakdown */}
          <div className="space-y-5">
            <LifecycleTracker status={incident.status} createdAt={incident.created_at} resolvedAt={incident.resolved_at} />
            {scoreBreakdown && <PriorityMeter score={incident.priority_score} breakdown={scoreBreakdown} />}
          </div>

          {/* Right col: Fusion + Recommendations */}
          <div className="lg:col-span-2 space-y-5">
            <FusionExplainer incident={incident} relatedIssues={relatedIssues} explanation={explanation} />
            <RecommendationList recommendations={recommendations} isLoading={recsLoading} />
          </div>
        </div>

        {/* ── Map ── */}
        {incident.lat && incident.lng && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm animate-slide-up">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin size={14} className="text-indigo-500" />
              Geographic Scope
              <span className="ml-auto text-xs text-gray-400">Radius: ~{(incident.radius_km || 0.3).toFixed(1)} km</span>
            </h3>
            <div className="h-56 rounded-xl overflow-hidden">
              <MapContainer center={[incident.lat, incident.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Radius circle */}
                <Circle center={[incident.lat, incident.lng]} radius={(incident.radius_km || 0.3) * 1000}
                  pathOptions={{ color: sevColor, fillColor: sevColor, fillOpacity: 0.08, weight: 2, dashArray: '6 4' }} />
                {/* Incident center */}
                <CircleMarker center={[incident.lat, incident.lng]} radius={12}
                  pathOptions={{ fillColor: sevColor, fillOpacity: 0.9, color: '#fff', weight: 2 }}>
                  <Popup><b>{incident.title}</b></Popup>
                </CircleMarker>
                {/* Related report markers */}
                {relatedIssues.map(r => {
                  const issue = r.issues
                  if (!issue?.lat || !issue?.lng) return null
                  return (
                    <CircleMarker key={r.id || issue.id} center={[issue.lat, issue.lng]} radius={7}
                      pathOptions={{ fillColor: '#6366F1', fillOpacity: 0.7, color: '#fff', weight: 1.5 }}>
                      <Popup><p className="text-xs font-semibold">{issue.title}</p><p className="text-xs text-gray-500">Similarity: {r.similarity_score}%</p></Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* ── Related Reports ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-orange-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Related Citizen Reports</h3>
            <span className="ml-auto text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
              {relatedIssues.length} report{relatedIssues.length !== 1 ? 's' : ''} → 1 Incident
            </span>
          </div>

          {issuesLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : relatedIssues.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No related reports yet.</p>
          ) : (
            <div className="space-y-3">
              {relatedIssues.map((r, idx) => {
                const issue = r.issues
                if (!issue) return null
                const sim = r.similarity_score || 0
                return (
                  <div key={idx} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                    {/* Similarity badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black"
                      style={{ background: sim >= 80 ? '#6366F120' : '#9CA3AF20', color: sim >= 80 ? '#6366F1' : '#6B7280' }}>
                      {sim}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/issues/${issue.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors line-clamp-1">
                        {issue.title}
                      </Link>
                      {issue.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{issue.description}</p>
                      )}
                      <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                        <span>{issue.category}</span>
                        <span>•</span>
                        <span>{issue.severity}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {/* Score breakdown mini */}
                    <div className="flex-shrink-0 text-right text-[10px] text-gray-400 hidden sm:block">
                      {r.semantic_score > 0 && <div>Sem: {r.semantic_score}%</div>}
                      {r.location_score > 0 && <div>Loc: {r.location_score}%</div>}
                      {r.time_score > 0 && <div>Time: {r.time_score}%</div>}
                    </div>
                    {/* Photos */}
                    {Array.isArray(issue.media_urls) && issue.media_urls.length > 0 && (
                      <img src={issue.media_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── AI Disclaimer ── */}
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <Brain size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <strong>AI assists — humans decide.</strong> This incident was identified by CivicMind AI using semantic similarity, geographic proximity, and temporal correlation. All actions require human verification by city administrators and responsible authorities.
          </p>
        </div>
      </div>
    </div>
  )
}
