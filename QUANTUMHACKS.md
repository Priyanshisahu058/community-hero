# QUANTUMHACKS.md — CivicMind AI

## QuantumHacks 2026 Disclosure

This document provides a transparent, honest accounting of what existed before QuantumHacks and what was built during the hackathon period.

---

## PRE-EXISTING FOUNDATION (Community Hero)

The following features, code, and infrastructure existed BEFORE QuantumHacks began:

### Core Application (Pre-existing)

| Feature | Status |
|---------|--------|
| React 18 + Vite + TailwindCSS setup | Pre-existing |
| Supabase backend configuration | Pre-existing |
| Supabase Auth (login/register/profiles) | Pre-existing |
| `issues` table with all columns | Pre-existing |
| `votes`, `status_history`, `notifications`, `resolution_proof`, `feedback` tables | Pre-existing |
| `profiles` table with points/badges/roles | Pre-existing |
| `ReportIssue.jsx` — multi-step form | Pre-existing |
| `IssueDetail.jsx` — issue view | Pre-existing |
| `AdminDashboard.jsx` — admin queue | Pre-existing |
| `Home.jsx` — feed/map view | Pre-existing |
| `MapView.jsx` — Leaflet map | Pre-existing |
| `Profile.jsx` — leaderboard/points | Pre-existing |
| `IssueMap.jsx` — CircleMarker map | Pre-existing |
| Gamification (points, badges) | Pre-existing |
| Gemini AI: `categorizeIssue()` | Pre-existing |
| Gemini AI: `scoreSeverity()` | Pre-existing |
| Gemini AI: `checkDuplicate()` | Pre-existing |
| Leaflet/react-leaflet integration | Pre-existing |
| Recharts integration | Pre-existing |
| Zustand state management | Pre-existing |
| React Query setup | Pre-existing |
| Dark mode support | Pre-existing |
| Notification system | Pre-existing |

---

## BUILT DURING QUANTUMHACKS (CivicMind AI Layer)

The following features, code, and infrastructure were built **during** the QuantumHacks hackathon period:

### New Database Tables

| Table | Purpose |
|-------|---------|
| `incidents` | AI-fused city-level incident records |
| `incident_reports` | M2M link: citizen reports ↔ incidents with similarity scores |
| `incident_scores` | Explainable priority score breakdown per incident |
| `incident_recommendations` | AI-generated action steps per incident |

### New AI Capabilities (built on existing Gemini setup)

| Function | Purpose |
|----------|---------|
| `fuseIncidents()` in `gemini.js` | Semantic similarity reasoning across multiple reports |
| `generateRecommendations()` in `gemini.js` | AI-generated actionable steps for authorities |
| `explainIncident()` in `gemini.js` | Human-readable AI reasoning narrative |
| `src/services/incidentFusion.js` | **Core CivicMind AI Fusion Engine** |

### New AI Fusion Engine (`src/services/incidentFusion.js`)

The core innovation of QuantumHacks. This engine:
1. Receives a newly submitted citizen report
2. Fetches geographically nearby issues (within 1.5km, 48h window)
3. Calls Gemini to compute semantic similarity between reports
4. Combines: semantic + geographic + temporal + category scores
5. If confidence ≥ 60%: attaches report to existing incident OR creates a new one
6. Recomputes explainable priority score (6 transparent factors)
7. Stores fusion reasoning for admin review
8. Asynchronously generates AI action recommendations
9. Fires non-blocking (user never waits for AI)

### New Pages

| Page | Route | Purpose |
|------|-------|---------|
| `CityIntelligence.jsx` | `/intelligence` | Flagship dashboard: stat cards, charts, incident map, list |
| `IncidentDetail.jsx` | `/incidents/:id` | Deep-dive: fusion explainer, priority breakdown, related reports, map |
| `EvaluationMode.jsx` | `/intelligence/evaluate` | Prototype demo with synthetic data (labeled clearly) |

### New Components

| Component | Purpose |
|-----------|---------|
| `IncidentCard.jsx` | Priority-ranked incident card with AI confidence bar |
| `IncidentMap.jsx` | Leaflet map showing incident clusters (not raw reports) |
| `FusionExplainer.jsx` | Visual: Reports → AI Fusion → Incident with score bars |
| `PriorityMeter.jsx` | Animated SVG ring + 6-factor explainable breakdown |
| `RecommendationList.jsx` | Colour-coded AI action steps with disclaimer |
| `LifecycleTracker.jsx` | Incident lifecycle: Emerging → Verified → Resolved |

### New Services

| File | Purpose |
|------|---------|
| `src/services/incidents.js` | Full CRUD for new incident tables with React Query support |
| `src/services/incidentFusion.js` | AI Incident Fusion Engine (see above) |

### Modified Files

| File | Modification |
|------|-------------|
| `src/App.jsx` | Added 3 new routes; updated footer branding |
| `src/components/layout/Navbar.jsx` | Added "City Intelligence" link with AI badge |
| `src/pages/ReportIssue.jsx` | Added async fusion trigger post-submission |
| `src/index.css` | Added CivicMind AI animations and glass-card styles |
| `supabase/schema.sql` | Added 4 new tables (additive only, no existing changes) |

---

## The CivicMind AI Architecture

```
CITIZEN REPORTS
      ↓
AI ANALYZES (existing Gemini: category, severity, priority)
      ↓
AI INCIDENT FUSION (NEW: semantic + geo + temporal clustering)
      ↓
CITY INTELLIGENCE DASHBOARD (NEW: priority-ranked incidents)
      ↓
ADMIN VERIFIES & ASSIGNS (enhanced admin workflow)
      ↓
AUTHORITY RESOLVES (existing resolution proof system)
      ↓
CITIZEN SEES RESOLUTION (existing notification system)
```

---

## Hackathon Compliance Statement

- ✅ Built on existing foundation (not from scratch)
- ✅ All pre-existing features preserved
- ✅ Genuine new AI work built during hackathon
- ✅ No fake development history
- ✅ Synthetic demo data clearly labeled as such
- ✅ AI assists humans — does not replace verification
- ✅ No fabricated real-world statistics
- ✅ Open source libraries used (not claiming as original)

---

*CivicMind AI — QuantumHacks 2026*
*"From citizen reports to city-level intelligence."*
