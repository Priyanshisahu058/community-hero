import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Star } from 'lucide-react'
import { submitFeedback, fetchIssueFeedback } from '../../services/feedback'
import useAuthStore from '../../store/authStore'

export default function FeedbackPrompt({ issue }) {
  const { user } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedbackData, setFeedbackData] = useState(null) // { average, count, userEntry }

  const isReporter = user?.id === issue?.user_id
  const isResolved = ['Resolved', 'Closed'].includes(issue?.status)

  useEffect(() => {
    if (isResolved && issue?.id) {
      fetchIssueFeedback(issue.id, user?.id).then(setFeedbackData)
    }
  }, [issue?.id, isResolved, user?.id])

  // Already submitted — show just the average
  const alreadySubmitted = feedbackData?.userEntry || submitted

  if (!isResolved) return null

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return }
    if (!user) { toast.error('Log in to leave feedback'); return }
    setSubmitting(true)
    try {
      await submitFeedback(issue.id, user.id, rating, comment)
      setSubmitted(true)
      toast.success('Thanks for your feedback! ⭐')
      // Refresh feedback data
      const updated = await fetchIssueFeedback(issue.id, user.id)
      setFeedbackData(updated)
    } catch {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Resolution Feedback
        </h3>
        {feedbackData?.count > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {feedbackData.average} <span className="font-normal text-amber-500">({feedbackData.count})</span>
            </span>
          </div>
        )}
      </div>

      {/* Show form only to the original reporter who hasn't submitted yet */}
      {isReporter && !alreadySubmitted ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Was your issue resolved satisfactorily?</p>

          {/* Star rating */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                id={`feedback-star-${star}`}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`${star} star`}
              >
                <Star
                  size={28}
                  className={`transition-colors duration-100 ${
                    star <= (hovered || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-xs text-gray-500 ml-1">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </span>
            )}
          </div>

          {/* Optional comment */}
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 200))}
            placeholder="Tell us more... (optional)"
            rows={2}
            className="w-full text-sm px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{comment.length}/200</span>
            <button
              id="submit-feedback-btn"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-all shadow-sm shadow-teal-600/20"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Star size={14} className="fill-white" />
              )}
              Submit Feedback
            </button>
          </div>
        </div>
      ) : alreadySubmitted ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Star size={16} className="fill-green-500 text-green-500" />
          {isReporter ? 'You already submitted feedback — thank you!' : 'Feedback has been submitted for this issue.'}
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          {feedbackData?.count
            ? `${feedbackData.count} citizen${feedbackData.count > 1 ? 's' : ''} rated this resolution.`
            : 'No feedback submitted yet.'}
        </p>
      )}
    </div>
  )
}
