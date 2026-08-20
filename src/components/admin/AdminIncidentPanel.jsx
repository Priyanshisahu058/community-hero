/**
 * AdminIncidentPanel — Admin view of a fused incident.
 * Shows all linked citizen reports, AI analysis, priority breakdown,
 * and allows the admin to Verify, Assign Authority, or Reject.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Brain, CheckCircle2, AlertTriangle, Users, Building2, MapPin, Loader, X, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import {
  fetchIncidentIssues, fetchIncidentRecommendations, fetchIncidentScore,
  fetchAuthorityProfiles, assignIncidentToAuthority, updateIncidentStatus,
  notifyIncidentReporters, sendIncidentNotification
} from '../../services/incidents'
import PriorityMeter from '../incidents/PriorityMeter'
import RecommendationList from '../incidents/RecommendationList'

const SEVERITY_BADGE = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
}

export default function AdminIncidentPanel({ incident, onClose }) {
  const qc = useQueryClient()
  const [assigning, setAssigning] = useState(false)
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('')
  const [working, setWorking] = useState(false)

  const { data: relatedIssues = [] } = useQuery({
    queryKey: ['incident-issues', incident.id],
    queryFn: () => fetchIncidentIssues(incident.id),
  })

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ['incident-recommendations', incident.id],
    queryFn: () => fetchIncidentRecommendations(incident.id),
  })

  const { data: scoreBreakdown } = useQuery({
    queryKey: ['incident-score', incident.id],
    queryFn: () => fetchIncidentScore(incident.id),
  })

  const { data: authorityProfiles = [] } = useQuery({
    queryKey: ['authority-profiles'],
    queryFn: fetchAuthorityProfiles,
    staleTime: 60000,
  })

  const handleVerify = async () => {
    setWorking(true)
    try {
      await updateIncidentStatus(incident.id, 'Verified')
      await notifyIncidentReporters(
        incident.id,
        'incident_verified',
        `✅ Your report about "${incident.title}" has been verified by our admin team.`
      )
      toast.success('Incident verified')
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    } catch { toast.error('Verification failed') }
    finally { setWorking(false) }
  }

  const handleAssign = async () => {
    if (!selectedAuthorityId) { toast.error('Select an authority first'); return }
    const authority = authorityProfiles.find(a => a.id === selectedAuthorityId)
    if (!authority) return
    setWorking(true)
    try {
      await assignIncidentToAuthority(incident.id, authority.id, authority.name || authority.email)
      // Notify authority
      await sendIncidentNotification(
        authority.id,
        'incident_assigned',
        `📋 A new incident has been assigned to you: "${incident.title}" (Priority: ${incident.priority_score}/100)`
      )
      // Notify citizens
      await notifyIncidentReporters(
        incident.id,
        'incident_assigned',
        `🏛️ Your report about "${incident.title}" has been assigned to ${authority.name || 'the relevant authority'} for resolution.`
      )
      toast.success(`Assigned to ${authority.name || authority.email}`)
      setAssigning(false)
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['incident-stats'] })
    } catch { toast.error('Assignment failed') }
    finally { setWorking(false) }
  }

  const handleReject = async () => {
    setWorking(true)
    try {
      await updateIncidentStatus(incident.id, 'Monitoring')
      toast.success('Incident moved to Monitoring')
      qc.invalidateQueries({ queryKey: ['incidents'] })
    } catch { toast.error('Failed') }
    finally { setWorking(false) }
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
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {incident.category}
            </span>
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{incident.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Priority {incident.priority_score}/100 · {incident.report_count} report{incident.report_count !== 1 ? 's' : ''} · AI confidence {incident.ai_confidence}%</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Admin action buttons */}
        <div className="flex flex-wrap gap-2">
          {incident.status === 'Emerging' && (
            <button
              onClick={handleVerify}
              disabled={working}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-all shadow disabled:opacity-60"
            >
              {working ? <Loader size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Verify Incident
            </button>
          )}
          {['Emerging', 'Verified'].includes(incident.status) && (
            <button
              onClick={() => setAssigning(a => !a)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow"
            >
              <Building2 size={14} />
              Assign Authority
              <ChevronDown size={12} className={`transition-transform ${assigning ? 'rotate-180' : ''}`} />
            </button>
          )}
          {['Emerging', 'Verified'].includes(incident.status) && (
            <button
              onClick={handleReject}
              disabled={working}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              <AlertTriangle size={14} />
              Monitor
            </button>
          )}
        </div>

        {/* Authority assignment dropdown */}
        {assigning && (
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 animate-fade-in">
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3">Assign to Authority</p>
            {authorityProfiles.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">No authority accounts found.</p>
                <p className="text-xs text-gray-500 mt-1">
                  Run: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">UPDATE profiles SET role = 'authority' WHERE email = '...'</code>
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedAuthorityId}
                  onChange={e => setSelectedAuthorityId(e.target.value)}
                  className="flex-1 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select authority...</option>
                  {authorityProfiles.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.email} {a.ward ? `(${a.ward})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={working || !selectedAuthorityId}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all"
                >
                  {working ? <Loader size={14} className="animate-spin" /> : 'Assign'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Reports', value: incident.report_count },
            { label: 'AI Confidence', value: `${incident.ai_confidence}%` },
            { label: 'Affected', value: `~${(incident.affected_population || 0).toLocaleString()}` },
            { label: 'Radius', value: `${(incident.radius_km || 0.3).toFixed(1)} km` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">
              <p className="text-base font-black text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Priority breakdown */}
        {scoreBreakdown && (
          <PriorityMeter score={incident.priority_score} breakdown={scoreBreakdown} />
        )}

        {/* AI Fusion Reasoning */}
        {incident.ai_fusion_reasoning && (
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Brain size={12} /> AI Fusion Reasoning
            </p>
            <p className="text-xs text-purple-800 dark:text-purple-300 italic leading-relaxed">
              "{incident.ai_fusion_reasoning}"
            </p>
          </div>
        )}

        {/* Linked citizen reports */}
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Linked Citizen Reports ({relatedIssues.length})
          </p>
          {relatedIssues.length === 0 ? (
            <p className="text-xs text-gray-400">No reports linked yet.</p>
          ) : (
            <div className="space-y-2">
              {relatedIssues.map((r, idx) => {
                const issue = r.issues
                if (!issue) return null
                return (
                  <div key={idx} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-black text-indigo-600">
                      {r.similarity_score}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{issue.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{issue.description}</p>
                      {issue.ai_reasoning && (
                        <p className="text-[10px] text-purple-500 italic mt-0.5 line-clamp-1">AI: {issue.ai_reasoning}</p>
                      )}
                      <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                        <span>{issue.category}</span> · <span>{issue.severity}</span> · <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {Array.isArray(issue.media_urls) && issue.media_urls.length > 0 && (
                      <img src={issue.media_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <RecommendationList recommendations={recommendations} isLoading={recsLoading} />

        {/* Current authority */}
        {incident.assigned_authority && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
            <Building2 size={14} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-500 font-medium">Assigned Authority</p>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300">{incident.assigned_authority}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
