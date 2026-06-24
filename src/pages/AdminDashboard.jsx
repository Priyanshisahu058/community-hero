import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAvgSatisfaction } from '../services/feedback'
import useAuthStore from '../store/authStore'
import { fetchIssues } from '../services/issues'
import AdminIssueQueue from '../components/admin/AdminIssueQueue'
import AdminIssueDetail from '../components/admin/AdminIssueDetail'
import { BarChart2, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CATEGORIES, SEVERITIES } from '../utils/constants'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profile, loading } = useAuthStore()
  const [selected, setSelected] = useState(null)
  const [avgSatisfaction, setAvgSatisfaction] = useState(null)

  // Redirect non-admins
  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      navigate('/')
    }
  }, [profile, loading, navigate])

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['admin-issues'],
    queryFn: () => fetchIssues({ limit: 200 }),
    enabled: profile?.role === 'admin',
    refetchInterval: 30000,
  })

  // Sort by severity (Critical first) then AI priority score
  const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  const sorted = [...issues].sort((a, b) => {
    const sevA = SEVERITY_ORDER[a.ai_severity || a.severity] ?? 4
    const sevB = SEVERITY_ORDER[b.ai_severity || b.severity] ?? 4
    if (sevA !== sevB) return sevA - sevB
    return (b.ai_priority_score || 50) - (a.ai_priority_score || 50)
  })

  useEffect(() => {
    fetchAvgSatisfaction().then(setAvgSatisfaction)
  }, [])

  // Stats
  const stats = {
    total: issues.length,
    submitted: issues.filter(i => i.status === 'Submitted').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    critical: issues.filter(i => i.severity === 'Critical').length,
  }

  // Chart data
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage civic issues and community reports</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: 'Total', val: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
            { icon: Clock, label: 'Submitted', val: stats.submitted, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
            { icon: TrendingUp, label: 'In Progress', val: stats.inProgress, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
            { icon: CheckCircle, label: 'Resolved', val: stats.resolved, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
            { icon: AlertCircle, label: 'Critical', val: stats.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100 dark:border-gray-800`}>
              <s.icon size={18} className={`${s.color} mb-1.5`} />
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
          {/* Avg Satisfaction */}
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <span className="text-lg mb-1 block">⭐</span>
            <p className="text-2xl font-black text-amber-600">
              {avgSatisfaction ? avgSatisfaction : '—'}
            </p>
            <p className="text-xs text-gray-500 font-medium">Avg Satisfaction</p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Category Bar Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Issues by Category</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Pie Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Issues by Severity</h3>
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

        {/* Main: Queue + Detail */}
        <div className="flex gap-4">
          {/* Queue */}
          <div className={`flex-shrink-0 ${selected ? 'w-72 xl:w-80' : 'flex-1'} transition-all duration-200`}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Issue Queue <span className="text-gray-400 font-normal">({sorted.length})</span>
              </h2>
              <AdminIssueQueue
                issues={sorted}
                selectedId={selected?.id}
                onSelect={setSelected}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="flex-1 min-w-0 max-h-[calc(100vh-200px)] overflow-hidden animate-slide-up">
              <AdminIssueDetail
                issue={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
