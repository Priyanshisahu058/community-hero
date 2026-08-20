/**
 * CivicMind AI — Incident Fusion Engine
 *
 * The core innovation of QuantumHacks: instead of treating each citizen report
 * in isolation, this engine reasons across multiple reports to identify the
 * underlying real-world incident they represent.
 *
 * Pipeline:
 *   New Report → Geo-Temporal Candidates → Semantic Similarity (Gemini) →
 *   Fusion Decision → Create/Update Incident → Priority Score → AI Recommendations
 */

import { supabase } from './supabase'
import { fuseIncidents, generateRecommendations, explainIncident } from './gemini'
import {
  createIncident,
  updateIncident,
  linkIssueToIncident,
  saveIncidentScore,
  saveIncidentRecommendations,
  fetchNearbyIncidents,
} from './incidents'

// ─── Constants ────────────────────────────────────────────────────────────────

const GEO_RADIUS_KM = 1.5        // Max geographic radius for candidate matching
const TIME_WINDOW_HOURS = 48     // Max age of candidate reports for fusion
const FUSION_THRESHOLD = 60      // Min confidence % to fuse into an incident

const SEVERITY_WEIGHTS = { Critical: 40, High: 25, Medium: 15, Low: 5 }
const SAFETY_CATEGORIES = ['Roads', 'Electricity', 'Water']
const AUTHORITY_MAP = {
  Roads: 'PMC Roads Department',
  Water: 'PMC Water Department',
  Electricity: 'MSEDCL / MSEDC',
  Sanitation: 'PMC Sanitation Department',
  Encroachment: 'PMC Encroachment Cell',
  Other: 'Municipal Corporation',
}

// ─── Helper: Haversine distance (km) ─────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Helper: Location similarity score (0-100) ───────────────────────────────

function locationScore(issueLat, issueLng, incidentLat, incidentLng) {
  if (!issueLat || !issueLng || !incidentLat || !incidentLng) return 0
  const distKm = haversineKm(issueLat, issueLng, incidentLat, incidentLng)
  if (distKm > GEO_RADIUS_KM) return 0
  return Math.round(100 * (1 - distKm / GEO_RADIUS_KM))
}

// ─── Helper: Time proximity score (0-100) ────────────────────────────────────

function timeScore(issueCreatedAt, incidentFirstReportedAt) {
  const issueTime = new Date(issueCreatedAt).getTime()
  const incidentTime = new Date(incidentFirstReportedAt).getTime()
  const diffHours = Math.abs(issueTime - incidentTime) / (1000 * 60 * 60)
  if (diffHours > TIME_WINDOW_HOURS) return 0
  return Math.round(100 * (1 - diffHours / TIME_WINDOW_HOURS))
}

// ─── Helper: Category consistency score ──────────────────────────────────────

function categoryScore(issueCategory, incidentCategory) {
  if (!issueCategory || !incidentCategory) return 50
  return issueCategory === incidentCategory ? 100 : 0
}

// ─── Priority Score Computation (Explainable) ────────────────────────────────

export function computePriorityScore(incident, reportCount, ageHours) {
  const breakdown = {
    severity_pts: SEVERITY_WEIGHTS[incident.severity] || 15,
    report_count_pts: Math.min(25, (reportCount - 1) * 5),
    geo_spread_pts: (incident.radius_km || 0) > 0.5 ? 5 : 0,
    time_persistence_pts: ageHours > 24 ? 10 : ageHours > 12 ? 5 : 0,
    category_urgency_pts: SAFETY_CATEGORIES.includes(incident.category) ? 10 : 0,
    recurrence_pts: reportCount >= 3 ? 5 : 0,
  }
  const total = Math.min(100, Object.values(breakdown).reduce((s, v) => s + v, 0))
  return { ...breakdown, total_score: total }
}

// ─── Estimate affected population from geo radius ─────────────────────────────

function estimateAffectedPopulation(radiusKm, category) {
  // Rough estimate: ~5000 people/km² in Indian city density
  const areaSqKm = Math.PI * (radiusKm ** 2)
  const basePop = Math.round(areaSqKm * 5000)
  // Scale down for non-public issues
  const multiplier = { Roads: 1.0, Water: 1.2, Electricity: 1.1, Sanitation: 0.8, Encroachment: 0.5 }
  return Math.round(basePop * (multiplier[category] || 0.7))
}

// ─── Main Fusion Function ─────────────────────────────────────────────────────

/**
 * Run AI Incident Fusion for a newly submitted issue.
 * This is the core CivicMind AI pipeline.
 *
 * @param {object} issue - The newly created issue from Supabase
 * @returns {Promise<{incidentId, action, confidence}>}
 */
export async function runIncidentFusion(issue) {
  if (!issue?.lat || !issue?.lng) {
    console.warn('[Fusion] Issue missing location, skipping fusion.')
    return { incidentId: null, action: 'skipped', confidence: 0 }
  }

  try {
    // ── Step 1: Find nearby OPEN incidents (geo-temporal candidates) ────────
    const nearbyIncidents = await fetchNearbyIncidents(issue.lat, issue.lng, GEO_RADIUS_KM)

    // ── Step 2: Pre-filter by category and time ──────────────────────────────
    const candidates = nearbyIncidents.filter(inc => {
      const locScore = locationScore(issue.lat, issue.lng, inc.lat, inc.lng)
      const tScore = timeScore(issue.created_at, inc.first_reported_at)
      return locScore > 20 && tScore > 0
    })

    // ── Step 3: Also fetch nearby raw issues for semantic analysis ──────────
    const delta = GEO_RADIUS_KM / 111
    const cutoff = new Date(Date.now() - TIME_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const { data: nearbyIssues } = await supabase
      .from('issues')
      .select('id, title, description, category, severity, lat, lng, created_at')
      .gte('lat', issue.lat - delta)
      .lte('lat', issue.lat + delta)
      .gte('lng', issue.lng - delta)
      .lte('lng', issue.lng + delta)
      .gte('created_at', cutoff)
      .neq('id', issue.id)
      .limit(10)

    const rawCandidates = (nearbyIssues || []).filter(ni =>
      categoryScore(issue.category, ni.category) > 0
    )

    // ── Step 4: If existing incidents found, try to attach to one ───────────
    if (candidates.length > 0) {
      const bestIncident = candidates[0] // Highest priority nearby incident

      const locSc = locationScore(issue.lat, issue.lng, bestIncident.lat, bestIncident.lng)
      const tSc = timeScore(issue.created_at, bestIncident.first_reported_at)
      const catSc = categoryScore(issue.category, bestIncident.category)

      // Run semantic fusion via Gemini
      const fuseResult = await fuseIncidents(issue, rawCandidates.slice(0, 5))
      const semanticSc = fuseResult?.semanticScore || 0
      const overallConfidence = Math.round(
        0.35 * semanticSc + 0.30 * locSc + 0.20 * tSc + 0.15 * catSc
      )

      if (overallConfidence >= FUSION_THRESHOLD && catSc > 0) {
        // Attach this issue to the existing incident
        await linkIssueToIncident(bestIncident.id, issue.id, {
          overall: overallConfidence,
          semantic: semanticSc,
          location: locSc,
          time: tSc,
          category: catSc,
        })

        // Update incident stats
        const newReportCount = (bestIncident.report_count || 1) + 1
        const ageHours = (Date.now() - new Date(bestIncident.first_reported_at).getTime()) / (1000 * 60 * 60)
        const newRadius = Math.max(
          bestIncident.radius_km || 0.5,
          haversineKm(issue.lat, issue.lng, bestIncident.lat, bestIncident.lng) + 0.2
        )
        const scoreBreakdown = computePriorityScore(
          { severity: bestIncident.severity, category: bestIncident.category, radius_km: newRadius },
          newReportCount,
          ageHours
        )
        const newSeverity = [issue.severity, bestIncident.severity].includes('Critical')
          ? 'Critical'
          : [issue.severity, bestIncident.severity].includes('High')
          ? 'High'
          : bestIncident.severity

        await updateIncident(bestIncident.id, {
          report_count: newReportCount,
          severity: newSeverity,
          priority_score: scoreBreakdown.total_score,
          radius_km: newRadius,
          last_report_at: issue.created_at || new Date().toISOString(),
          affected_population: estimateAffectedPopulation(newRadius, bestIncident.category),
          status: bestIncident.status === 'Emerging' && newReportCount >= 3 ? 'Verified' : bestIncident.status,
          ai_confidence: Math.max(bestIncident.ai_confidence || 0, overallConfidence),
        })

        await saveIncidentScore(bestIncident.id, scoreBreakdown)

        // Regenerate recommendations if report count milestone hit
        if (newReportCount % 2 === 0) {
          const { data: allIssues } = await supabase
            .from('incident_reports')
            .select('issues:issue_id(description)')
            .eq('incident_id', bestIncident.id)
          const relatedDesc = (allIssues || []).map(r => r.issues).filter(Boolean)
          const recs = await generateRecommendations(bestIncident, relatedDesc)
          await saveIncidentRecommendations(bestIncident.id, recs.recommendations)
        }

        return { incidentId: bestIncident.id, action: 'attached', confidence: overallConfidence }
      }
    }

    // ── Step 5: No existing incident matched — run semantic check on raw issues
    if (rawCandidates.length > 0) {
      const fuseResult = await fuseIncidents(issue, rawCandidates)

      if (fuseResult?.isRelated && (fuseResult.confidence || 0) >= FUSION_THRESHOLD) {
        // Create a new incident from the cluster
        const incidentTitle = fuseResult.incidentTitle || issue.title
        const ageHours = 0
        const scoreBreakdown = computePriorityScore(
          { severity: issue.severity, category: issue.category, radius_km: 0.5 },
          rawCandidates.length + 1,
          ageHours
        )
        const newIncident = await createIncident({
          title: incidentTitle,
          description: `AI identified ${rawCandidates.length + 1} related citizen reports describing this civic issue.`,
          category: issue.category,
          severity: issue.severity,
          status: 'Emerging',
          lat: issue.lat,
          lng: issue.lng,
          address: issue.address,
          radius_km: 0.5,
          report_count: rawCandidates.length + 1,
          priority_score: scoreBreakdown.total_score,
          ai_confidence: fuseResult.confidence,
          ai_fusion_reasoning: fuseResult.reasoning,
          assigned_authority: AUTHORITY_MAP[issue.category] || 'Municipal Corporation',
          affected_population: estimateAffectedPopulation(0.5, issue.category),
          first_reported_at: issue.created_at || new Date().toISOString(),
          last_report_at: issue.created_at || new Date().toISOString(),
        })

        // Link this issue
        await linkIssueToIncident(newIncident.id, issue.id, {
          overall: 100, semantic: 100, location: 100, time: 100, category: 100,
        })

        // Link nearby raw candidates too
        for (const candidate of rawCandidates.slice(0, 5)) {
          const locSc = locationScore(candidate.lat, candidate.lng, issue.lat, issue.lng)
          const tSc = timeScore(candidate.created_at, issue.created_at)
          await linkIssueToIncident(newIncident.id, candidate.id, {
            overall: Math.round((fuseResult.semanticScore + locSc + tSc) / 3),
            semantic: fuseResult.semanticScore || 0,
            location: locSc,
            time: tSc,
            category: 100,
          })
        }

        await saveIncidentScore(newIncident.id, scoreBreakdown)

        // Generate AI recommendations
        const allIssueDescs = [issue, ...rawCandidates]
        const recs = await generateRecommendations(newIncident, allIssueDescs)
        await saveIncidentRecommendations(newIncident.id, recs.recommendations)

        return { incidentId: newIncident.id, action: 'created_from_cluster', confidence: fuseResult.confidence }
      }
    }

    // ── Step 6: Standalone report — create a new single-report incident ──────
    const scoreBreakdown = computePriorityScore(
      { severity: issue.severity, category: issue.category, radius_km: 0.3 },
      1,
      0
    )
    const newIncident = await createIncident({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      severity: issue.severity,
      status: 'Emerging',
      lat: issue.lat,
      lng: issue.lng,
      address: issue.address,
      radius_km: 0.3,
      report_count: 1,
      priority_score: scoreBreakdown.total_score,
      ai_confidence: 70,
      ai_fusion_reasoning: 'New incident created from single citizen report. Monitoring for related reports.',
      assigned_authority: AUTHORITY_MAP[issue.category] || 'Municipal Corporation',
      affected_population: estimateAffectedPopulation(0.3, issue.category),
      first_reported_at: issue.created_at || new Date().toISOString(),
      last_report_at: issue.created_at || new Date().toISOString(),
    })

    await linkIssueToIncident(newIncident.id, issue.id, {
      overall: 100, semantic: 100, location: 100, time: 100, category: 100,
    })
    await saveIncidentScore(newIncident.id, scoreBreakdown)

    const recs = await generateRecommendations(newIncident, [issue])
    await saveIncidentRecommendations(newIncident.id, recs.recommendations)

    return { incidentId: newIncident.id, action: 'created_standalone', confidence: 70 }

  } catch (err) {
    console.error('[Fusion Engine] Error:', err)
    return { incidentId: null, action: 'error', confidence: 0 }
  }
}

/**
 * Batch-run fusion on all existing issues (for demo/evaluation mode)
 * @param {function} onProgress - progress callback (processed, total)
 * @returns {Promise<{incidentsCreated, reportsLinked, totalProcessed}>}
 */
export async function runBatchFusion(onProgress) {
  const { data: allIssues, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(200)

  if (error || !allIssues) return { incidentsCreated: 0, reportsLinked: 0, totalProcessed: 0 }

  let incidentsCreated = 0
  let reportsLinked = 0

  for (let i = 0; i < allIssues.length; i++) {
    const issue = allIssues[i]
    if (onProgress) onProgress(i + 1, allIssues.length)

    // Check if already linked to an incident
    const { data: existing } = await supabase
      .from('incident_reports')
      .select('id')
      .eq('issue_id', issue.id)
      .maybeSingle()

    if (existing) { reportsLinked++; continue }

    const result = await runIncidentFusion(issue)
    if (result.action === 'created_standalone' || result.action === 'created_from_cluster') {
      incidentsCreated++
    }
    reportsLinked++

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300))
  }

  return { incidentsCreated, reportsLinked, totalProcessed: allIssues.length }
}

/**
 * Get fusion explanation for an incident's related issues
 */
export async function getIncidentExplanation(incident, relatedIssues) {
  return explainIncident(incident, relatedIssues)
}
