import { supabase } from './supabase'

/**
 * Fetch all incidents with optional filters
 */
export async function fetchIncidents({ status, severity, limit = 100, offset = 0 } = {}) {
  let query = supabase
    .from('incidents')
    .select('*')
    .order('priority_score', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== 'All') query = query.eq('status', status)
  if (severity && severity !== 'All') query = query.eq('severity', severity)

  const { data, error } = await query
  if (error) { console.error('fetchIncidents error:', error); throw error }
  return data || []
}

/**
 * Fetch a single incident with all related data
 */
export async function fetchIncidentById(id) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error('fetchIncidentById error:', error); throw error }
  return data
}

/**
 * Fetch related issues for an incident (via incident_reports join)
 */
export async function fetchIncidentIssues(incidentId) {
  const { data, error } = await supabase
    .from('incident_reports')
    .select(`
      similarity_score, semantic_score, location_score, time_score, category_score, added_at,
      issues:issue_id (id, title, description, category, severity, status, lat, lng, address, media_urls, created_at, ai_reasoning, ai_priority_score)
    `)
    .eq('incident_id', incidentId)
    .order('similarity_score', { ascending: false })
  if (error) { console.error('fetchIncidentIssues error:', error); throw error }
  return data || []
}

/**
 * Fetch priority score breakdown for an incident
 */
export async function fetchIncidentScore(incidentId) {
  const { data, error } = await supabase
    .from('incident_scores')
    .select('*')
    .eq('incident_id', incidentId)
    .maybeSingle()
  if (error) { console.error('fetchIncidentScore error:', error); return null }
  return data
}

/**
 * Fetch AI recommendations for an incident
 */
export async function fetchIncidentRecommendations(incidentId) {
  const { data, error } = await supabase
    .from('incident_recommendations')
    .select('*')
    .eq('incident_id', incidentId)
    .order('step_number', { ascending: true })
  if (error) { console.error('fetchIncidentRecommendations error:', error); throw error }
  return data || []
}

/**
 * Create a new incident record
 */
export async function createIncident(incidentData) {
  const { data, error } = await supabase
    .from('incidents')
    .insert([incidentData])
    .select()
    .single()
  if (error) { console.error('createIncident error:', error); throw error }
  return data
}

/**
 * Update an existing incident
 */
export async function updateIncident(id, updates) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('updateIncident error:', error); throw error }
  return data
}

/**
 * Link an issue to an incident (with similarity scores)
 */
export async function linkIssueToIncident(incidentId, issueId, scores) {
  const { error } = await supabase
    .from('incident_reports')
    .upsert([{
      incident_id: incidentId,
      issue_id: issueId,
      similarity_score: scores.overall,
      semantic_score: scores.semantic,
      location_score: scores.location,
      time_score: scores.time,
      category_score: scores.category,
    }], { onConflict: 'incident_id,issue_id' })
  if (error) { console.error('linkIssueToIncident error:', error); throw error }
}

/**
 * Upsert incident priority score breakdown
 */
export async function saveIncidentScore(incidentId, breakdown) {
  const { error } = await supabase
    .from('incident_scores')
    .upsert([{ incident_id: incidentId, ...breakdown }], { onConflict: 'incident_id' })
  if (error) { console.error('saveIncidentScore error:', error); throw error }
}

/**
 * Save AI recommendations for an incident (replaces existing)
 */
export async function saveIncidentRecommendations(incidentId, recommendations) {
  // Delete old ones first
  await supabase.from('incident_recommendations').delete().eq('incident_id', incidentId)
  if (!recommendations || recommendations.length === 0) return

  const rows = recommendations.map((rec, i) => ({
    incident_id: incidentId,
    step_number: i + 1,
    action: rec.action,
    timeframe: rec.timeframe || null,
    priority: rec.priority || 'Normal',
  }))

  const { error } = await supabase.from('incident_recommendations').insert(rows)
  if (error) { console.error('saveIncidentRecommendations error:', error); throw error }
}

/**
 * Fetch incidents statistics for City Intelligence Dashboard
 */
export async function fetchIncidentStats() {
  const { data, error } = await supabase
    .from('incidents')
    .select('status, severity, priority_score, report_count, affected_population')

  if (error) { console.error('fetchIncidentStats error:', error); return null }

  const incidents = data || []
  return {
    total: incidents.length,
    active: incidents.filter(i => !['Resolved', 'Monitoring'].includes(i.status)).length,
    critical: incidents.filter(i => i.severity === 'Critical').length,
    emerging: incidents.filter(i => i.status === 'Emerging').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
    totalReports: incidents.reduce((sum, i) => sum + (i.report_count || 1), 0),
    affectedPopulation: incidents.reduce((sum, i) => sum + (i.affected_population || 0), 0),
    avgPriority: incidents.length > 0
      ? Math.round(incidents.reduce((sum, i) => sum + (i.priority_score || 50), 0) / incidents.length)
      : 0,
  }
}

/**
 * Fetch nearby incidents for geo-fusion matching
 */
export async function fetchNearbyIncidents(lat, lng, radiusKm = 1.5) {
  const delta = radiusKm / 111
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .gte('lat', lat - delta)
    .lte('lat', lat + delta)
    .gte('lng', lng - delta)
    .lte('lng', lng + delta)
    .not('status', 'eq', 'Resolved')
  if (error) { console.error('fetchNearbyIncidents error:', error); return [] }
  return data || []
}

/**
 * Update incident status (admin action)
 */
export async function updateIncidentStatus(id, newStatus, actorId, note) {
  return updateIncident(id, {
    status: newStatus,
    ...(newStatus === 'Resolved' ? { resolved_at: new Date().toISOString() } : {}),
    ...(note ? { resolution_note: note } : {}),
  })
}

// ── Authority-specific ──────────────────────────────────────────────────────

/**
 * Fetch incidents assigned to a specific authority profile
 */
export async function fetchAssignedIncidents(authorityId) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('assigned_authority_id', authorityId)
    .not('status', 'eq', 'Resolved')
    .order('priority_score', { ascending: false })
  if (error) { console.error('fetchAssignedIncidents error:', error); throw error }
  return data || []
}

/**
 * Assign an incident to an authority profile (admin only)
 */
export async function assignIncidentToAuthority(incidentId, authorityProfileId, authorityName) {
  return updateIncident(incidentId, {
    assigned_authority_id: authorityProfileId,
    assigned_authority: authorityName,
    status: 'Assigned',
  })
}

/**
 * Authority updates their own assigned incident
 */
export async function authorityUpdateIncident(incidentId, updates) {
  // Only allowed fields for authority
  const allowed = ['status', 'resolution_note', 'resolved_at']
  const safe = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) safe[key] = updates[key]
  }
  if (updates.status === 'Resolved') {
    safe.resolved_at = new Date().toISOString()
  }
  return updateIncident(incidentId, safe)
}

/**
 * Fetch all profiles with role = 'authority' (for admin assignment dropdown)
 */
export async function fetchAuthorityProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, ward')
    .eq('role', 'authority')
    .order('name')
  if (error) { console.error('fetchAuthorityProfiles error:', error); return [] }
  return data || []
}

// ── Notification helpers for incident workflow ──────────────────────────────

/**
 * Send a notification to a user about an incident
 * Uses existing notifications table (issue_id nullable — we pass null for incident notifications)
 */
export async function sendIncidentNotification(userId, type, message) {
  const { error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, issue_id: null, type, message }])
  if (error) console.error('sendIncidentNotification error:', error)
}

/**
 * Notify all citizens who submitted reports linked to an incident
 */
export async function notifyIncidentReporters(incidentId, type, message) {
  try {
    // Fetch all issue authors linked to this incident
    const { data } = await supabase
      .from('incident_reports')
      .select('issues:issue_id(user_id)')
      .eq('incident_id', incidentId)

    const userIds = [...new Set(
      (data || []).map(r => r.issues?.user_id).filter(Boolean)
    )]

    for (const userId of userIds) {
      await sendIncidentNotification(userId, type, message)
    }
  } catch (err) {
    console.error('notifyIncidentReporters error:', err)
  }
}

