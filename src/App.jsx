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
import useAuthStore from './store/authStore'
import EmergencyModal from './components/ui/EmergencyModal'

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

/** Guard for admin-only routes — redirects with toast if not admin */
function AdminGuard({ children }) {
  const { user, profile, loading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'admin') {
      toast.error('Access denied — Admins only', { icon: '🚫' })
      navigate('/', { replace: true })
    }
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [loading, user, profile, navigate])

  if (loading || !profile) return null
  if (profile.role !== 'admin') return null
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      <footer className="mt-auto py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <p className="text-center text-xs text-gray-400">
          © 2026 CivicEye. Built for{' '}
          <span className="font-semibold text-teal-600">BlockseBlock Hackathon</span>.
        </p>
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
