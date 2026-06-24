import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { castVote, fetchUserVote } from '../../services/votes'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

const VOTE_OPTIONS = [
  { type: 'genuine', icon: '✅', label: 'Genuine', activeClass: 'bg-green-500 text-white border-green-500', hoverClass: 'hover:border-green-400 hover:text-green-600 dark:hover:text-green-400' },
  { type: 'fake', icon: '❌', label: 'Fake', activeClass: 'bg-red-500 text-white border-red-500', hoverClass: 'hover:border-red-400 hover:text-red-600 dark:hover:text-red-400' },
  { type: 'resolved', icon: '✔️', label: 'Already Resolved', activeClass: 'bg-blue-500 text-white border-blue-500', hoverClass: 'hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400' },
  { type: 'needs_proof', icon: '📷', label: 'Needs Proof', activeClass: 'bg-yellow-500 text-white border-yellow-500', hoverClass: 'hover:border-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-400' },
]

export default function CommunityPoll({ issue }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [voteCounts, setVoteCounts] = useState({
    genuine: issue.vote_genuine || 0,
    fake: issue.vote_fake || 0,
    resolved: issue.vote_resolved || 0,
    needs_proof: issue.vote_needs_proof || 0,
  })

  useEffect(() => {
    if (user?.id && issue?.id) {
      fetchUserVote(issue.id, user.id).then(setUserVote)
    }
  }, [user?.id, issue?.id])

  const handleVote = async (voteType) => {
    if (!user) {
      toast.error('Please log in to vote')
      navigate('/login')
      return
    }
    if (userVote) {
      const label = VOTE_OPTIONS.find(o => o.type === userVote)?.label || userVote
      toast(`You already voted "${label}" on this issue`, { icon: 'ℹ️', duration: 3000 })
      return
    }
    setLoading(true)
    try {
      const result = await castVote(issue.id, user.id, voteType)
      if (result.alreadyVoted) {
        const label = VOTE_OPTIONS.find(o => o.type === result.voteType)?.label || result.voteType
        toast(`You already voted "${label}" on this issue`, { icon: 'ℹ️', duration: 3000 })
        setUserVote(result.voteType)
        return
      }
      setUserVote(voteType)
      setVoteCounts(prev => ({ ...prev, [voteType]: (prev[voteType] || 0) + 1 }))
      toast.success(`+5 points! Thanks for your vote 🎉`)
      if (result.autoVerified) {
        toast.success('Issue has been auto-verified by community! 🏆', { duration: 4000 })
      }
      queryClient.invalidateQueries({ queryKey: ['issue', issue.id] })
    } catch (err) {
      console.error('Vote error:', err)
      toast.error('Failed to cast vote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Community Poll</h3>
        <span className="text-xs text-gray-400">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {VOTE_OPTIONS.map(opt => {
          const count = voteCounts[opt.type] || 0
          const isVoted = userVote === opt.type
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0

          return (
            <button
              key={opt.type}
              id={`vote-${opt.type}-btn`}
              onClick={() => handleVote(opt.type)}
              disabled={loading || !!userVote}
              className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 overflow-hidden ${
                isVoted
                  ? opt.activeClass
                  : `border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 ${!userVote ? opt.hoverClass : 'opacity-60 cursor-not-allowed'}`
              }`}
            >
              {/* Progress bar background */}
              {totalVotes > 0 && (
                <div
                  className="absolute inset-0 opacity-10 transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'currentColor' }}
                />
              )}
              <span className="text-xl z-10">{opt.icon}</span>
              <span className="text-xs font-semibold z-10">{opt.label}</span>
              <span className="text-xs font-bold z-10">{count} <span className="font-normal opacity-60">({pct}%)</span></span>
            </button>
          )
        })}
      </div>

      {userVote && (
        <p className="text-xs text-center text-gray-400 mt-3">
          You voted: <span className="font-semibold text-teal-600">{VOTE_OPTIONS.find(o => o.type === userVote)?.label}</span>
        </p>
      )}
      {!user && (
        <p className="text-xs text-center text-gray-400 mt-3">
          <button onClick={() => navigate('/login')} className="text-teal-600 hover:underline font-medium">Log in</button> to vote and earn points
        </p>
      )}
    </div>
  )
}
