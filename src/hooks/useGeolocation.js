import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null) // { lat, lng }
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false) // true only while GPS signal is being acquired
  const [error, setError] = useState(null)

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        setLocation({ lat, lng, accuracy })
        setLocating(false)
        // Reverse geocode using OpenStreetMap Nominatim (free, no key required)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } },
          )
          const data = await res.json()
          setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        } catch {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
        setLoading(false)
      },
      (_err) => {
        setLocating(false)
        setLoading(false)
        setError('Could not detect precise location. Please drop the pin manually or enter address.')
        // Default to Pune city center so map still renders
        setLocation({ lat: 18.5204, lng: 73.8567 })
        setAddress('')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [])

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json()
      setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }, [])

  return { location, address, loading, locating, error, detectLocation, setLocation, setAddress, reverseGeocode }
}

export default useGeolocation
