import { useState, useEffect } from 'react'
import { fetchResolutionProof } from '../../services/issues'
import { format } from 'date-fns'
import { CheckCircle } from 'lucide-react'

export default function ResolutionProof({ issueId }) {
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResolutionProof(issueId).then(data => {
      setProof(data)
      setLoading(false)
    })
  }, [issueId])

  if (loading) {
    return (
      <div className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3" />
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    )
  }

  if (!proof) return null

  return (
    <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-5">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={18} className="text-green-600" />
        <h3 className="font-semibold text-green-800 dark:text-green-400">Resolution Proof</h3>
        <span className="text-xs text-green-600 ml-auto">
          {format(new Date(proof.created_at), 'MMM d, yyyy')}
        </span>
      </div>
      {proof.note && (
        <p className="text-sm text-green-700 dark:text-green-300 mb-3 bg-white/50 dark:bg-green-900/20 rounded-lg p-3">
          {proof.note}
        </p>
      )}
      {Array.isArray(proof.media_urls) && proof.media_urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {proof.media_urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt={`Proof ${i + 1}`} className="w-full h-24 object-cover rounded-lg hover:opacity-90 transition-opacity" />
            </a>
          ))}
        </div>
      )}
      {proof.profiles?.name && (
        <p className="text-xs text-green-600 mt-3">Verified by: {proof.profiles.name}</p>
      )}
    </div>
  )
}
