import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ExternalLink, ArrowRight, X } from 'lucide-react'

/**
 * DuplicateModal — shown when Gemini detects a nearby similar issue.
 *
 * Props:
 *   duplicateResult  — { isDuplicate, issueId, title, confidence, reason }
 *   onSubmitAnyway   — callback to proceed with submission
 *   onClose          — callback to dismiss the modal
 */
export default function DuplicateModal({ duplicateResult, onSubmitAnyway, onClose }) {
  const navigate = useNavigate()

  if (!duplicateResult?.isDuplicate) return null

  const confidence = duplicateResult.confidence ?? 0
  const existingTitle = duplicateResult.title || 'a similar issue'
  const existingId = duplicateResult.issueId || duplicateResult.issue_id

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-orange-200 dark:border-orange-800 overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-6 pt-6 pb-4 border-b border-orange-100 dark:border-orange-800/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">Similar Issue Found Nearby</h2>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">
                  AI confidence: {confidence}%
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            A similar issue already exists nearby. Would you like to view it, or submit your issue anyway?
          </p>

          {/* Existing issue preview */}
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1.5">Existing Issue</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
              {existingTitle}
            </p>
            {duplicateResult.reason && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">
                "{duplicateResult.reason}"
              </p>
            )}
          </div>

          {/* Confidence meter */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Similarity</span>
              <span className="font-semibold text-orange-500">{confidence}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          {existingId ? (
            <button
              id="view-existing-issue-btn"
              onClick={() => { onClose(); navigate(`/issues/${existingId}`) }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
            >
              <ExternalLink size={15} />
              View Existing Issue
            </button>
          ) : null}
          <button
            id="submit-anyway-btn"
            onClick={() => { onClose(); onSubmitAnyway() }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            Submit Anyway
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
