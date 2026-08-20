import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { AlertTriangle, Users } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

const SEVERITY_COLORS = {
  Critical: '#DC2626', High: '#D97706', Medium: '#CA8A04', Low: '#16A34A',
}
const SEVERITY_RADIUS = { Critical: 20, High: 15, Medium: 11, Low: 8 }

const STATUS_COLORS = {
  Emerging: '#8B5CF6', Verified: '#3B82F6', Assigned: '#6366F1',
  'In Progress': '#F59E0B', Resolved: '#10B981', Monitoring: '#14B8A6',
}

export default function IncidentMap({ incidents = [], height = '500px', center = [18.5204, 73.8567], zoom = 12 }) {
  return (
    <div style={{ height }} className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidents.map(incident => {
          if (!incident.lat || !incident.lng) return null
          const sevColor = SEVERITY_COLORS[incident.severity] || '#CA8A04'
          const radius = SEVERITY_RADIUS[incident.severity] || 11

          return (
            <CircleMarker
              key={incident.id}
              center={[incident.lat, incident.lng]}
              radius={radius}
              pathOptions={{
                fillColor: sevColor,
                fillOpacity: 0.82,
                color: '#fff',
                weight: 2.5,
              }}
            >
              <Popup minWidth={240}>
                <div className="p-1">
                  {/* Header badges */}
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: sevColor + '22', color: sevColor }}>
                      {incident.severity}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {incident.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
                    {incident.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={11} />
                      {incident.report_count} report{incident.report_count !== 1 ? 's' : ''}
                    </span>
                    {incident.affected_population > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        ~{incident.affected_population.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {/* Priority bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Priority</span>
                      <span className="font-bold text-gray-800">{incident.priority_score}/100</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${incident.priority_score}%`, background: sevColor }} />
                    </div>
                  </div>
                  <Link
                    to={`/incidents/${incident.id}`}
                    className="block text-center text-xs font-semibold py-1.5 px-3 rounded-lg text-white mt-2"
                    style={{ background: sevColor }}
                  >
                    View Incident →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100 dark:border-gray-800">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Severity</p>
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{sev}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
          <p className="text-[9px] text-gray-400 text-center">Circle size = severity</p>
        </div>
      </div>

      {/* Incident count badge */}
      <div className="absolute top-4 right-4 z-10 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
        {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
