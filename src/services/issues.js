import { supabase } from './supabase'
import { POINTS, BADGES } from '../utils/constants'

/**
 * Fetch all issues with optional filters
 */
export async function fetchIssues({ category, status, limit = 50, offset = 0, orderBy = 'created_at', ascending = false } = {}) {
  let query = supabase
    .from('issues')
    .select(`*, profiles:user_id (name, email, ward)`)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1)

  if (category && category !== 'All') query = query.eq('category', category)
  if (status && status !== 'All') query = query.eq('status', status)

  const { data, error } = await query
  if (error) { console.error('fetchIssues error:', error); throw error }
  return data || []
}

/**
 * Fetch a single issue by ID
 */
export async function fetchIssueById(id) {
  const { data, error } = await supabase
    .from('issues')
    .select(`*, profiles:user_id (id, name, email, ward, points, badges)`)
    .eq('id', id)
    .single()
  if (error) { console.error('fetchIssueById error:', error); throw error }
  return data
}

/**
 * Fetch issues within ~500m radius (rough bounding box)
 */
export async function fetchNearbyIssues(lat, lng, radiusKm = 0.5) {
  const delta = radiusKm / 111 // ~1 degree = 111 km
  const { data, error } = await supabase
    .from('issues')
    .select('id, title, description, category, status')
    .gte('lat', lat - delta)
    .lte('lat', lat + delta)
    .gte('lng', lng - delta)
    .lte('lng', lng + delta)
    .neq('status', 'Closed')
    .neq('status', 'Resolved')
    .limit(20)
  if (error) { console.error('fetchNearbyIssues error:', error); throw error }
  return data || []
}

/**
 * Upload media files to Supabase Storage
 * @returns {Promise<string[]>} array of public URLs
 */
export async function uploadIssueMedia(files, userId) {
  const urls = []
  for (const file of files) {
    const ext = file.type === 'video/mp4' ? 'mp4' : 'jpg'
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('issue-media').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) { console.error('uploadIssueMedia error:', error); continue }
    const { data: urlData } = supabase.storage.from('issue-media').getPublicUrl(path)
    urls.push(urlData.publicUrl)
  }
  return urls
}

/**
 * Create a new issue
 */
export async function createIssue(issueData) {
  const { data, error } = await supabase
    .from('issues')
    .insert([issueData])
    .select()
    .single()
  if (error) { console.error('createIssue error:', error); throw error }

  // Award points and badges
  await awardPoints(issueData.user_id, POINTS.REPORT_SUBMITTED)
  await checkAndAwardBadges(issueData.user_id)

  // Insert initial status history
  await supabase.from('status_history').insert([{
    issue_id: data.id,
    old_status: null,
    new_status: 'Submitted',
    actor_id: issueData.user_id,
    note: 'Issue submitted by citizen',
  }])

  return data
}

/**
 * Update issue status (admin action)
 */
export async function updateIssueStatus(issueId, newStatus, actorId, note = '') {
  // Get current issue
  const { data: issue } = await supabase.from('issues').select('status, user_id').eq('id', issueId).single()
  const oldStatus = issue?.status

  const { data, error } = await supabase
    .from('issues')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', issueId)
    .select()
    .single()
  if (error) { console.error('updateIssueStatus error:', error); throw error }

  // Insert status history
  await supabase.from('status_history').insert([{
    issue_id: issueId,
    old_status: oldStatus,
    new_status: newStatus,
    actor_id: actorId,
    note,
  }])

  // Award points if resolved
  if (newStatus === 'Resolved' && issue?.user_id) {
    await awardPoints(issue.user_id, POINTS.ISSUE_RESOLVED)
    await sendNotification(issue.user_id, issueId, 'issue_resolved', `Your issue has been resolved! You earned +${POINTS.ISSUE_RESOLVED} points.`)
  }

  // Send status change notification
  if (issue?.user_id && oldStatus !== newStatus) {
    await sendNotification(issue.user_id, issueId, 'status_change', `Your issue status changed from ${oldStatus} to ${newStatus}.`)
  }

  return data
}

/**
 * Award points to a user
 */
export async function awardPoints(userId, points) {
  const { error } = await supabase.rpc('increment_points', { user_id: userId, points_to_add: points })
  if (error) {
    // Fallback: manual update
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
    await supabase.from('profiles').update({ points: (profile?.points || 0) + points }).eq('id', userId)
  }
}

/**
 * Check and award badges based on user activity
 */
export async function checkAndAwardBadges(userId) {
  try {
    const { data: profile } = await supabase.from('profiles').select('badges').eq('id', userId).single()
    const currentBadges = profile?.badges || []
    const newBadges = [...currentBadges]
    let changed = false

    // Count issues
    const { count: issueCount } = await supabase.from('issues').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    // Count votes cast
    const { count: voteCount } = await supabase.from('votes').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    // Count resolved issues
    const { count: resolvedCount } = await supabase.from('issues').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Resolved')

    const hasBadge = (id) => currentBadges.some(b => b.id === id)

    if (issueCount >= 1 && !hasBadge('first_report')) { newBadges.push(BADGES.find(b => b.id === 'first_report')); changed = true }
    if (voteCount >= 10 && !hasBadge('community_guardian')) { newBadges.push(BADGES.find(b => b.id === 'community_guardian')); changed = true }
    if (resolvedCount >= 5 && !hasBadge('problem_solver')) { newBadges.push(BADGES.find(b => b.id === 'problem_solver')); changed = true }
    if (issueCount >= 20 && !hasBadge('top_reporter')) { newBadges.push(BADGES.find(b => b.id === 'top_reporter')); changed = true }

    if (changed) {
      await supabase.from('profiles').update({ badges: newBadges }).eq('id', userId)
    }
  } catch (err) {
    console.error('checkAndAwardBadges error:', err)
  }
}

/**
 * Send a notification
 */
export async function sendNotification(userId, issueId, type, message) {
  const { error } = await supabase.from('notifications').insert([{ user_id: userId, issue_id: issueId, type, message }])
  if (error) console.error('sendNotification error:', error)
}

/**
 * Fetch leaderboard (top 10 profiles by points)
 */
export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, points, badges, ward')
    .order('points', { ascending: false })
    .limit(10)
  if (error) { console.error('fetchLeaderboard error:', error); throw error }
  return data || []
}

/**
 * Fetch issues for a specific user
 */
export async function fetchUserIssues(userId) {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchUserIssues error:', error); throw error }
  return data || []
}

/**
 * Upload resolution proof media
 */
export async function uploadResolutionProof(issueId, adminId, files, note) {
  const urls = []
  for (const file of files) {
    const path = `proofs/${issueId}/${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage.from('issue-media').upload(path, file, { contentType: file.type })
    if (upErr) { console.error('uploadResolutionProof storage error:', upErr); continue }
    const { data: urlData } = supabase.storage.from('issue-media').getPublicUrl(path)
    urls.push(urlData.publicUrl)
  }
  const { error } = await supabase.from('resolution_proof').insert([{ issue_id: issueId, admin_id: adminId, media_urls: urls, note }])
  if (error) { console.error('uploadResolutionProof db error:', error); throw error }
  return urls
}

/**
 * Fetch resolution proof for an issue
 */
export async function fetchResolutionProof(issueId) {
  const { data, error } = await supabase.from('resolution_proof').select('*, profiles:admin_id(name)').eq('issue_id', issueId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) { console.error('fetchResolutionProof error:', error); return null }
  return data
}
