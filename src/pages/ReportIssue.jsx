import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import toast from 'react-hot-toast'
import { compressImage, fileToBase64, formatBytes } from '../utils/imageCompress'
import { CATEGORIES } from '../utils/constants'
import { createIssue, uploadIssueMedia, fetchNearbyIssues } from '../services/issues'
import { categorizeIssue, scoreSeverity, checkDuplicate } from '../services/gemini'
import { runIncidentFusion } from '../services/incidentFusion'
import useAuthStore from '../store/authStore'
import useGeolocation from '../hooks/useGeolocation'
import DuplicateModal from '../components/issues/DuplicateModal'
import { Upload, X, MapPin, Loader, ChevronRight, ChevronLeft, Sparkles, AlertTriangle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Drag-to-reposition marker
function DraggableMarker({ position, onMove }) {
  useMapEvents({
    click(e) { onMove(e.latlng) },
  })
  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{ dragend: (e) => onMove(e.target.getLatLng()) }}
    />
  ) : null
}

const STEPS = ['Details', 'Photos', 'Location', 'Review & Submit']

export default function ReportIssue() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { location, address, loading: geoLoading, locating, error: geoError, detectLocation, setLocation, reverseGeocode } = useGeolocation()

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [userCategory, setUserCategory] = useState('') // user override of AI category
  const [imageFiles, setImageFiles] = useState([]) // compressed File objects
  const [imagePreviews, setImagePreviews] = useState([]) // preview URLs
  const [videoFile, setVideoFile] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [severityResult, setSeverityResult] = useState(null)
  const [landmark, setLandmark] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [duplicateResult, setDuplicateResult] = useState(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [aiConfirmed, setAiConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const fileInputRef = useRef()

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3">You must be logged in to report an issue.</p>
          <button onClick={() => navigate('/login')} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
            Log in
          </button>
        </div>
      </div>
    )
  }

  const handleImageSelect = async (files) => {
    const MAX = 5
    const remaining = MAX - imageFiles.length
    const selected = [...files].slice(0, remaining)
    toast.loading(`Compressing ${selected.length} image${selected.length > 1 ? 's' : ''}...`, { id: 'compress' })
    const compressed = []
    const previews = []
    for (const file of selected) {
      try {
        const blob = await compressImage(file, 500)
        compressed.push(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        previews.push(URL.createObjectURL(blob))
      } catch {
        compressed.push(file)
        previews.push(URL.createObjectURL(file))
      }
    }
    setImageFiles(prev => [...prev, ...compressed])
    setImagePreviews(prev => [...prev, ...previews])
    toast.dismiss('compress')
    toast.success(`${compressed.length} photo${compressed.length > 1 ? 's' : ''} added ✓`)
  }

  const removeImage = (idx) => {
    URL.revokeObjectURL(imagePreviews[idx])
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const runAiAnalysis = async () => {
    setAiLoading(true)
    setAiConfirmed(false)
    try {
      let base64 = null
      if (imageFiles.length > 0) {
        base64 = await fileToBase64(imageFiles[0])
      }
      const [cat, sev] = await Promise.all([
        categorizeIssue(base64, description),
        scoreSeverity(base64, description, category || 'Other'),
      ])
      setAiResult(cat)
      setSeverityResult(sev)
      // Pre-fill userCategory with AI suggestion
      if (cat?.category) setUserCategory(cat.category)

      // Duplicate check
      if (location) {
        const nearby = await fetchNearbyIssues(location.lat, location.lng, 0.5)
        const dup = await checkDuplicate({ title, description, category: cat?.category || category }, nearby)
        setDuplicateResult(dup)
        if (dup?.isDuplicate) {
          setShowDuplicateModal(true)
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err)
      toast.error('AI analysis failed — you can still submit manually')
    } finally {
      setAiLoading(false)
    }
  }

  const handleNext = async () => {
    if (step === 0) {
      const errs = {}
      if (!title.trim() || title.trim().length < 10) errs.title = 'Title must be at least 10 characters'
      if (!description.trim() || description.trim().length < 20) errs.description = 'Description must be at least 20 characters'
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        toast.error(Object.values(errs)[0])
        return
      }
      setFieldErrors({})
    }
    if (step === 2) {
      if (!location) { toast.error('Please set your location'); return }
      // Trigger AI analysis when moving to review
      await runAiAnalysis()
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!location) { toast.error('Location is required'); return }
    if (!title.trim()) { toast.error('Title is required'); return }
    setSubmitting(true)
    try {
      // Upload media
      let mediaUrls = []
      if (imageFiles.length > 0) {
        toast.loading('Uploading photos...', { id: 'upload' })
        mediaUrls = await uploadIssueMedia([...imageFiles, ...(videoFile ? [videoFile] : [])], user.id)
        toast.dismiss('upload')
      }

      const finalCategory = userCategory || aiResult?.category || category || 'Other'
      const finalSeverity = severityResult?.severity || aiResult?.severity || 'Medium'

      const issueData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        severity: finalSeverity,
        lat: location.lat,
        lng: location.lng,
        address,
        landmark: landmark.trim() || null,
        media_urls: mediaUrls,
        ai_category: aiResult?.category,
        ai_severity: severityResult?.severity || aiResult?.severity,
        ai_reasoning: severityResult?.reasoning || aiResult?.reasoning,
        ai_priority_score: severityResult?.priorityScore || 50,
      }

      const created = await createIssue(issueData)
      toast.success('🎉 Issue reported! +10 points earned')
      navigate(`/issues/${created.id}`)

      // ── CivicMind AI: Trigger Incident Fusion asynchronously ──
      // Does NOT block the user — fires in background after navigation
      if (created?.id) {
        setTimeout(() => {
          runIncidentFusion(created)
            .then(result => {
              if (result.action !== 'error' && result.action !== 'skipped') {
                console.info('[CivicMind AI] Incident fusion:', result)
              }
            })
            .catch(err => console.error('[CivicMind AI] Fusion error:', err))
        }, 500)
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Failed to submit issue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Step progress
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
            i < step ? 'bg-teal-600 text-white' : i === step ? 'bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-900/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-teal-700 dark:text-teal-400' : 'text-gray-400'}`}>{s}</span>
          {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-teal-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Report a Civic Issue</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Help improve your community — earn 10 points</p>
        </div>

        <StepIndicator />

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-6 animate-fade-in">
          {/* STEP 0: Details */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Issue Details</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input
                  id="issue-title-input"
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setFieldErrors(p => ({ ...p, title: undefined })) }}
                  placeholder="e.g. Large pothole on MG Road near Pune station"
                  maxLength={120}
                  className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm transition-all ${
                    fieldErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-teal-500'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.title
                    ? <p className="text-xs text-red-500">{fieldErrors.title}</p>
                    : <p className="text-xs text-gray-400">Minimum 10 characters</p>
                  }
                  <p className={`text-xs ml-auto ${title.length < 10 ? 'text-red-400' : 'text-gray-400'}`}>{title.length}/120</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description *</label>
                <textarea
                  id="issue-description-input"
                  value={description}
                  onChange={e => { setDescription(e.target.value); setFieldErrors(p => ({ ...p, description: undefined })) }}
                  placeholder="Describe the issue in detail — location landmarks, how long it's been there, safety impact..."
                  rows={5}
                  maxLength={500}
                  className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm resize-none transition-all ${
                    fieldErrors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-teal-500'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {fieldErrors.description
                    ? <p className="text-xs text-red-500">{fieldErrors.description}</p>
                    : <p className="text-xs text-gray-400">Minimum 20 characters</p>
                  }
                  <p className={`text-xs ml-auto ${description.length < 20 ? 'text-red-400' : 'text-gray-400'}`}>{description.length}/500</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category (optional — AI will detect)</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                        category === cat.value
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Photos */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Add Photos</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Photos help AI analyse and verify the issue (up to 5, auto-compressed to &lt;500KB)</p>
              </div>

              {/* Upload area */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageFiles.length >= 5}
                className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                  imageFiles.length >= 5
                    ? 'border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 cursor-pointer'
                }`}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to add photos</p>
                <p className="text-xs text-gray-400 mt-1">{5 - imageFiles.length} remaining • Auto-compressed</p>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={e => handleImageSelect(e.target.files)} />

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 rounded">
                        {formatBytes(imageFiles[i]?.size || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Video */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Optional Video</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={e => setVideoFile(e.target.files[0] || null)}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Set Location</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Auto-detect or click/drag the map to set location</p>
              </div>

              {/* GPS buttons row */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={geoLoading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 rounded-xl text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all disabled:opacity-60"
                >
                  {locating ? (
                    <><Loader size={16} className="animate-spin" /> Locating you...</>
                  ) : (
                    <><MapPin size={16} /> Auto-detect GPS</>
                  )}
                </button>
                {geoError && (
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-2 px-4 py-2.5 border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all disabled:opacity-60"
                  >
                    <Loader size={14} /> Retry Location
                  </button>
                )}
              </div>

              {geoError && (
                <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 rounded-xl px-3 py-2">
                  ⚠️ {geoError}
                </p>
              )}

              {/* Map */}
              <div className="h-56 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <MapContainer
                  center={location ? [location.lat, location.lng] : [18.5204, 73.8567]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <DraggableMarker
                    position={location ? [location.lat, location.lng] : null}
                    onMove={(latlng) => {
                      setLocation({ lat: latlng.lat, lng: latlng.lng })
                      reverseGeocode(latlng.lat, latlng.lng)
                    }}
                  />
                </MapContainer>
              </div>

              {address && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 flex gap-2">
                  <MapPin size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-0.5">Detected address</p>
                    <p className="text-xs text-teal-600 dark:text-teal-500">{address}</p>
                  </div>
                </div>
              )}

              {/* Landmark input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  📍 Nearby Landmark <span className="text-gray-400 font-normal">(optional but helpful)</span>
                </label>
                <input
                  id="landmark-input"
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. Near Pune Railway Station, Opposite D-Mart, Behind City Mall"
                  maxLength={150}
                  className="w-full text-sm px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">Helps authorities find the exact spot even if GPS is slightly off.</p>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review & Submit</h2>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2 text-sm">
                <p><span className="text-gray-500">Title:</span> <span className="font-semibold text-gray-900 dark:text-white">{title}</span></p>
                <p><span className="text-gray-500">Category:</span> <span className="font-semibold">{userCategory || aiResult?.category || category || '—'}</span></p>
                <p><span className="text-gray-500">Photos:</span> <span className="font-semibold">{imageFiles.length}</span></p>
                <p><span className="text-gray-500">Location:</span> <span className={`font-semibold ${!address ? 'text-gray-400 italic' : ''}`}>{address || 'Location not specified'}</span></p>
                {landmark && <p><span className="text-gray-500">Landmark:</span> <span className="font-semibold text-teal-600">📍 Near {landmark}</span></p>}
              </div>

              {/* Duplicate warning — now shown as modal, inline note kept brief */}
              {duplicateResult?.isDuplicate && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-orange-500 flex-shrink-0" />
                  <p className="text-xs text-orange-700 dark:text-orange-400 flex-1">
                    AI detected a similar issue nearby ({duplicateResult.confidence}% match).
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDuplicateModal(true)}
                    className="text-xs font-semibold text-orange-600 hover:underline flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              )}

              {/* AI Analysis card — interactive with category override */}
              {aiLoading ? (
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-xl p-4 flex items-center gap-3">
                  <Loader size={16} className="animate-spin text-purple-500" />
                  <p className="text-sm text-purple-600 dark:text-purple-400">AI is analysing your issue...</p>
                </div>
              ) : (aiResult || severityResult) ? (
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-2xl p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-400">AI Analysis</p>
                    {aiResult?.confidence && (
                      <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                        {aiResult.confidence}% confidence
                      </span>
                    )}
                  </div>

                  {/* ONE-LINER SUMMARY */}
                  <div className="bg-purple-100/60 dark:bg-purple-900/30 rounded-xl px-3 py-2">
                    <p className="text-xs font-mono text-purple-800 dark:text-purple-300 leading-relaxed">
                      🤖 Category → <strong>{aiResult?.category || '—'}</strong>
                      {' | '}Severity → <strong>{severityResult?.severity || aiResult?.severity || '—'}</strong>
                      {(severityResult?.reasoning || aiResult?.reasoning) && (
                        <> | Reason → <em>{(severityResult?.reasoning || aiResult?.reasoning).slice(0, 60)}{(severityResult?.reasoning || aiResult?.reasoning).length > 60 ? '…' : ''}</em></>
                      )}
                    </p>
                  </div>

                  {/* Analysis grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/70 dark:bg-purple-900/20 rounded-xl p-2.5 text-center">
                      <p className="text-gray-400 mb-1">Category</p>
                      <p className="font-bold text-gray-900 dark:text-white">{aiResult?.category || '—'}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-purple-900/20 rounded-xl p-2.5 text-center">
                      <p className="text-gray-400 mb-1">Severity</p>
                      <p className="font-bold text-gray-900 dark:text-white">{severityResult?.severity || aiResult?.severity || '—'}</p>
                    </div>
                    <div className="bg-white/70 dark:bg-purple-900/20 rounded-xl p-2.5 text-center">
                      <p className="text-gray-400 mb-1">Priority</p>
                      <p className="font-bold text-gray-900 dark:text-white">{severityResult?.priorityScore || '—'}/100</p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  {(severityResult?.reasoning || aiResult?.reasoning) && (
                    <div className="bg-white/60 dark:bg-purple-900/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">AI Reasoning</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">
                        {severityResult?.reasoning || aiResult?.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Category override */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      {aiConfirmed
                        ? <span className="text-green-600">✅ Category confirmed: <strong>{userCategory}</strong></span>
                        : 'Confirm or override the AI category:'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => { setUserCategory(cat.value); setAiConfirmed(true) }}
                          className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-150 ${
                            userCategory === cat.value
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 ring-1 ring-teal-400'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500">AI analysis not available — category will use your selection from Step 1.</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-7">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button
                type="button"
                id={`step-next-btn-${step}`}
                onClick={handleNext}
                disabled={aiLoading}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/25 disabled:opacity-60"
              >
                {step === 2 && aiLoading ? (
                  <><Loader size={16} className="animate-spin" /> Analysing...</>
                ) : (
                  <>Next <ChevronRight size={16} /></>
                )}
              </button>
            ) : (
              <button
                type="button"
                id="submit-issue-btn"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/25 disabled:opacity-60"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Issue 🚀</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Duplicate Detection Modal */}
    {showDuplicateModal && (
      <DuplicateModal
        duplicateResult={duplicateResult}
        onClose={() => setShowDuplicateModal(false)}
        onSubmitAnyway={() => setShowDuplicateModal(false)}
      />
    )}
    </>
  )
}
