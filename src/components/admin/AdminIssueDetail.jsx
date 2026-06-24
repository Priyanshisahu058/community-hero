import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateIssueStatus, uploadResolutionProof } from '../../services/issues'
import CategoryBadge from '../ui/CategoryBadge'
import SeverityBadge from '../ui/SeverityBadge'
import StatusBadge from '../ui/StatusBadge'
import IssueTimeline from '../issues/IssueTimeline'
import { format } from 'date-fns'
import { MapPin, Upload, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const STATUS_FLOW = ['Submitted', 'Verified', 'In Progress', 'Resolved', 'Closed']

export default function AdminIssueDetail({ issue, onClose }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [newStatus, setNewStatus] = useState(issue.status)
  const [note, setNote] = useState('')
  const [proofFiles, setProofFiles] = useState([])
  const [proofNote, setProofNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofUploaded, setProofUploaded] = useState(false) // tracks if proof was uploaded this session

  const handleStatusUpdate = async () => {
    if (newStatus === issue.status) {
      toast('No change in status', { icon: 'ℹ️' })
      return
    }
    // Block Resolved without proof photo
    if (newStatus === 'Resolved' && !proofUploaded) {
      toast.error('Cannot mark as Resolved — please upload at least one resolution proof photo first', { duration: 5000 })
      return
    }
    setUpdating(true)
    try {
      await updateIssueStatus(issue.id, newStatus, user.id, note)
      toast.success(`✅ Status updated to ${newStatus}`)
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] })
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status — check your connection')
    } finally {
      setUpdating(false)
    }
  }

  const handleProofUpload = async () => {
    if (proofFiles.length === 0) { toast.error('Please select at least one proof image'); return }
    setUploadingProof(true)
    try {
      await uploadResolutionProof(issue.id, user.id, proofFiles, proofNote)
      toast.success(`📸 ${proofFiles.length} proof photo${proofFiles.length > 1 ? 's' : ''} uploaded! Now you can mark as Resolved.`)
      setProofUploaded(true)
      setProofFiles([])
      setProofNote('')
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] })
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload proof — please try again')
    } finally {
      setUploadingProof(false)
    }
  }

  const mediaUrls = Array.isArray(issue.media_urls) ? issue.media_urls : []

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
        <div>
          <div className="flex gap-2 mb-1.5 flex-wrap">
            <CategoryBadge category={issue.category} />
            <SeverityBadge severity={issue.severity} />
            <StatusBadge status={issue.status} />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{issue.title}</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
            <X size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Media */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mediaUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={`Media ${i+1}`} className="w-full h-28 object-cover rounded-xl hover:opacity-90 transition-opacity" />
              </a>
            ))}
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{issue.description || 'No description provided.'}</p>
        </div>

        {/* Location */}
        {issue.address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{issue.address}</p>
              {issue.lat && <p className="text-xs text-gray-400">{issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}</p>}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {issue.ai_reasoning && (
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">🤖 AI Analysis</p>
            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
              <div><span className="text-gray-500">Category:</span> <span className="font-semibold">{issue.ai_category}</span></div>
              <div><span className="text-gray-500">Severity:</span> <span className="font-semibold">{issue.ai_severity}</span></div>
              <div><span className="text-gray-500">Priority:</span> <span className="font-semibold">{issue.ai_priority_score}/100</span></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">{issue.ai_reasoning}</p>
          </div>
        )}

        {/* Votes */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Genuine', val: issue.vote_genuine, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
            { label: 'Fake', val: issue.vote_fake, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
            { label: 'Resolved', val: issue.vote_resolved, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
            { label: 'Needs Proof', val: issue.vote_needs_proof, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
          ].map(v => (
            <div key={v.label} className={`${v.bg} rounded-xl p-2`}>
              <p className={`text-xl font-black ${v.color}`}>{v.val || 0}</p>
              <p className="text-xs text-gray-500">{v.label}</p>
            </div>
          ))}
        </div>

        {/* Reporter info */}
        <div className="text-xs text-gray-400">
          Reported: {format(new Date(issue.created_at), 'MMM d, yyyy HH:mm')}
        </div>

        {/* Status Update */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Update Status</p>
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {STATUS_FLOW.map(s => (
              <option key={s} value={s}>{s}{s === 'Resolved' && !proofUploaded ? ' 🔒 (upload proof first)' : ''}</option>
            ))}
          </select>
          {newStatus === 'Resolved' && !proofUploaded && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl px-4 py-3 mb-3">
              <span className="flex-shrink-0 mt-0.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </span>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 leading-snug">
                ⛔ Upload at least one resolution proof photo below before marking as Resolved
              </p>
            </div>
          )}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            rows={2}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          <button
            onClick={handleStatusUpdate}
            disabled={updating || (newStatus === 'Resolved' && !proofUploaded)}
            className="w-full bg-teal-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>

        {/* Resolution Proof Upload */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
            <Upload size={14} /> Upload Resolution Proof
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setProofFiles([...e.target.files])}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 mb-2"
          />
          <textarea
            value={proofNote}
            onChange={e => setProofNote(e.target.value)}
            placeholder="Describe what was fixed..."
            rows={2}
            className="w-full border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <button
            onClick={handleProofUpload}
            disabled={uploadingProof || proofFiles.length === 0}
            className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {uploadingProof ? 'Uploading...' : `Upload ${proofFiles.length > 0 ? `(${proofFiles.length} file${proofFiles.length > 1 ? 's' : ''})` : 'Proof'}`}
          </button>
        </div>

        {/* Timeline */}
        <IssueTimeline issueId={issue.id} currentStatus={issue.status} />
      </div>
    </div>
  )
}
