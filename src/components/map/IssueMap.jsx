import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import CategoryBadge from '../ui/CategoryBadge'
import StatusBadge from '../ui/StatusBadge'
import { SEVERITIES } from '../../utils/constants'
import 'leaflet/dist/leaflet.css'

const getSeverityColor = (severity) => {
  return SEVERITIES.find(s => s.value === severity)?.mapColor || '#CA8A04'
}

export default function IssueMap({ issues = [], height = '500px', center = [18.5204, 73.8567], zoom = 12 }) {
  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {issues.map(issue => {
          if (!issue.lat || !issue.lng) return null
          const color = getSeverityColor(issue.severity)
          const totalVotes = (issue.vote_genuine || 0) + (issue.vote_fake || 0) + (issue.vote_resolved || 0) + (issue.vote_needs_proof || 0)

          return (
            <CircleMarker
              key={issue.id}
              center={[issue.lat, issue.lng]}
              radius={issue.severity === 'Critical' ? 14 : issue.severity === 'High' ? 11 : 8}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.85,
                color: '#fff',
                weight: 2,
              }}
            >
              <Popup className="issue-popup" minWidth={220}>
                <div className="p-1">
                  <div className="flex gap-1 mb-2 flex-wrap">
                    <CategoryBadge category={issue.category} />
                    <StatusBadge status={issue.status} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
                    {issue.title}
                  </h4>
                  {issue.address && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{issue.address}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">✅ {issue.vote_genuine || 0} · 👍 {totalVotes}</span>
                    <Link
                      to={`/issues/${issue.id}`}
                      className="text-xs bg-teal-600 text-white px-2 py-1 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Severity</p>
        {SEVERITIES.map(s => (
          <div key={s.value} className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ background: s.mapColor }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
