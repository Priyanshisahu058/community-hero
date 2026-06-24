import { useState } from 'react'
import { Phone, X, AlertTriangle } from 'lucide-react'
import { ALL_EMERGENCY_DATA } from './EmergencyContacts'

const CATEGORY_LABELS = {
  Roads: '🚧 Roads & Traffic',
  Water: '💧 Water Supply',
  Electricity: '⚡ Electricity',
  Sanitation: '🗑️ Sanitation & Garbage',
  Encroachment: '🏛️ Encroachment',
  Other: '📞 General & Emergency',
}

/**
 * Floating Emergency button (bottom-left, fixed) + full-screen modal
 * with all contacts organized by category. Rendered globally in App.jsx.
 */
export default function EmergencyModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        id="emergency-floating-btn"
        onClick={() => setOpen(true)}
        aria-label="Open emergency contacts"
        className="fixed bottom-6 left-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-bold rounded-full shadow-lg shadow-red-500/40 transition-all duration-200 group"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <AlertTriangle size={15} />
        Emergency
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-white" />
                <h2 className="font-black text-white text-base">Emergency Contacts — Pune</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              {Object.entries(ALL_EMERGENCY_DATA).map(([cat, contacts]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    {CATEGORY_LABELS[cat] || cat}
                  </p>
                  <div className="space-y-2">
                    {contacts.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/40 rounded-xl px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">{c.icon}</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {c.label}
                          </span>
                        </div>
                        <a
                          href={`tel:${c.number}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 shadow-sm"
                        >
                          <Phone size={11} />
                          {c.number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-400 text-center">
                Tap a number to call. All numbers are for Pune city.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
