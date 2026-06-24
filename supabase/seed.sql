-- ============================================================
-- Community Hero — Seed Data
-- Run AFTER schema.sql and AFTER creating users via the app or Supabase Auth UI
-- Replace UUIDs with actual user IDs from your auth.users table
-- ============================================================

-- First: Create admin user manually in Supabase Auth UI:
-- Email: admin@communityhero.in  Password: Admin@123456
-- Then update the profile:
-- UPDATE public.profiles SET role = 'admin', name = 'Admin User', ward = 'PMC Ward 1' 
-- WHERE email = 'admin@communityhero.in';

-- Seed issues (coordinates around Pune 18.5204, 73.8567)
-- Note: Replace 'seed-user-id-here' with actual profile UUIDs

INSERT INTO public.issues (title, description, category, severity, status, lat, lng, address, ai_category, ai_severity, ai_reasoning, ai_priority_score, vote_genuine, vote_fake, created_at)
VALUES
  (
    'Large pothole on FC Road near Pune University gate',
    'There is a massive pothole that has been causing accidents. Multiple two-wheelers have fallen. About 2 feet wide and 8 inches deep. Urgent repair needed.',
    'Roads', 'Critical', 'In Progress',
    18.5272, 73.8479,
    'FC Road, Shivajinagar, Pune - 411005',
    'Roads', 'Critical', 'Large pothole poses immediate safety risk to commuters.', 92,
    12, 0, now() - interval '5 days'
  ),
  (
    'Water pipeline burst on MG Road',
    'Underground water pipe burst causing road waterlogging and water wastage. Water has been flowing for 2 days. Causing traffic disruption.',
    'Water', 'High', 'Verified',
    18.5236, 73.8701,
    'MG Road, Camp, Pune - 411001',
    'Water', 'High', 'Burst pipeline causing significant water loss and traffic disruption.', 78,
    8, 1, now() - interval '3 days'
  ),
  (
    'Street lights not working for 2 weeks - Kothrud',
    'Entire stretch of Paud Road from Vanaz to Karve Nagar has no street lighting since 10 days. Very dangerous at night for pedestrians.',
    'Electricity', 'High', 'Submitted',
    18.5074, 73.8157,
    'Paud Road, Kothrud, Pune - 411038',
    'Electricity', 'High', 'Extended outage of street lighting creates serious safety hazard.', 72,
    6, 0, now() - interval '10 days'
  ),
  (
    'Garbage dump blocking footpath - Hadapsar',
    'Huge pile of garbage blocking the entire footpath near Hadapsar bus stand. Foul smell. No garbage pickup for 5 days.',
    'Sanitation', 'Medium', 'Submitted',
    18.5059, 73.9260,
    'Hadapsar Bus Stand, Hadapsar, Pune - 411028',
    'Sanitation', 'Medium', 'Uncollected waste causing public health concern and obstruction.', 55,
    5, 0, now() - interval '5 days'
  ),
  (
    'Illegal construction blocking drainage - Baner',
    'A builder has constructed a boundary wall on the drainage channel, causing flooding in the entire street during rain. PMC permission not taken.',
    'Encroachment', 'High', 'Verified',
    18.5590, 73.7893,
    'Baner Road, Baner, Pune - 411045',
    'Encroachment', 'High', 'Illegal construction blocking drainage poses serious flood risk.', 80,
    9, 2, now() - interval '7 days'
  ),
  (
    'Transformer exploded - power cut in Viman Nagar',
    'Transformer near D-Mart Viman Nagar has exploded. Entire residential area without power for 18 hours. Many houses affected.',
    'Electricity', 'Critical', 'In Progress',
    18.5648, 73.9144,
    'Viman Nagar, Pune - 411014',
    'Electricity', 'Critical', 'Transformer explosion causing widespread power outage in residential area.', 95,
    15, 0, now() - interval '1 day'
  ),
  (
    'Manhole open without cover - Aundh',
    'Open manhole on ITI road Aundh. No barricade or warning sign. Child fell partially in yesterday. Extremely dangerous.',
    'Roads', 'Critical', 'Submitted',
    18.5598, 73.8078,
    'ITI Road, Aundh, Pune - 411007',
    'Roads', 'Critical', 'Open uncovered manhole poses immediate danger especially to children.', 98,
    11, 0, now() - interval '2 days'
  ),
  (
    'Sewage overflow on street - Bibwewadi',
    'Sewage line is blocked and overflowing onto the main street. Very unhygienic. Citizens unable to walk. Foul smell spreading to nearby homes.',
    'Sanitation', 'High', 'Verified',
    18.4762, 73.8616,
    'Bibwewadi Main Road, Bibwewadi, Pune - 411037',
    'Sanitation', 'High', 'Sewage overflow creates serious public health hazard.', 82,
    7, 0, now() - interval '4 days'
  ),
  (
    'Road dug up for pipeline, not repaired for 3 months',
    'PMC dug the road for water pipeline 3 months ago but has not repaired it. Huge crater. Traffic snarls daily. Accidents happening.',
    'Roads', 'Medium', 'Submitted',
    18.5316, 73.8478,
    'JM Road, Deccan Gymkhana, Pune - 411004',
    'Roads', 'Medium', 'Long-term unrepaired road excavation causing persistent traffic problems.', 60,
    4, 0, now() - interval '90 days'
  ),
  (
    'Water tanker mafia in Kondhwa - no municipal supply',
    'Municipal water supply has been erratic for 2 months. Private tanker mafia charging Rs 1500 per trip. PMC must restore regular supply.',
    'Water', 'Medium', 'Resolved',
    18.4673, 73.8840,
    'Kondhwa Road, Kondhwa, Pune - 411048',
    'Water', 'Medium', 'Irregular municipal supply forcing residents to depend on expensive private tankers.', 58,
    6, 1, now() - interval '20 days'
  );
