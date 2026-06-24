import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, Map, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { useIssues } from '../hooks/useIssues'
import IssueCard from '../components/issues/IssueCard'
import IssueMap from '../components/map/IssueMap'
import Sidebar from '../components/layout/Sidebar'
import Leaderboard from '../components/gamification/Leaderboard'

const DEFAULT_FILTERS = { category: 'All', status: 'All', severity: 'All' }

// Skeleton card
function IssueCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200 dark:bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-16" />
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [view, setView] = useState('feed') // 'feed' | 'map'
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fabBounced, setFabBounced] = useState(false)

  // Bounce the FAB once on first render to draw attention
  useEffect(() => {
    const t = setTimeout(() => setFabBounced(true), 500)
    return () => clearTimeout(t)
  }, [])

  const queryFilters = useMemo(() => ({
    category: filters.category !== 'All' ? filters.category : undefined,
    status: filters.status !== 'All' ? filters.status : undefined,
    limit: 50,
  }), [filters.category, filters.status])

  const { data: issues = [], isLoading, isError, refetch } = useIssues(queryFilters)

  // Client-side search + severity filter
  const filtered = useMemo(() => {
    let list = issues
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.address?.toLowerCase().includes(q))
    }
    if (filters.severity !== 'All') {
      list = list.filter(i => i.severity === filters.severity)
    }
    return list
  }, [issues, search, filters.severity])

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const handleFilterReset = () => setFilters(DEFAULT_FILTERS)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-700 dark:to-teal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              See a problem? Report it now.
            </h2>
            <p className="text-teal-100 text-sm mt-1">
              Help make your city better — takes less than 60 seconds
            </p>
          </div>
          <button
            id="hero-report-btn"
            onClick={() => navigate('/report')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-white text-teal-700 font-black text-sm rounded-2xl hover:bg-teal-50 active:scale-95 transition-all duration-200 shadow-xl shadow-teal-900/30 flex-shrink-0"
          >
            <Plus size={18} strokeWidth={2.5} />
            Report Issue
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Search Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="home-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search issues by title, area, or address..."
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              />
            </div>
            {/* View Toggle */}
            <div className="flex gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
              <button
                id="feed-view-btn"
                onClick={() => setView('feed')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  view === 'feed' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <LayoutGrid size={16} /> Feed
              </button>
              <button
                id="map-view-btn"
                onClick={() => setView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  view === 'map' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Map size={16} /> Map
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Sidebar - desktop always visible */}
          <div className="hidden lg:block">
            <Sidebar filters={filters} onChange={handleFilterChange} onReset={handleFilterReset} />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Stats row */}
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span>
              {filtered.length !== 1 ? 'issues' : 'issue'}
              {search && <span>matching "<span className="text-teal-600">{search}</span>"</span>}
            </div>

            {/* Map view */}
            {view === 'map' && (
              <div className="relative">
                <IssueMap issues={filtered} height="calc(100vh - 220px)" />
              </div>
            )}

            {/* Feed view */}
            {view === 'feed' && (
              <>
                {isError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start gap-3 mb-4">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load issues</p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">Check your Supabase configuration in .env</p>
                    </div>
                    <button onClick={refetch} className="ml-auto p-2 text-red-500 hover:text-red-700">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                )}

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1,2,3,4,5,6].map(i => <IssueCardSkeleton key={i} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 px-6">
                    <div className="w-full max-w-sm bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 text-center shadow-2xl shadow-teal-600/30">
                      <div className="text-5xl mb-4">{search ? '🔍' : '🏘️'}</div>
                      <h3 className="text-lg font-black text-white mb-2">
                        {search ? 'No matching issues' : 'No issues found here.'}
                      </h3>
                      <p className="text-teal-100 text-sm mb-6 leading-relaxed">
                        {search
                          ? 'Try a different search term or clear the filter.'
                          : 'Be the first to report one!'}
                      </p>
                      <button
                        id="empty-state-report-btn"
                        onClick={() => navigate('/report')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-teal-700 font-black text-sm rounded-2xl hover:bg-teal-50 active:scale-95 transition-all duration-200 shadow-lg"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                        + Report Issue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {filtered.map(issue => <IssueCard key={issue.id} issue={issue} />)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right sidebar - leaderboard (desktop) */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* FAB - Report Issue (larger, glow, tooltip, bounce-once on load) */}
      <div className="fixed bottom-6 right-6 z-30 group">
        <button
          id="report-fab-btn"
          onClick={() => navigate('/report')}
          className={`btn-glow flex items-center gap-2.5 px-5 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-2xl shadow-teal-600/50 hover:shadow-teal-600/70 hover:-translate-y-1 transition-all duration-200 ${fabBounced ? 'animate-bounce-once' : ''}`}
        >
          <Plus size={22} strokeWidth={2.5} />
          <span className="hidden sm:block text-sm">Report Issue</span>
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2.5 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
          Report a civic issue
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      </div>
    </div>
  )
}
