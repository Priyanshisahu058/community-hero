import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2, CheckCircle2, Clock, AlertTriangle, Upload,
  ChevronRight, Loader, MapPin, Users, Zap, ArrowRight, Brain, RefreshCw
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet'
import useAuthStore from '../store/authStore'
import {
  fetchAssignedIncidents, fetchIncidentIssues, fetchIncidentRecommendations,
  authorityUpdateIncident, notifyIncidentReporters
} from '../services/incidents'
import { uploadResolutionProof } from '../services/issues'
import LifecycleTracker from '../components/incidents/LifecycleTracker'
import RecommendationList from '../components/incidents/RecommendationList'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

const SEVERITY_COLORS = { Critical: '#DC2626', High: '#D97706', Medium: '#CA8A04', Low: '#16A34A' }
const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200',
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200',
}
const STATUS_TRANSITIONS = {
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Monitoring: ['Resolved'],
}

// ─── Incident Detail Panel ────────────────────────────────────────────────────
function IncidentPanel({ incident, onClose, onUpdated }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [proofFiles, setProofFiles] = useState([])
  const [proofNote, setProofNote] = useState('')
  const [proofUploaded, setProofUploaded] = useState(false)
  const [working, setWorking] = useState(false)

  const { data: relatedIssues = [] } = useQuery({
    queryKey: ['incident-issues', incident.id],
    queryFn: () => fetchIncidentIssues(incident.id),
  })

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ['incident-recommendations', incident.id],
    queryFn: () => fetchIncidentRecommendations(incident.id),
  })

  const nextStatuses = STATUS_TRANSITIONS[incident.status] || []
  const sevColor = SEVERITY_COLORS[incident.severity] || '#CA8A04'

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Resolved' && !proofUploaded) {
      toast.error('Upload resolution proof before marking as Resolved')
      return
    }
    setWorking(true)
    try {
      await authorityUpdateIncident(incident.id, { status: newStatus })
      if (newStatus === 'Resolved') {
        await notifyIncidentReporters(
          incident.id,
          'incident_resolved',
          `✅ The civic incident "${incident.title}" has been resolved by the assigned authority.`
        )
      }
      toast.success(`Status updated to ${newStatus}`)
      qc.invalidateQueries({ queryKey: ['assigned-incidents'] })
      onUpdated?.()
    } catch (err) {
      toast.error('Failed to update — check your permissions')
      console.error(err)
    } finally {
      setWorking(false)
    }
  }

  const handleProofUpload = async () => {
    if (!proofFiles.length) { toast.error('Select at least one proof photo'); return }
    setWorking(true)
    try {
      // Upload proof photo as resolution_proof for each linked issue
      if (relatedIssues.length > 0) {
        const firstIssue = relatedIssues[0]?.issues
        if (firstIssue?.id) {
          await uploadResolutionProof(firstIssue.id, user.id, proofFiles, proofNote)
        }
      }
      // Also update resolution_note on the incident
      await authorityUpdateIncident(incident.id, {
        status: incident.status === 'In Progress' ? 'In Progress' : incident.status,
        resolution_note: proofNote || 'Resolution proof uploaded by authority.',
      })
      setProofUploaded(true)
      setProofFiles([])
      toast.success(`📸 Proof uploaded! You can now mark as Resolved.`)
      qc.invalidateQueries({ queryKey: ['assigned-incidents'] })
    } catch (err) {
      toast.error('Proof upload failed')
      console.error(err)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${SEVERITY_BADGE[incident.severity] || SEVERITY_BADGE.Medium}`}>
              {incident.severity}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
              {incident.status}
            </span>
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{incident.title}</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        )}
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Priority', value: `${incident.priority_score}/100`, color: sevColor },
            { label: 'Reports', value: incident.report_count },
            { label: 'Affected', value: `~${(incident.affected_population || 0).toLocaleString()}` },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black" style={color ? { color } : {}}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Location */}
        {incident.address && (
          <div className="flex items-start gap-2">
            <MapPin size={13} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400">{incident.address}</p>
          </div>
        )}

        {/* Lifecycle */}
        <LifecycleTracker
          status={incident.status}
          createdAt={incident.created_at}
          resolvedAt={incident.resolved_at}
        />

        {/* Map */}
        {incident.lat && incident.lng && (
          <div className="rounded-xl overflow-hidden h-40 border border-gray-100 dark:border-gray-800">
            <MapContainer center={[incident.lat, incident.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Circle
                center={[incident.lat, incident.lng]}
                radius={(incident.radius_km || 0.3) * 1000}
                pathOptions={{ color: sevColor, fillColor: sevColor, fillOpacity: 0.1, weight: 2 }}
              />
              <CircleMarker center={[incident.lat, incident.lng]} radius={10}
                pathOptions={{ fillColor: sevColor, fillOpacity: 0.9, color: '#fff', weight: 2 }}>
                <Popup>{incident.title}</Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        )}

        {/* Citizen reports */}
        {relatedIssues.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Citizen Reports ({relatedIssues.length})
            </p>
            <div className="space-y-2">
              {relatedIssues.slice(0, 5).map((r, i) => {
                const issue = r.issues
                if (!issue) return null
                return (
                  <div key={i} className="flex gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                    <span className="text-xs text-indigo-600 font-bold flex-shrink-0 mt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{issue.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{issue.description}</p>
                      {Array.isArray(issue.media_urls) && issue.media_urls.length > 0 && (
                        <img src={issue.media_urls[0]} alt="" className="w-16 h-10 object-cover rounded-lg mt-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-indigo-500 font-bold flex-shrink-0">{r.similarity_score}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <RecommendationList recommendations={recommendations} isLoading={recsLoading} />

        {/* AI Reasoning */}
        {incident.ai_fusion_reasoning && (
          <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
              <Brain size={11} /> AI Fusion Reasoning
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 italic leading-relaxed">
              "{incident.ai_fusion_reasoning}"
            </p>
          </div>
        )}

        {/* Status actions */}
        {nextStatuses.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map(ns => (
                <button
                  key={ns}
                  onClick={() => handleStatusChange(ns)}
                  disabled={working || (ns === 'Resolved' && !proofUploaded)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                    ns === 'Resolved'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {working ? <Loader size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {ns}
                  {ns === 'Resolved' && !proofUploaded && ' 🔒'}
                </button>
              ))}
            </div>
            {nextStatuses.includes('Resolved') && !proofUploaded && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <AlertTriangle size={11} /> Upload proof photo below before marking Resolved
              </p>
            )}
          </div>
        )}

        {/* Resolution proof upload */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
            <Upload size={14} /> Upload Resolution Proof
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setProofFiles([...e.target.files])}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200 mb-2"
          />
          <textarea
            value={proofNote}
            onChange={e => setProofNote(e.target.value)}
            placeholder="Describe what was fixed (seen by citizens)..."
            rows={2}
            className="w-full border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <button
            onClick={handleProofUpload}
            disabled={working || proofFiles.length === 0}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {working ? 'Uploading...' : `Upload${proofFiles.length > 0 ? ` (${proofFiles.length} file${proofFiles.length > 1 ? 's' : ''})` : ' Proof'}`}
          </button>
          {proofUploaded && (
            <p className="text-xs text-green-700 dark:text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> Proof uploaded — you can now mark as Resolved
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Authority Dashboard ─────────────────────────────────────────────────
export default function AuthorityDashboard() {
  const navigate = useNavigate()
  const { profile, loading } = useAuthStore()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['assigned-incidents', profile?.id],
    queryFn: () => fetchAssignedIncidents(profile.id),
    enabled: !!profile?.id && profile?.role === 'authority',
    staleTime: 30000,
  })

  if (loading || !profile || profile.role !== 'authority') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = {
    assigned: incidents.filter(i => i.status === 'Assigned').length,
    inProgress: incidents.filter(i => i.status === 'In Progress').length,
    critical: incidents.filter(i => i.severity === 'Critical').length,
    total: incidents.length,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 py-7 px-4">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Authority Dashboard</h1>
                <p className="text-blue-300 text-xs">Welcome, {profile.name || profile.email}</p>
              </div>
            </div>
            <p className="text-blue-200/80 text-sm">
              Your assigned incidents — resolve them and notify citizens.
            </p>
          </div>
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Assigned', value: stats.total, icon: Building2, color: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
            { label: 'Pending Start', value: stats.assigned, icon: Clock, color: '#D97706', bg: 'bg-orange-50 dark:bg-orange-900/10' },
            { label: 'In Progress', value: stats.inProgress, icon: Zap, color: '#0EA5E9', bg: 'bg-sky-50 dark:bg-sky-900/10' },
            { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: '#DC2626', bg: 'bg-red-50 dark:bg-red-900/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 border border-white/20`}>
              <Icon size={18} style={{ color }} className="mb-1.5" />
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Main: Queue + Detail */}
        <div className="flex gap-4">
          {/* Incident queue */}
          <div className={`flex-shrink-0 ${selected ? 'w-72 xl:w-80' : 'flex-1'} transition-all duration-200`}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                Assigned Incidents <span className="text-gray-400 font-normal">({incidents.length})</span>
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-shimmer" />)}
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">All clear!</p>
                  <p className="text-xs text-gray-400 mt-1">No active incidents assigned to you.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map(inc => {
                    const sevColor = SEVERITY_COLORS[inc.severity] || '#CA8A04'
                    const isSelected = selected?.id === inc.id
                    return (
                      <button
                        key={inc.id}
                        onClick={() => setSelected(isSelected ? null : inc)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Priority ring */}
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                            style={{ background: sevColor + '15', color: sevColor, border: `2px solid ${sevColor}30` }}>
                            {inc.priority_score}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">{inc.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${SEVERITY_BADGE[inc.severity] || SEVERITY_BADGE.Medium}`}>
                                {inc.severity}
                              </span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{inc.status}</span>
                              <span className="text-[10px] text-gray-400">{inc.report_count} report{inc.report_count !== 1 ? 's' : ''}</span>
                            </div>
                            {inc.address && (
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 flex items-center gap-0.5">
                                <MapPin size={9} /> {inc.address}
                              </p>
                            )}
                          </div>
                          <ChevronRight size={14} className={`text-gray-400 flex-shrink-0 mt-1 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="flex-1 min-w-0 max-h-[calc(100vh-200px)] overflow-hidden animate-slide-up">
              <IncidentPanel
                incident={selected}
                onClose={() => setSelected(null)}
                onUpdated={() => refetch()}
              />
            </div>
          )}
        </div>

        {/* AI disclaimer */}
        <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
          <Brain size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-gray-600 dark:text-gray-300">AI assists — you decide.</strong>{' '}
            Incidents and recommendations were identified by CivicMind AI. Your field judgment governs all actions.
          </span>
        </div>
      </div>
    </div>
  )
}
