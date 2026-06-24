import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

// Password strength calculator
function getStrength(pw) {
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4', textColor: 'text-red-600' }
  if (score <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/4', textColor: 'text-yellow-600' }
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full', textColor: 'text-green-600' }
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register, user } = useAuthStore()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const validate = () => {
    const e = {}
    if (name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address'
    if (password.length < 6) e.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error(Object.values(errs)[0])
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const data = await register(email.trim(), password, name.trim())
      if (data.session) {
        toast.success(`🎉 Welcome to CivicEye, ${name.trim()}! Account created successfully.`)
        navigate('/')
      } else {
        toast.success('Account created! Please check your email to confirm.')
        navigate('/login')
      }
    } catch (err) {
      console.error('Register error:', err)
      const msg = err.message?.toLowerCase() || ''
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('email already')) {
        toast.error('An account with this email already exists. Try logging in.')
      } else {
        toast.error(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = password ? getStrength(password) : null
  const inputBase = 'w-full py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm'

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-900 border-2 border-teal-200 dark:border-teal-800 rounded-2xl shadow-xl shadow-teal-500/10 mb-4">
            <Eye size={28} strokeWidth={2} className="text-teal-600" />
          </div>
          <h1 className="text-2xl font-black">
            <span style={{ color: '#0F766E' }}>Civic</span><span className="text-gray-900 dark:text-white">Eye</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Report issues. Earn points. Make your city better.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[['🏅', 'Earn Points'], ['🗺️', 'Map Issues'], ['✅', 'Get Resolved']].map(([icon, label]) => (
              <div key={label} className="text-center bg-teal-50 dark:bg-teal-900/20 rounded-xl p-2.5">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">{label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
                  placeholder="Priya Sharma"
                  required
                  className={`pl-9 pr-4 ${inputBase} ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                  placeholder="you@example.com"
                  required
                  className={`pl-9 pr-4 ${inputBase} ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                  placeholder="Min. 6 characters"
                  required
                  className={`pl-9 pr-10 ${inputBase} ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
                <button type="button" onClick={() => setShowPassword(o => !o)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength bar */}
              {password && strength && (
                <div className="mt-2">
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs mt-1 font-medium ${strength.textColor}`}>{strength.label} password</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirm: undefined })) }}
                  placeholder="Re-enter password"
                  required
                  className={`pl-9 pr-10 ${inputBase} ${errors.confirm ? 'border-red-400 focus:ring-red-400' : confirmPassword && confirmPassword === password ? 'border-green-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
                <button type="button" onClick={() => setShowConfirm(o => !o)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
              {!errors.confirm && confirmPassword && confirmPassword === password && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-teal-600/25 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create account — it's free"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
