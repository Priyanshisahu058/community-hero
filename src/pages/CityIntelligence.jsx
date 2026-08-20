import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Brain, AlertTriangle, CheckCircle2, TrendingUp, Users, Map, LayoutGrid, RefreshCw, Zap, Filter, Play } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import IncidentCard from '../components/incidents/IncidentCard'
import IncidentMap from '../components/incidents/IncidentMap'
import { fetchIncidents, fetchIncidentStats } from '../services/incidents'
import { runBatchFusion } from '../services/incidentFusion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const SEVERITY_COLORS = { Critical: '#DC2626', High: '#D97706', Medium: '#CA8A04', Low: '#16A34A' }
const CATEGORY_ICONS = { Roads: '🛣️', Water: '💧', Electricity: '⚡', Sanitation: '🗑️', Encroachment: '🚧', Other: '📌' }
const STATUS_FILTERS = ['All', 'Emerging', 'Verified', 'Assigned', 'In Progress', 'Resolved']
const SEVERITY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low']

function StatCard({ label, value, icon: Icon, color, bg, sublabel, animate, pulse }) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-white/20 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pulse ? 'animate-pulse-ring' : ''}`} style={{ background: color + '22' }}>
          <Icon size={18} style={{ color }} />
        </div>
        {pulse && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />}
      </div>
      <p className={`text-3xl font-black ${animate ? 'animate-count' : ''}`} style={{ color }}>{value}</p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function SkeletonCard() {
  return <div className="rounded-2xl h-36 animate-shimmer" />
}

export default function CityIntelligence() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [view, setView] = useState('list')
  const [statusFilter, setStatusFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [fusionRunning, setFusionRunning] = useState(false)
  const [fusionProgress, setFusionProgress] = useState(null)

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['incidents', statusFilter, severityFilter],
    queryFn: () => fetchIncidents({ status: statusFilter, severity: severityFilter, limit: 100 }),
    staleTime: 30000,
  })

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['incident-stats'],
    queryFn: fetchIncidentStats,
    staleTime: 30000,
  })

  // Chart data
  const categoryData = useMemo(() => {
    const counts = {}
    incidents.forEach(inc => { counts[inc.category] = (counts[inc.category] || 0) + 1 })
    return Object.entries(counts).map(([cat, count]) => ({
      name: CATEGORY_ICONS[cat] + ' ' + cat, count, cat,
    })).sort((a, b) => b.count - a.count)
  }, [incidents])

  const severityData = useMemo(() => (
    Object.entries(SEVERITY_COLORS).map(([sev, color]) => ({
      name: sev, value: incidents.filter(i => i.severity === sev).length, color,
    })).filter(d => d.value > 0)
  ), [incidents])

  const handleRunFusion = async () => {
    if (fusionRunning) return
    setFusionRunning(true)
    setFusionProgress({ processed: 0, total: 0 })
    toast.loading('Running AI Incident Fusion...', { id: 'fusion' })
    try {
      const result = await runBatchFusion((processed, total) => {
        setFusionProgress({ processed, total })
      })
      toast.success(
        `Fusion complete! ${result.incidentsCreated} incidents created, ${result.reportsLinked} reports linked.`,
        { id: 'fusion', duration: 5000 }
      )
      refetch()
      refetchStats()
    } catch (err) {
      toast.error('Fusion failed — check console', { id: 'fusion' })
    } finally {
      setFusionRunning(false)
      setFusionProgress(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.3) 0%, transparent 50%)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ai-glow">
                  <Brain size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">City Intelligence</h1>
                  <p className="text-indigo-300 text-sm">AI-powered understanding of what is happening across your city</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs bg-white/10 text-indigo-200 px-3 py-1 rounded-full font-medium">
                  🧠 CivicMind AI
                </span>
                <span className="text-xs bg-white/10 text-indigo-200 px-3 py-1 rounded-full font-medium">
                  From citizen reports to city-level intelligence
                </span>
              </div>
            </div>

            {/* Run Fusion Button */}
            {profile?.role === 'admin' && (
              <button
                id="run-fusion-btn"
                onClick={handleRunFusion}
                disabled={fusionRunning}
                className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 font-bold text-sm rounded-2xl hover:bg-indigo-50 transition-all shadow-xl disabled:opacity-60 flex-shrink-0"
              >
                {fusionRunning ? (
                  <><RefreshCw size={16} className="animate-spin" /> Running Fusion…</>
                ) : (
                  <><Play size={16} /> Run AI Fusion</>
                )}
              </button>
            )}
          </div>

          {/* Fusion progress */}
          {fusionProgress && (
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <div className="flex justify-between text-xs text-indigo-200 mb-1">
                <span>Processing reports…</span>
                <span>{fusionProgress.processed}/{fusionProgress.total}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: fusionProgress.total > 0 ? `${(fusionProgress.processed / fusionProgress.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="Active Incidents" value={stats?.active ?? '—'} icon={TrendingUp} color="#6366F1" bg="bg-indigo-50 dark:bg-indigo-900/10" animate pulse />
          <StatCard label="Critical" value={stats?.critical ?? '—'} icon={AlertTriangle} color="#DC2626" bg="bg-red-50 dark:bg-red-900/10" animate pulse={stats?.critical > 0} />
          <StatCard label="Emerging" value={stats?.emerging ?? '—'} icon={Zap} color="#8B5CF6" bg="bg-purple-50 dark:bg-purple-900/10" animate />
          <StatCard label="Resolved" value={stats?.resolved ?? '—'} icon={CheckCircle2} color="#10B981" bg="bg-green-50 dark:bg-green-900/10" animate />
          <StatCard label="Reports Fused" value={stats?.totalReports ?? '—'} icon={Brain} color="#0EA5E9" bg="bg-sky-50 dark:bg-sky-900/10" animate sublabel="citizen reports" />
          <StatCard label="Affected Citizens" value={stats?.affectedPopulation ? `~${(stats.affectedPopulation / 1000).toFixed(0)}K` : '—'} icon={Users} color="#F59E0B" bg="bg-amber-50 dark:bg-amber-900/10" animate />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Category chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Incidents by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">No incidents yet — run AI Fusion</div>
            )}
          </div>

          {/* Severity pie */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Severity Distribution</h3>
            {severityData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                      {severityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {severityData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{d.name}:</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet</div>
            )}
          </div>
        </div>

        {/* ── Filters + View Toggle ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
            {SEVERITY_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  severityFilter === s ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="ml-auto flex gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
            >
              <LayoutGrid size={13} /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'map' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
            >
              <Map size={13} /> Map
            </button>
          </div>
        </div>

        {/* ── Result count ── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">{incidents.length}</span> incident{incidents.length !== 1 ? 's' : ''} found
          </p>
          <button onClick={() => { refetch(); refetchStats() }} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* ── Map view ── */}
        {view === 'map' && (
          <div className="animate-fade-in mb-6">
            <IncidentMap incidents={incidents} height="calc(100vh - 280px)" />
          </div>
        )}

        {/* ── List view ── */}
        {view === 'list' && (
          <div className="animate-fade-in">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                  <Brain size={36} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No incidents yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Submit citizen reports and run AI Fusion to identify city-level incidents.
                </p>
                {profile?.role === 'admin' && (
                  <button
                    onClick={handleRunFusion}
                    disabled={fusionRunning}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    <Play size={16} /> Run AI Fusion Now
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {incidents.map((inc, idx) => (
                  <IncidentCard key={inc.id} incident={inc} rank={idx + 1} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Evaluate link ── */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Want to see the AI Incident Fusion in action with demo data?</p>
          <button
            onClick={() => navigate('/intelligence/evaluate')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <Zap size={15} /> Open Evaluation Mode
          </button>
        </div>
      </div>
    </div>
  )
}
