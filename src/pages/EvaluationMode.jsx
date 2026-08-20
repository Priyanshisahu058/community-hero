import { useState } from 'react'
import { Brain, Play, CheckCircle2, AlertTriangle, TrendingUp, Zap, ChevronRight, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Evaluation / Impact Mode — Prototype demonstration.
 * Uses synthetic demo data to show the AI Incident Fusion pipeline.
 * All data is clearly labeled as SYNTHETIC / PROTOTYPE.
 */

// Synthetic demo scenarios — clearly fictional, labeled as demo data
const DEMO_SCENARIOS = [
  {
    id: 'scenario-1',
    category: 'Roads',
    reports: [
      { text: 'Huge pothole near the college gate, two-wheelers are falling.', time: '0h ago' },
      { text: 'Road damaged outside the university entrance. Dangerous.', time: '4h ago' },
      { text: 'Accident caused by broken road near campus.', time: '11h ago' },
      { text: 'Large crater on the road near university. No warning signs.', time: '18h ago' },
    ],
    result: {
      title: 'Major Road Hazard Near University',
      severity: 'Critical',
      confidence: 94,
      scores: { semantic: 91, location: 88, time: 95, category: 100 },
      priority: 89,
      recommendations: [
        'Inspect road section within 24 hours',
        'Place temporary warning signage immediately',
        'Dispatch road maintenance team',
        'Review accident reports with traffic department',
        'Monitor for additional related reports',
      ],
    },
  },
  {
    id: 'scenario-2',
    category: 'Water',
    reports: [
      { text: 'Water pipeline burst on main road. Water flowing since yesterday.', time: '2h ago' },
      { text: 'Flooded road due to burst water pipe near junction.', time: '8h ago' },
      { text: 'Water wastage on the road. Pipe seems broken.', time: '14h ago' },
    ],
    result: {
      title: 'Water Pipeline Rupture — Road Flooding',
      severity: 'High',
      confidence: 88,
      scores: { semantic: 85, location: 92, time: 87, category: 100 },
      priority: 72,
      recommendations: [
        'Dispatch water department to isolate burst pipe',
        'Drain accumulated water from road',
        'Arrange alternate supply for affected buildings',
        'Complete pipe repair within 48 hours',
      ],
    },
  },
  {
    id: 'scenario-3',
    category: 'Electricity',
    reports: [
      { text: 'Street lights not working on main road for 3 days.', time: '1h ago' },
      { text: 'No street lighting near bus stop. Very unsafe at night.', time: '9h ago' },
      { text: 'All lights on the stretch from junction to school are off.', time: '20h ago' },
    ],
    result: {
      title: 'Street Lighting Failure — Extended Outage',
      severity: 'High',
      confidence: 82,
      scores: { semantic: 79, location: 85, time: 83, category: 100 },
      priority: 63,
      recommendations: [
        'Inspect electrical fault on affected stretch',
        'Restore street lighting within 24 hours',
        'Deploy temporary lighting at key points',
        'Schedule preventive maintenance inspection',
      ],
    },
  },
]

const DEMO_STATS = {
  totalReports: 50,
  incidentsIdentified: 17,
  mergedReports: 33,
  criticalIncidents: 5,
  avgProcessingMs: 340,
  fusionAccuracy: '91%',
}

function SimScore({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full animate-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export default function EvaluationMode() {
  const navigate = useNavigate()
  const [activeScenario, setActiveScenario] = useState(null)
  const [step, setStep] = useState(0) // 0=idle 1=processing 2=done

  const runScenario = (scenario) => {
    setActiveScenario(scenario)
    setStep(1)
    setTimeout(() => setStep(2), 1800)
  }

  const SEVER_COLORS = { Critical: '#DC2626', High: '#D97706', Medium: '#CA8A04', Low: '#16A34A' }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ai-glow">
              <Zap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Evaluation Mode</h1>
              <p className="text-purple-300 text-sm">AI Incident Fusion — Prototype Demonstration</p>
            </div>
          </div>

          {/* Synthetic data disclaimer */}
          <div className="bg-white/10 rounded-xl p-3 flex items-start gap-2 mt-4">
            <Info size={14} className="text-yellow-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-200 leading-relaxed">
              <strong className="text-yellow-300">PROTOTYPE SIMULATION</strong> — All scenarios below use synthetic demonstration data.
              They are designed to illustrate how CivicMind AI groups citizen reports into city-level incidents.
              These are NOT real reports from real citizens.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Overall Demo Stats ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Simulated Prototype Metrics <span className="text-purple-500 normal-case font-medium">(Synthetic data)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Reports Processed', value: DEMO_STATS.totalReports, color: '#6366F1', icon: '📋' },
              { label: 'Incidents Identified', value: DEMO_STATS.incidentsIdentified, color: '#8B5CF6', icon: '🧠' },
              { label: 'Reports Merged', value: DEMO_STATS.mergedReports, color: '#0EA5E9', icon: '🔗' },
              { label: 'Critical Incidents', value: DEMO_STATS.criticalIncidents, color: '#DC2626', icon: '🚨' },
              { label: 'Avg Processing', value: DEMO_STATS.avgProcessingMs + 'ms', color: '#10B981', icon: '⚡' },
              { label: 'Fusion Accuracy', value: DEMO_STATS.fusionAccuracy, color: '#F59E0B', icon: '🎯' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <span className="text-2xl block mb-1">{icon}</span>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── The main transformation ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-2">The CivicMind Transformation</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">From scattered citizen reports to actionable city intelligence</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
            {[
              { label: `${DEMO_STATS.totalReports}\nCitizen Reports`, bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
              { label: '↓\nAI Understands', bg: 'bg-indigo-600', text: 'text-white', glow: true },
              { label: `${DEMO_STATS.incidentsIdentified}\nUnique Incidents`, bg: 'bg-purple-600', text: 'text-white' },
              { label: '↓\nAI Explains Why', bg: 'bg-indigo-600', text: 'text-white', glow: true },
              { label: `${DEMO_STATS.criticalIncidents}\nCritical Incidents`, bg: 'bg-red-600', text: 'text-white' },
              { label: '↓\nAI Recommends', bg: 'bg-indigo-600', text: 'text-white', glow: true },
              { label: 'Prioritized\nAction Plan', bg: 'bg-green-600', text: 'text-white' },
            ].map(({ label, bg, text, glow }, idx) => (
              <div key={idx} className={`${bg} ${text} ${glow ? 'ai-glow' : ''} rounded-2xl px-4 py-3 font-bold text-sm whitespace-pre-line`}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Interactive Scenarios ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Interactive Fusion Scenarios <span className="text-purple-500 normal-case font-medium">(Demo)</span>
          </h2>

          <div className="space-y-4">
            {DEMO_SCENARIOS.map(scenario => (
              <div key={scenario.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Scenario header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  <span className="text-lg">{scenario.category === 'Roads' ? '🛣️' : scenario.category === 'Water' ? '💧' : '⚡'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{scenario.result.title}</p>
                    <p className="text-xs text-gray-500">{scenario.reports.length} citizen reports → 1 identified incident</p>
                  </div>
                  <button
                    onClick={() => runScenario(scenario)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow"
                  >
                    <Play size={12} /> Simulate
                  </button>
                </div>

                {/* Reports */}
                <div className="p-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Citizen Reports</p>
                  <div className="space-y-2 mb-4">
                    {scenario.reports.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs flex items-center justify-center text-gray-500 mt-0.5">{i+1}</span>
                        <div className="flex-1">
                          <span className="text-gray-700 dark:text-gray-300">"{r.text}"</span>
                          <span className="text-gray-400 text-xs ml-2">{r.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Result (only shown for active scenario after simulation) */}
                  {activeScenario?.id === scenario.id && step >= 1 && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                      {step === 1 && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">AI Incident Fusion running…</span>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="animate-fade-in">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 size={18} className="text-green-500" />
                            <span className="text-sm font-bold text-green-700 dark:text-green-400">Incident Identified</span>
                          </div>

                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-xl p-4 mb-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-0.5">IDENTIFIED INCIDENT</p>
                                <h3 className="text-base font-black text-gray-900 dark:text-white">{scenario.result.title}</h3>
                              </div>
                              <div className="text-center flex-shrink-0">
                                <p className="text-2xl font-black" style={{ color: SEVER_COLORS[scenario.result.severity] }}>
                                  {scenario.result.confidence}%
                                </p>
                                <p className="text-[10px] text-gray-400">Confidence</p>
                              </div>
                            </div>

                            {/* Similarity scores */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <SimScore label="Semantic Similarity" value={scenario.result.scores.semantic} color="#6366F1" />
                              <SimScore label="Location Proximity" value={scenario.result.scores.location} color="#0EA5E9" />
                              <SimScore label="Time Proximity" value={scenario.result.scores.time} color="#10B981" />
                              <SimScore label="Category Match" value={scenario.result.scores.category} color="#F59E0B" />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs px-2 py-1 rounded-full font-bold border" style={{
                                background: SEVER_COLORS[scenario.result.severity] + '15',
                                color: SEVER_COLORS[scenario.result.severity],
                                borderColor: SEVER_COLORS[scenario.result.severity] + '40',
                              }}>{scenario.result.severity}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">Priority: {scenario.result.priority}/100</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{scenario.reports.length} reports merged</span>
                            </div>
                          </div>

                          {/* Recommendations */}
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">AI Recommended Actions</p>
                          <div className="space-y-1.5">
                            {scenario.result.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                                <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">See real incidents from your city's data</p>
          <button
            onClick={() => navigate('/intelligence')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl"
          >
            <Brain size={16} /> Open City Intelligence Dashboard
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
