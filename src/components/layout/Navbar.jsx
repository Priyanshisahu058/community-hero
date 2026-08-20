import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Eye, LogOut, User, BarChart2, MapPin, Plus, Brain, Building2 } from 'lucide-react'
import NotificationBell from './NotificationBell'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, profile, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
    setMobileOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Feed' },
    { to: '/map', label: 'Map', icon: <MapPin size={14} /> },
    { to: '/intelligence', label: 'City Intelligence', icon: <Brain size={14} />, ai: true },
    { to: '/report', label: 'Report Issue', highlight: true },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <Eye size={28} strokeWidth={2} className="text-teal-600 group-hover:text-teal-500 transition-colors duration-200" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span style={{ color: '#0F766E' }}>Civic</span><span className="text-gray-900 dark:text-white">Eye</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  link.highlight
                    ? 'btn-glow px-6 py-2.5 bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/30 font-semibold'
                    : link.ai
                    ? isActive(link.to)
                      ? 'px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold'
                    : isActive(link.to)
                    ? 'px-4 py-2 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                    : 'px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.highlight ? <Plus size={16} strokeWidth={2.5} /> : link.icon}
                {link.label}
                {link.ai && <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold tracking-wide">AI</span>}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 ring-1 ring-teal-200 dark:ring-teal-800'
                }`}
              >
                <BarChart2 size={14} />
                Admin Dashboard
              </Link>
            )}
            {profile?.role === 'authority' && (
              <Link
                to="/authority"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/authority')
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800'
                }`}
              >
                <Building2 size={14} />
                Authority Dashboard
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">
                      {profile?.name || 'User'}
                    </p>
                    <p className="text-xs text-teal-600 font-medium">{profile?.points || 0} pts</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-1 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-all duration-200 shadow-lg shadow-teal-600/25">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    link.highlight
                      ? 'btn-glow bg-teal-600 text-white font-semibold'
                      : link.ai
                      ? isActive(link.to)
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-semibold'
                      : isActive(link.to)
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.highlight ? <Plus size={16} strokeWidth={2.5} /> : link.icon}
                  {link.label}
                  {link.ai && <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold ml-auto">AI</span>}
                </Link>
              ))}
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 ring-1 ring-teal-200 dark:ring-teal-800">
                  <BarChart2 size={16} /> Admin Dashboard
                </Link>
              )}
              {profile?.role === 'authority' && (
                <Link to="/authority" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800">
                  <Building2 size={16} /> Authority Dashboard
                </Link>
              )}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <User size={16} /> Profile ({profile?.points || 0} pts)
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 w-full text-left">
                    <LogOut size={16} /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    Log in
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-medium text-center">
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
