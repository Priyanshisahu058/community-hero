# CivicMind AI

> *From citizen reports to city-level intelligence.*

**QuantumHacks 2026** — Built on the Community Hero Foundation

---

## Problem

Cities receive thousands of fragmented civic complaints daily — potholes, water leaks, power outages. Each report is treated in isolation. Authorities are overwhelmed. No one can see the full picture.

**Result:** Critical incidents go unaddressed. Citizens lose trust. Cities fail to act efficiently.

---

## Solution

**CivicMind AI** transforms scattered citizen reports into prioritized, actionable city-level intelligence by using AI to:

1. **Understand** multiple reports about the same underlying problem
2. **Fuse** them into a single tracked incident
3. **Prioritize** with a transparent, explainable score
4. **Recommend** specific actions for city authorities
5. **Track** resolution from report to proof

---

## How It Works

```
CITIZEN SUBMITS REPORT
          ↓
    AI ANALYZES
    (Gemini: category, severity, priority)
          ↓
    AI INCIDENT FUSION
    (semantic + geographic + temporal clustering)
          ↓
    CITY INTELLIGENCE DASHBOARD
    (priority-ranked incidents for administrators)
          ↓
    ADMIN VERIFIES & ASSIGNS
    (human verification before action)
          ↓
    AUTHORITY RESOLVES
    (uploads resolution proof)
          ↓
    CITIZEN SEES RESOLUTION
    (notification + status update)
```

---

## AI Incident Fusion Engine

The core innovation. When a citizen submits a report, CivicMind AI:

1. Finds nearby reports within **1.5 km** and **48 hours**
2. Calls **Gemini** to compute **semantic similarity** between descriptions
3. Combines 4 signals into a **fusion confidence score**:
   - Semantic similarity (35%)
   - Geographic proximity (30%)
   - Temporal proximity (20%)
   - Category consistency (15%)
4. If confidence ≥ 60%: attaches report to existing incident
5. Otherwise: creates a new incident
6. Recomputes **explainable priority score** (6 transparent factors)
7. Stores AI reasoning for admin review

**Result:** 50 fragmented reports → 17 distinct, prioritized city incidents

---

## Explainable Priority Scoring

Every incident gets a priority score (0–100) with full transparency:

| Factor | Points |
|--------|--------|
| Severity level | Up to 40 |
| Report frequency | Up to 25 |
| Geographic spread | Up to 5 |
| Time persistence | Up to 10 |
| Safety category | Up to 10 |
| Recurrence | Up to 5 |
| **Total** | **100** |

No black boxes. Every point is explained.

---

## Technology Stack

### Pre-existing Foundation (Community Hero)
- React 18 + Vite
- TailwindCSS
- Supabase (PostgreSQL + Auth + Storage)
- Gemini 2.0 Flash (categorization, severity scoring)
- React Leaflet (maps)
- Recharts (charts)
- Zustand (state)
- React Query (caching)

### Built During QuantumHacks (CivicMind AI)
- AI Incident Fusion Engine (`incidentFusion.js`)
- Gemini: `fuseIncidents()`, `generateRecommendations()`, `explainIncident()`
- 4 new Supabase tables: `incidents`, `incident_reports`, `incident_scores`, `incident_recommendations`
- City Intelligence Dashboard (`/intelligence`)
- Incident Detail Page (`/incidents/:id`)
- Evaluation Mode (`/intelligence/evaluate`)
- 6 new incident components

---

## Demo Flow

1. Go to `/intelligence` — see City Intelligence Dashboard
2. Click **Run AI Fusion** (admin) — watch AI identify incidents from reports
3. Click any incident → see Fusion Explainer, Priority Breakdown, AI Recommendations
4. Go to `/intelligence/evaluate` — see interactive fusion simulation with synthetic demo data
5. Submit a new report → triggers async fusion in background

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key

### Installation

```bash
git clone <repo>
cd community-hero
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY
```

### Database

1. Run `supabase/schema.sql` in Supabase SQL Editor (base tables)
2. Run the CivicMind AI migration (lines 171+ of schema.sql)
3. Optionally run `supabase/seed.sql` for demo data

### Run

```bash
npm run dev
```

### Deploy

```bash
npm run build
firebase deploy --only hosting
```

---

## Project Structure

```
src/
├── pages/
│   ├── Home.jsx                    # [Foundation] Feed + map
│   ├── ReportIssue.jsx             # [Foundation + AI fusion trigger]
│   ├── IssueDetail.jsx             # [Foundation]
│   ├── AdminDashboard.jsx          # [Foundation]
│   ├── CityIntelligence.jsx        # [QuantumHacks] Dashboard
│   ├── IncidentDetail.jsx          # [QuantumHacks] Incident deep-dive
│   └── EvaluationMode.jsx          # [QuantumHacks] Demo mode
├── services/
│   ├── gemini.js                   # [Foundation + QuantumHacks AI functions]
│   ├── issues.js                   # [Foundation]
│   ├── incidents.js                # [QuantumHacks] Incident CRUD
│   └── incidentFusion.js           # [QuantumHacks] AI Fusion Engine
└── components/
    ├── incidents/                  # [QuantumHacks] All incident components
    └── ...                         # [Foundation] existing components
```

---

## QuantumHacks Disclosure

See [QUANTUMHACKS.md](./QUANTUMHACKS.md) for a full, honest accounting of what was pre-existing vs. built during the hackathon.

---

*CivicMind AI — QuantumHacks 2026*
