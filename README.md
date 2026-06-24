# CivicEye 👁️

> AI-powered hyperlocal civic issue reporting and resolution platform | BlockseBlock Hackathon 2026

## Features

- 📸 **Report Issues** — 4-step guided form with photo upload & GPS location
- 🤖 **AI Analysis** — Gemini 2.0 Flash auto-categorizes, scores severity, detects duplicates
- 🗳️ **Community Polls** — Citizens vote Genuine / Fake / Resolved / Needs Proof
- 🗺️ **Interactive Map** — Leaflet map with colour-coded severity markers
- ⚡ **Realtime Notifications** — Supabase Realtime push notifications
- 🏅 **Gamification** — Points, level badges, and leaderboard
- 🛡️ **Admin Dashboard** — Issue queue, status workflow, resolution proof upload
- 📊 **Analytics** — Recharts category/severity breakdown charts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Routing | React Router v6 |
| State | Zustand + React Query |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| AI | Gemini 2.0 Flash REST API |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Recharts |
| Deployment | Vercel |

## Quick Start

### 1. Setup Environment
```bash
cp .env.example .env
# Fill in your Supabase URL, anon key, and Gemini API key
```

### 2. Setup Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Create a **public** Storage bucket named `issue-media`
4. (Optional) Run `supabase/seed.sql` for demo data

### 3. Install & Run
```bash
npm install
npm run dev
```

Visit: `http://localhost:5173`

### 4. Create Admin User
1. Register at `/register`
2. In Supabase SQL editor: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';`

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

## Deploy to Vercel

```bash
npx vercel --prod
# Add the 3 env vars in Vercel dashboard
```

## Project Structure

```
src/
├── components/
│   ├── layout/       # Navbar, Sidebar, NotificationBell
│   ├── issues/       # IssueCard, CommunityPoll, IssueTimeline, ResolutionProof
│   ├── map/          # IssueMap (react-leaflet)
│   ├── admin/        # AdminIssueQueue, AdminIssueDetail
│   ├── gamification/ # PointsBadge, Leaderboard
│   └── ui/           # SeverityBadge, StatusBadge, CategoryBadge
├── pages/            # Home, ReportIssue, IssueDetail, MapView, Profile, Admin, Auth
├── services/         # supabase.js, gemini.js, issues.js, votes.js, notifications.js
├── hooks/            # useAuth, useIssues, useGeolocation, useNotifications
├── store/            # authStore (Zustand)
└── utils/            # constants.js, imageCompress.js
```

## Points & Badges

| Action | Points |
|--------|--------|
| Report submitted | +10 |
| Report verified (5+ votes) | +20 |
| Cast a vote | +5 |
| Issue resolved | +15 |

| Badge | Requirement |
|-------|------------|
| 🏅 First Report | Submit 1 issue |
| 🛡️ Community Guardian | Cast 10 votes |
| 🔧 Problem Solver | 5 issues resolved |
| 🌟 Top Reporter | 20 issues submitted |
| 🔥 Streak Hero | 7 consecutive days |

---

© 2026 CivicEye. Built for BlockseBlock Hackathon.
