-- ============================================================
-- Community Hero — Supabase Database Schema
-- Run this in Supabase SQL Editor: supabase.com/dashboard/project/_/sql
-- ============================================================

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  ward text,
  points integer default 0,
  badges jsonb default '[]',
  role text default 'citizen',
  created_at timestamptz default now()
);

-- Issues
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  title text not null,
  description text,
  category text,
  severity text default 'Medium',
  status text default 'Submitted',
  lat double precision,
  lng double precision,
  address text,
  media_urls jsonb default '[]',
  ai_category text,
  ai_severity text,
  ai_reasoning text,
  ai_priority_score integer default 50,
  vote_genuine integer default 0,
  vote_fake integer default 0,
  vote_resolved integer default 0,
  vote_needs_proof integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Community votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  user_id uuid references public.profiles(id),
  vote_type text,
  created_at timestamptz default now(),
  unique(issue_id, user_id)
);

-- Status history / timeline
create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  old_status text,
  new_status text,
  actor_id uuid references public.profiles(id),
  note text,
  created_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  issue_id uuid references public.issues(id) on delete cascade,
  type text,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Resolution proof
create table public.resolution_proof (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  admin_id uuid references public.profiles(id),
  media_urls jsonb default '[]',
  note text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.votes enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.resolution_proof enable row level security;

-- RLS Policies
create policy "Public read issues" on public.issues for select using (true);
create policy "Auth users insert issues" on public.issues for insert with check (auth.uid() = user_id);
create policy "Owner or admin update issues" on public.issues for update using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);
create policy "Public read votes" on public.votes for select using (true);
create policy "Auth users vote" on public.votes for insert with check (auth.uid() = user_id);
create policy "Public read status history" on public.status_history for select using (true);
create policy "Admin insert status history" on public.status_history for insert with check (
  exists (select 1 from public.profiles where id = auth.uid())
);
create policy "Own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Public read resolution proof" on public.resolution_proof for select using (true);
create policy "Admin insert resolution proof" on public.resolution_proof for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for issues
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger issues_updated_at
  before update on public.issues
  for each row execute function public.update_updated_at();

-- ============================================================
-- CivicEye Migrations — run these if upgrading from Community Hero
-- ============================================================

-- Landmark column on issues (helps authorities find exact spot)
alter table public.issues add column if not exists landmark text;

-- Feedback / satisfaction ratings for resolved issues
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  user_id uuid references public.profiles(id),
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(issue_id, user_id)
);

alter table public.feedback enable row level security;

create policy "Public read feedback" on public.feedback for select using (true);
create policy "Auth users insert feedback" on public.feedback for insert with check (auth.uid() = user_id);

-- ============================================================
-- CivicMind AI — QuantumHacks New Tables
-- Run in Supabase SQL Editor AFTER the base schema above
-- ============================================================

-- AI-fused city-level incidents (multiple reports → 1 incident)
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  severity text default 'Medium',
  status text default 'Emerging',
  lat double precision,
  lng double precision,
  address text,
  radius_km double precision default 0.5,
  affected_population integer default 0,
  report_count integer default 1,
  priority_score integer default 50,
  ai_confidence integer default 0,
  ai_fusion_reasoning text,
  assigned_authority text,
  first_reported_at timestamptz default now(),
  last_report_at timestamptz default now(),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- M2M: citizen reports linked to an incident
create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  issue_id uuid references public.issues(id) on delete cascade,
  similarity_score integer default 0,
  semantic_score integer default 0,
  location_score integer default 0,
  time_score integer default 0,
  category_score integer default 0,
  added_at timestamptz default now(),
  unique(incident_id, issue_id)
);

-- Explainable priority score breakdown per incident
create table if not exists public.incident_scores (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade unique,
  severity_pts integer default 0,
  report_count_pts integer default 0,
  geo_spread_pts integer default 0,
  time_persistence_pts integer default 0,
  category_urgency_pts integer default 0,
  recurrence_pts integer default 0,
  total_score integer default 0,
  computed_at timestamptz default now()
);

-- AI-generated action recommendations per incident
create table if not exists public.incident_recommendations (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  step_number integer not null,
  action text not null,
  timeframe text,
  priority text default 'Normal',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.incidents enable row level security;
alter table public.incident_reports enable row level security;
alter table public.incident_scores enable row level security;
alter table public.incident_recommendations enable row level security;

-- RLS Policies
create policy "Public read incidents" on public.incidents for select using (true);
create policy "Auth insert incidents" on public.incidents for insert with check (auth.uid() is not null);
create policy "Auth update incidents" on public.incidents for update using (auth.uid() is not null);

create policy "Public read incident_reports" on public.incident_reports for select using (true);
create policy "Auth insert incident_reports" on public.incident_reports for insert with check (auth.uid() is not null);

create policy "Public read incident_scores" on public.incident_scores for select using (true);
create policy "Auth upsert incident_scores" on public.incident_scores for insert with check (auth.uid() is not null);
create policy "Auth update incident_scores" on public.incident_scores for update using (auth.uid() is not null);

create policy "Public read incident_recommendations" on public.incident_recommendations for select using (true);
create policy "Auth insert incident_recommendations" on public.incident_recommendations for insert with check (auth.uid() is not null);

-- Updated_at trigger for incidents
create trigger incidents_updated_at
  before update on public.incidents
  for each row execute function public.update_updated_at();

-- Indexes for performance
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_severity on public.incidents(severity);
create index if not exists idx_incidents_lat_lng on public.incidents(lat, lng);
create index if not exists idx_incident_reports_incident on public.incident_reports(incident_id);
create index if not exists idx_incident_reports_issue on public.incident_reports(issue_id);
