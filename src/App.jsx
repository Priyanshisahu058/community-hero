import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import MapView from './pages/MapView'
import ReportIssue from './pages/ReportIssue'
import IssueDetail from './pages/IssueDetail'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthorityDashboard from './pages/AuthorityDashboard'
import useAuthStore from './store/authStore'
import EmergencyModal from './components/ui/EmergencyModal'
// ── CivicMind AI pages (QuantumHacks) ──
import CityIntelligence from './pages/CityIntelligence'
import IncidentDetail from './pages/IncidentDetail'
import EvaluationMode from './pages/EvaluationMode'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Guard for routes requiring authentication */
function AuthGuard({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

/** Guard for admin-only routes */
function AdminGuard({ children }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = profile?.role || 'citizen'

  if (role !== 'admin') {
    return <Navigate to={role === 'authority' ? "/authority" : "/"} replace />
  }

  return children
}

/** Guard for authority-only routes */
function AuthorityGuard({ children }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = profile?.role || 'citizen'

  if (role !== 'authority') {
    return <Navigate to={role === 'admin' ? "/admin" : "/"} replace />
  }

  return children
}

function AppRoutes() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/report" element={<AuthGuard><ReportIssue /></AuthGuard>} />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/authority" element={<AuthorityGuard><AuthorityDashboard /></AuthorityGuard>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* ── CivicMind AI routes (QuantumHacks) ── */}
          <Route path="/intelligence" element={<CityIntelligence />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/intelligence/evaluate" element={<EvaluationMode />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#0d9488', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            duration: 5000,
          },
        }}
      />
      <EmergencyModal />
      {/* Global Footer */}
      <footer className="mt-auto py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © 2026 <span className="font-bold text-indigo-600">CivicMind AI</span> — built on Community Hero Foundation
          </p>
          <p className="text-xs text-gray-400">
            Built for{' '}
            <span className="font-semibold text-indigo-600">QuantumHacks 2026</span>
            {' · '}
            <span className="text-teal-600 font-medium">"From citizen reports to city-level intelligence"</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
