import { supabase } from './supabase'
import { awardPoints, checkAndAwardBadges, sendNotification } from './issues'
import { POINTS } from '../utils/constants'

/**
 * Fetch the existing vote for a user+issue pair
 */
export async function fetchUserVote(issueId, userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('issue_id', issueId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.error('fetchUserVote error:', error); return null }
  return data?.vote_type || null
}

/**
 * Cast a vote on an issue
 * @param {string} issueId
 * @param {string} userId
 * @param {string} voteType - 'genuine' | 'fake' | 'resolved' | 'needs_proof'
 * @returns {Promise<{issue, alreadyVoted}>}
 */
export async function castVote(issueId, userId, voteType) {
  // Check if already voted
  const existing = await fetchUserVote(issueId, userId)
  if (existing) {
    return { alreadyVoted: true, voteType: existing }
  }

  // Insert vote
  const { error: voteError } = await supabase.from('votes').insert([{ issue_id: issueId, user_id: userId, vote_type: voteType }])
  if (voteError) { console.error('castVote insert error:', voteError); throw voteError }

  // Get current vote counts
  const { data: currentIssue } = await supabase.from('issues').select('vote_genuine, vote_fake, vote_resolved, vote_needs_proof, status, user_id').eq('id', issueId).single()

  // Build increment
  const fieldMap = {
    genuine: 'vote_genuine',
    fake: 'vote_fake',
    resolved: 'vote_resolved',
    needs_proof: 'vote_needs_proof',
  }
  const field = fieldMap[voteType]
  const newCount = (currentIssue?.[field] || 0) + 1
  const updateObj = { [field]: newCount }

  // Auto-verify if genuine votes >= 5
  let autoVerified = false
  if (voteType === 'genuine' && newCount >= 5 && currentIssue?.status === 'Submitted') {
    updateObj.status = 'Verified'
    autoVerified = true
  }

  const { data: updatedIssue, error: updateError } = await supabase
    .from('issues')
    .update(updateObj)
    .eq('id', issueId)
    .select()
    .single()
  if (updateError) { console.error('castVote update error:', updateError); throw updateError }

  // Award points to voter
  await awardPoints(userId, POINTS.CAST_VOTE)
  await checkAndAwardBadges(userId)

  // If auto-verified: notify reporter + award reporter points + add to status history
  if (autoVerified && currentIssue?.user_id) {
    await awardPoints(currentIssue.user_id, POINTS.REPORT_VERIFIED)
    await sendNotification(currentIssue.user_id, issueId, 'vote_milestone', `🎉 Your issue has been verified by the community! You earned +${POINTS.REPORT_VERIFIED} points.`)
    await supabase.from('status_history').insert([{
      issue_id: issueId,
      old_status: 'Submitted',
      new_status: 'Verified',
      actor_id: userId,
      note: 'Auto-verified: 5+ genuine community votes received.',
    }])
    await sendNotification(currentIssue.user_id, issueId, 'status_change', 'Your issue status changed from Submitted to Verified.')
  }

  // Vote milestone notifications
  if (voteType === 'genuine' && [5, 10, 25].includes(newCount) && currentIssue?.user_id) {
    await sendNotification(currentIssue.user_id, issueId, 'vote_milestone', `Your issue has received ${newCount} genuine votes!`)
  }

  return { alreadyVoted: false, issue: updatedIssue, autoVerified }
}

/**
 * Fetch vote counts for an issue
 */
export async function fetchVoteCounts(issueId) {
  const { data, error } = await supabase
    .from('issues')
    .select('vote_genuine, vote_fake, vote_resolved, vote_needs_proof')
    .eq('id', issueId)
    .single()
  if (error) { console.error('fetchVoteCounts error:', error); return null }
  return data
}
