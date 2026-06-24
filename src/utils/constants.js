export const CATEGORIES = [
  { value: 'Roads', label: 'Roads', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: '🛣️' },
  { value: 'Water', label: 'Water', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: '💧' },
  { value: 'Electricity', label: 'Electricity', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: '⚡' },
  { value: 'Sanitation', label: 'Sanitation', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: '🗑️' },
  { value: 'Encroachment', label: 'Encroachment', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: '🚧' },
  { value: 'Other', label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: '📌' },
]

export const SEVERITIES = [
  { value: 'Low', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', mapColor: '#16A34A' },
  { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500', mapColor: '#CA8A04' },
  { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500', mapColor: '#D97706' },
  { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', mapColor: '#DC2626' },
]

export const STATUSES = [
  { value: 'Submitted', label: 'Submitted', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'Verified', label: 'Verified', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'Resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'Closed', label: 'Closed', color: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
]

export const VOTE_TYPES = {
  genuine: { label: 'Genuine', icon: '✅', color: 'text-green-600' },
  fake: { label: 'Fake', icon: '❌', color: 'text-red-600' },
  resolved: { label: 'Already Resolved', icon: '✔️', color: 'text-blue-600' },
  needs_proof: { label: 'Needs Proof', icon: '📷', color: 'text-yellow-600' },
}

export const BADGES = [
  { id: 'first_report', label: 'First Report', icon: '🏅', description: 'Submitted your first issue' },
  { id: 'community_guardian', label: 'Community Guardian', icon: '🛡️', description: 'Cast 10 verification votes' },
  { id: 'problem_solver', label: 'Problem Solver', icon: '🔧', description: '5 issues resolved' },
  { id: 'top_reporter', label: 'Top Reporter', icon: '🌟', description: '20 issues submitted' },
  { id: 'streak_hero', label: 'Streak Hero', icon: '🔥', description: '7 consecutive days of activity' },
]

export const POINTS = {
  REPORT_SUBMITTED: 10,
  REPORT_VERIFIED: 20,
  CAST_VOTE: 5,
  ISSUE_RESOLVED: 15,
}

export const WARD_OPTIONS = [
  'PMC Ward 1', 'PMC Ward 2', 'PMC Ward 3', 'PMC Ward 4', 'PMC Ward 5',
  'Shivajinagar', 'Deccan', 'Kothrud', 'Baner', 'Aundh', 'Viman Nagar',
  'Hadapsar', 'Kondhwa', 'Bibwewadi', 'Wanowrie', 'Katraj',
]
