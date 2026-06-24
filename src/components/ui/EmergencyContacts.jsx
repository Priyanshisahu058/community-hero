import { Phone } from 'lucide-react'

// Emergency contacts keyed by issue category
const EMERGENCY_DATA = {
  Roads: [
    { label: 'PMC Roads Department', number: '020-25501000', icon: '🚧' },
    { label: 'Traffic Police Control', number: '100', icon: '🚔' },
  ],
  Water: [
    { label: 'PMC Water Supply', number: '020-25501111', icon: '💧' },
    { label: 'Emergency Water Helpline', number: '1916', icon: '🚰' },
  ],
  Electricity: [
    { label: 'MSEDCL Helpline', number: '1912', icon: '⚡' },
    { label: 'Power Emergency', number: '020-26120000', icon: '⚡' },
  ],
  Sanitation: [
    { label: 'PMC Solid Waste', number: '020-25501234', icon: '🗑️' },
    { label: 'Swachh Bharat Helpline', number: '1969', icon: '♻️' },
  ],
  Encroachment: [
    { label: 'PMC Encroachment Cell', number: '020-25506800', icon: '🏛️' },
    { label: 'Local Police', number: '100', icon: '👮' },
  ],
  Other: [
    { label: 'PMC General Helpline', number: '1800-233-0000', icon: '📞' },
    { label: 'Ambulance', number: '108', icon: '🚑' },
    { label: 'Fire Brigade', number: '101', icon: '🔥' },
  ],
}

export const ALL_EMERGENCY_DATA = EMERGENCY_DATA

/**
 * Inline emergency contacts card for IssueDetail page.
 * Shows contacts relevant to the issue's category.
 */
export default function EmergencyContacts({ category }) {
  const contacts = EMERGENCY_DATA[category] || EMERGENCY_DATA['Other']

  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Phone size={14} className="text-white" />
        </div>
        <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm">Emergency Contacts</h3>
      </div>
      <div className="space-y-2.5">
        {contacts.map((c, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 bg-white dark:bg-red-900/20 rounded-xl px-3 py-2.5 border border-red-100 dark:border-red-800/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">{c.icon}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{c.label}</span>
            </div>
            <a
              href={`tel:${c.number}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 shadow-sm"
              aria-label={`Call ${c.label}`}
            >
              <Phone size={11} />
              {c.number}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
