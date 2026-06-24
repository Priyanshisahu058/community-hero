import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../store/authStore'
import { fetchUserIssues } from '../services/issues'
import PointsBadge from '../components/gamification/PointsBadge'
import IssueCard from '../components/issues/IssueCard'
import { WARD_OPTIONS } from '../utils/constants'
import toast from 'react-hot-toast'
import { Save, Edit2 } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, updateProfile } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [ward, setWard] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setName(profile?.name || '')
    setWard(profile?.ward || '')
  }, [user, profile, navigate])

  const { data: myIssues = [], isLoading } = useQuery({
    queryKey: ['user-issues', user?.id],
    queryFn: () => fetchUserIssues(user.id),
    enabled: !!user?.id,
  })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), ward })
      toast.success('Profile updated!')
      setEditing(false)
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const resolvedCount = myIssues.filter(i => i.status === 'Resolved').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-black border border-white/30">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-white/50 w-full"
                />
                <select
                  value={ward}
                  onChange={e => setWard(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none w-full"
                >
                  <option value="">Select Ward</option>
                  {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-black">{profile?.name || 'Civic Eye'}</h1>
                <p className="text-white/70 text-sm">{profile?.email}</p>
                {profile?.ward && <p className="text-white/60 text-xs mt-0.5">📍 {profile.ward}</p>}
              </>
            )}
          </div>
          <button
            onClick={editing ? handleSaveProfile : () => setEditing(true)}
            disabled={saving}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm font-medium transition-all"
          >
            {editing ? <><Save size={14} /> {saving ? 'Saving...' : 'Save'}</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Issues Reported', val: myIssues.length },
            { label: 'Issues Resolved', val: resolvedCount },
            { label: 'Total Points', val: profile?.points?.toLocaleString() || 0 },
          ].map(stat => (
            <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
              <p className="text-2xl font-black">{stat.val}</p>
              <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Points & Badges */}
      <PointsBadge points={profile?.points || 0} badges={profile?.badges || []} />

      {/* My Issues */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          My Reports <span className="text-sm font-normal text-gray-400 ml-1">({myIssues.length})</span>
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
            {[1,2].map(i => <div key={i} className="h-52 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
          </div>
        ) : myIssues.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <p className="text-4xl mb-3">🌟</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">You haven't reported any issues yet.</p>
            <p className="text-sm text-gray-400 mb-4">Be the first to report one in your area!</p>
            <button
              onClick={() => navigate('/report')}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Report First Issue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  )
}
