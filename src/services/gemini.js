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
