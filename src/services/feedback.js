import { supabase } from './supabase'

/**
 * Submit feedback (rating + optional comment) for a resolved issue.
 */
export async function submitFeedback(issueId, userId, rating, comment = '') {
  const { data, error } = await supabase
    .from('feedback')
    .insert([{ issue_id: issueId, user_id: userId, rating, comment: comment.trim() || null }])
    .select()
    .single()
  if (error) { console.error('submitFeedback error:', error); throw error }
  return data
}

/**
 * Fetch feedback entries for a single issue.
 * Returns { entries, average, count, userEntry }
 */
export async function fetchIssueFeedback(issueId, userId = null) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchIssueFeedback error:', error); return { entries: [], average: null, count: 0, userEntry: null } }
  const entries = data || []
  const count = entries.length
  const average = count > 0 ? (entries.reduce((sum, e) => sum + e.rating, 0) / count).toFixed(1) : null
  const userEntry = userId ? entries.find(e => e.user_id === userId) : null
  return { entries, average, count, userEntry }
}

/**
 * Fetch global average satisfaction rating across all resolved issues.
 * Used by Admin Dashboard.
 */
export async function fetchAvgSatisfaction() {
  const { data, error } = await supabase
    .from('feedback')
    .select('rating')
  if (error || !data?.length) return null
  const avg = data.reduce((sum, e) => sum + e.rating, 0) / data.length
  return avg.toFixed(1)
}
