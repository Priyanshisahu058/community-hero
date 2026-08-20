const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/**
 * Call Gemini 2.0 Flash REST API
 */
async function callGemini(parts) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.warn('Gemini API key not set — returning mock data')
    return null
  }
  const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 512,
      },
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${response.status} — ${err}`)
  }
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null
}

/**
 * Parse JSON from Gemini response (handle markdown code fences)
 */
function parseJSON(text) {
  if (!text) return null
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

/**
 * Categorize a civic issue using image + description
 * @param {string|null} imageBase64 - Base64 encoded image (no prefix)
 * @param {string} description - Issue description
 * @returns {Promise<{category, confidence, severity, reasoning}>}
 */
export async function categorizeIssue(imageBase64, description) {
  try {
    const parts = []
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } })
    }
    parts.push({
      text: `You are a civic issue classifier for Indian municipal corporations. Analyse this image and description and return JSON only (no markdown, no explanation): { "category": "one of [Roads, Water, Electricity, Sanitation, Encroachment, Other]", "confidence": 0-100, "severity": "one of [Low, Medium, High, Critical]", "reasoning": "one sentence" }. Description: ${description}`,
    })

    const raw = await callGemini(parts)
    if (!raw) {
      return { category: 'Other', confidence: 50, severity: 'Medium', reasoning: 'AI analysis unavailable — please set VITE_GEMINI_API_KEY' }
    }
    return parseJSON(raw)
  } catch (err) {
    console.error('categorizeIssue error:', err)
    return { category: 'Other', confidence: 50, severity: 'Medium', reasoning: 'AI analysis failed. Please classify manually.' }
  }
}

/**
 * Check if a new issue is a duplicate of nearby issues
 * @param {object} newIssue - {title, description, category}
 * @param {array} nearbyIssues - Array of existing issue objects
 * @returns {Promise<{isDuplicate, matchedIssueId, confidence}>}
 */
export async function checkDuplicate(newIssue, nearbyIssues) {
  if (!nearbyIssues || nearbyIssues.length === 0) {
    return { isDuplicate: false, matchedIssueId: null, confidence: 0 }
  }
  try {
    const nearby = nearbyIssues.slice(0, 10).map(i => ({
      id: i.id, title: i.title, description: i.description?.slice(0, 100), category: i.category,
    }))
    const parts = [{
      text: `Given a new civic issue report and a list of existing open issues nearby, determine if the new report is a duplicate. New issue: ${JSON.stringify({ title: newIssue.title, description: newIssue.description, category: newIssue.category })}. Nearby open issues: ${JSON.stringify(nearby)}. Return JSON only (no markdown): { "isDuplicate": boolean, "matchedIssueId": "string or null", "confidence": 0-100 }`,
    }]
    const raw = await callGemini(parts)
    if (!raw) return { isDuplicate: false, matchedIssueId: null, confidence: 0 }
    return parseJSON(raw)
  } catch (err) {
    console.error('checkDuplicate error:', err)
    return { isDuplicate: false, matchedIssueId: null, confidence: 0 }
  }
}

/**
 * Score severity from image + description
 * @param {string|null} imageBase64
 * @param {string} description
 * @param {string} category
 * @returns {Promise<{severity, priorityScore, reasoning}>}
 */
export async function scoreSeverity(imageBase64, description, category) {
  try {
    const parts = []
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } })
    }
    parts.push({
      text: `Analyse this civic issue image and description for an Indian city. Category: ${category}. Return JSON only (no markdown): { "severity": "one of [Low, Medium, High, Critical]", "priorityScore": 1-100, "reasoning": "one sentence explaining severity" }. Description: ${description}`,
    })
    const raw = await callGemini(parts)
    if (!raw) return { severity: 'Medium', priorityScore: 50, reasoning: 'AI severity scoring unavailable.' }
    return parseJSON(raw)
  } catch (err) {
    console.error('scoreSeverity error:', err)
    return { severity: 'Medium', priorityScore: 50, reasoning: 'AI severity scoring failed.' }
  }
}

/**
 * CivicMind AI: Determine if a set of citizen reports describe the same real-world incident
 * @param {object} newIssue - The newly submitted issue
 * @param {array} candidates - Nearby issues that are candidates for fusion
 * @returns {Promise<{isRelated, confidence, semanticScore, reasoning}>}
 */
export async function fuseIncidents(newIssue, candidates) {
  if (!candidates || candidates.length === 0) {
    return { isRelated: false, confidence: 0, semanticScore: 0, reasoning: 'No candidate reports nearby.' }
  }
  try {
    const candidateSummary = candidates.slice(0, 8).map((c, i) => ({
      index: i + 1,
      title: c.title,
      description: c.description?.slice(0, 150),
      category: c.category,
      severity: c.severity,
    }))
    const parts = [{
      text: `You are CivicMind AI, an urban intelligence system. Analyse if these citizen reports are describing the SAME real-world civic incident.

New Report:
Title: "${newIssue.title}"
Description: "${newIssue.description?.slice(0, 200)}"
Category: ${newIssue.category}

Existing Reports in the same area:
${JSON.stringify(candidateSummary, null, 2)}

Return JSON only (no markdown, no explanation):
{
  "isRelated": boolean,
  "bestMatchIndex": number or null (1-indexed, which existing report best matches),
  "confidence": 0-100,
  "semanticScore": 0-100,
  "incidentTitle": "suggested unified incident title if related",
  "reasoning": "one sentence explaining the fusion decision"
}`,
    }]
    const raw = await callGemini(parts)
    if (!raw) return { isRelated: false, confidence: 0, semanticScore: 0, reasoning: 'Fusion analysis unavailable.' }
    return parseJSON(raw)
  } catch (err) {
    console.error('fuseIncidents error:', err)
    return { isRelated: false, confidence: 0, semanticScore: 0, reasoning: 'Fusion analysis failed.' }
  }
}

/**
 * CivicMind AI: Generate action recommendations for an incident
 * @param {object} incident - Incident data
 * @param {array} relatedReports - Array of related issue descriptions
 * @returns {Promise<{recommendations: [{action, timeframe, priority}]}>}
 */
export async function generateRecommendations(incident, relatedReports) {
  try {
    const reportSummary = relatedReports.slice(0, 5).map(r => r.description?.slice(0, 100)).filter(Boolean)
    const parts = [{
      text: `You are CivicMind AI advising city authorities. Generate a clear action plan for this civic incident.

Incident: "${incident.title}"
Category: ${incident.category}
Severity: ${incident.severity}
Related citizen reports (${relatedReports.length} total):
${reportSummary.map((d, i) => `${i + 1}. "${d}"`).join('\n')}

Return JSON only (no markdown):
{
  "recommendations": [
    { "action": "specific actionable step", "timeframe": "e.g. Within 24 hours", "priority": "Urgent|High|Normal" },
    { "action": "...", "timeframe": "...", "priority": "..." }
  ]
}

Provide 4-6 specific, actionable recommendations based on the actual reports.`,
    }]
    const raw = await callGemini(parts)
    if (!raw) return { recommendations: getDefaultRecommendations(incident.category) }
    const parsed = parseJSON(raw)
    return parsed?.recommendations ? parsed : { recommendations: getDefaultRecommendations(incident.category) }
  } catch (err) {
    console.error('generateRecommendations error:', err)
    return { recommendations: getDefaultRecommendations(incident.category) }
  }
}

/**
 * CivicMind AI: Generate human-readable explanation of why reports were fused
 * @param {object} incident - The incident
 * @param {array} relatedIssues - Related issue summaries with scores
 * @returns {Promise<string>} - Explanation paragraph
 */
export async function explainIncident(incident, relatedIssues) {
  try {
    const parts = [{
      text: `You are CivicMind AI. Explain in 2-3 sentences why these citizen reports were grouped into a single incident.

Incident: "${incident.title}"
Category: ${incident.category}
Number of reports: ${relatedIssues.length}
Geographic radius: ~${(incident.radius_km || 0.5).toFixed(1)} km
Average semantic similarity: ${Math.round(relatedIssues.reduce((s, r) => s + (r.semantic_score || 0), 0) / (relatedIssues.length || 1))}%

Explain clearly and concisely why the AI identified this as a single underlying incident. Mention the key signals (location, time, semantic similarity, category). Write for a city official reading a report. No bullet points, plain text only.`,
    }]
    const raw = await callGemini(parts)
    if (!raw) return `These ${relatedIssues.length} reports were grouped because they describe similar ${incident.category} issues in the same geographic area within a short time window.`
    return raw.trim()
  } catch (err) {
    console.error('explainIncident error:', err)
    return `These reports were grouped by AI based on semantic similarity, geographic proximity, and temporal correlation.`
  }
}

function getDefaultRecommendations(category) {
  const defaults = {
    Roads: [
      { action: 'Dispatch road inspection team to assess damage', timeframe: 'Within 24 hours', priority: 'Urgent' },
      { action: 'Place temporary warning signage and barricades', timeframe: 'Within 4 hours', priority: 'Urgent' },
      { action: 'Schedule road repair work', timeframe: 'Within 72 hours', priority: 'High' },
      { action: 'Monitor for additional related reports', timeframe: 'Ongoing', priority: 'Normal' },
    ],
    Water: [
      { action: 'Dispatch water department to inspect pipeline', timeframe: 'Within 24 hours', priority: 'Urgent' },
      { action: 'Arrange alternate water supply if needed', timeframe: 'Within 48 hours', priority: 'High' },
      { action: 'Repair or replace damaged infrastructure', timeframe: 'Within 72 hours', priority: 'High' },
    ],
    Electricity: [
      { action: 'Dispatch electrician team to inspect fault', timeframe: 'Within 12 hours', priority: 'Urgent' },
      { action: 'Restore power supply', timeframe: 'Within 24 hours', priority: 'Urgent' },
      { action: 'Inspect surrounding infrastructure for damage', timeframe: 'Within 48 hours', priority: 'High' },
    ],
    Sanitation: [
      { action: 'Dispatch sanitation crew to clear waste', timeframe: 'Within 24 hours', priority: 'High' },
      { action: 'Inspect and clear drainage blockage', timeframe: 'Within 48 hours', priority: 'High' },
      { action: 'Schedule regular pickup for affected area', timeframe: 'Ongoing', priority: 'Normal' },
    ],
  }
  return defaults[category] || [
    { action: 'Investigate reported issue', timeframe: 'Within 48 hours', priority: 'High' },
    { action: 'Take corrective action based on findings', timeframe: 'Within 72 hours', priority: 'Normal' },
    { action: 'Monitor for further reports', timeframe: 'Ongoing', priority: 'Normal' },
  ]
}
