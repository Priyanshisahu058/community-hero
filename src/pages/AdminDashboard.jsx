import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAvgSatisfaction } from '../services/feedback'
import useAuthStore from '../store/authStore'
import { fetchIssues } from '../services/issues'
import { fetchIncidents, fetchIncidentStats } from '../services/incidents'
import AdminIssueQueue from '../components/admin/AdminIssueQueue'
import AdminIssueDetail from '../components/admin/AdminIssueDetail'
import AdminIncidentPanel from '../components/admin/AdminIncidentPanel'
import IncidentCard from '../components/incidents/IncidentCard'
import { BarChart2, TrendingUp, AlertCircle, CheckCircle, Clock, Brain, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CATEGORIES, SEVERITIES } from '../utils/constants'

const TABS = [
  { id: 'incidents', label: 'Incidents', icon: Brain },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profile, loading } = useAuthStore()
  const [activeTab, setActiveTab] = useState('incidents')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [avgSatisfaction, setAvgSatisfaction] = useState(null)

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      if (profile?.role === 'authority') {
        navigate('/authority', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [profile, loading, navigate])

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ['admin-issues'],
    queryFn: () => fetchIssues({ limit: 200 }),
    enabled: profile?.role === 'admin',
    refetchInterval: 30000,
  })

  const { data: incidents = [], isLoading: incidentsLoading, refetch: refetchIncidents } = useQuery({
    queryKey: ['incidents', 'All', 'All'],
    queryFn: () => fetchIncidents({ status: 'All', severity: 'All', limit: 100 }),
    enabled: profile?.role === 'admin',
    staleTime: 30000,
  })

  const { data: incidentStats } = useQuery({
    queryKey: ['incident-stats'],
    queryFn: fetchIncidentStats,
    enabled: profile?.role === 'admin',
    staleTime: 30000,
  })

  const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  const sortedIssues = [...issues].sort((a, b) => {
    const sA = SEVERITY_ORDER[a.ai_severity || a.severity] ?? 4
    const sB = SEVERITY_ORDER[b.ai_severity || b.severity] ?? 4
    if (sA !== sB) return sA - sB
    return (b.ai_priority_score || 50) - (a.ai_priority_score || 50)
  })

  useEffect(() => { fetchAvgSatisfaction().then(setAvgSatisfaction) }, [])

  const issueStats = {
    total: issues.length,
    submitted: issues.filter(i => i.status === 'Submitted').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    critical: issues.filter(i => i.severity === 'Critical').length,
  }

  const categoryData = CATEGORIES.map(cat => ({
    name: cat.label,
    count: issues.filter(i => i.category === cat.value).length,
  })).filter(d => d.count > 0)

  const severityData = SEVERITIES.map(sv => ({
    name: sv.label,
    value: issues.filter(i => i.severity === sv.value).length,
    color: sv.mapColor,
  })).filter(d => d.value > 0)

  if (loading || profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={24} className="text-teal-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Verify incidents · Assign authorities · Manage reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedIssue(null); setSelectedIncident(null) }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? tab.id === 'incidents'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-teal-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.id === 'incidents' && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
                  {incidentStats?.active ?? incidents.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── INCIDENTS TAB ── */}
        {activeTab === 'incidents' && (
          <>
            {/* Incident stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Active', val: incidentStats?.active ?? '—', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
                { label: 'Emerging', val: incidentStats?.emerging ?? '—', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/10' },
                { label: 'Critical', val: incidentStats?.critical ?? '—', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10' },
                { label: 'Resolved', val: incidentStats?.resolved ?? '—', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
                { label: 'Reports Fused', val: incidentStats?.totalReports ?? '—', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/10' },
                { label: 'Avg Satisfaction', val: avgSatisfaction ?? '—', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100 dark:border-gray-800`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Incidents queue + detail */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 ${selectedIncident ? 'w-80 xl:w-96' : 'flex-1'} transition-all duration-200`}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Brain size={15} className="text-indigo-500" />
                    Incident Queue <span className="text-gray-400 font-normal">({incidents.length})</span>
                  </h2>
                  <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                    {incidentsLoading ? (
                      [1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl animate-shimmer" />)
                    ) : incidents.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Brain size={40} className="mx-auto mb-3 text-indigo-300" />
                        <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm">No incidents yet</p>
                        <p className="text-xs mt-1">Submit reports and run AI Fusion from the City Intelligence page.</p>
                      </div>
                    ) : incidents.map(inc => (
                      <button
                        key={inc.id}
                        onClick={() => setSelectedIncident(selectedIncident?.id === inc.id ? null : inc)}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${
                          selectedIncident?.id === inc.id
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{
                              background: inc.severity === 'Critical' ? '#DC262615' : inc.severity === 'High' ? '#D9770615' : '#CA8A0415',
                              color: inc.severity === 'Critical' ? '#DC2626' : inc.severity === 'High' ? '#D97706' : '#CA8A04',
                            }}>
                            {inc.priority_score}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">{inc.title}</p>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium">{inc.status}</span>
                              <span className="text-[10px] text-gray-400">{inc.report_count} report{inc.report_count !== 1 ? 's' : ''}</span>
                              <span className="text-[10px] text-gray-400">AI {inc.ai_confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedIncident && (
                <div className="flex-1 min-w-0 max-h-[calc(100vh-200px)] overflow-hidden animate-slide-up">
                  <AdminIncidentPanel
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Total', val: issueStats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                { label: 'Submitted', val: issueStats.submitted, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
                { label: 'In Progress', val: issueStats.inProgress, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                { label: 'Resolved', val: issueStats.resolved, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
                { label: 'Critical', val: issueStats.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100 dark:border-gray-800`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                </div>
              ))}
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <p className="text-2xl font-black text-amber-600">{avgSatisfaction ?? '—'}</p>
                <p className="text-xs text-gray-500 font-medium">Avg Satisfaction</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Reports by Category</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Reports by Severity</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {severityData.map(d => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-600 dark:text-gray-400">{d.name}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Queue + Detail */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 ${selectedIssue ? 'w-72 xl:w-80' : 'flex-1'} transition-all duration-200`}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Issue Queue <span className="text-gray-400 font-normal">({sortedIssues.length})</span>
                  </h2>
                  <AdminIssueQueue
                    issues={sortedIssues}
                    selectedId={selectedIssue?.id}
                    onSelect={setSelectedIssue}
                    isLoading={issuesLoading}
                  />
                </div>
              </div>
              {selectedIssue && (
                <div className="flex-1 min-w-0 max-h-[calc(100vh-200px)] overflow-hidden animate-slide-up">
                  <AdminIssueDetail issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
