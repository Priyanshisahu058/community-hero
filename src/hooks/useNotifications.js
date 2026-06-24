import { useState, useEffect, useCallback } from 'react'
import { fetchNotifications, markAllNotificationsRead, subscribeToNotifications } from '../services/notifications'
import { supabase } from '../services/supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await fetchNotifications(userId)
      setNotifications(data)
    } catch (err) {
      console.error('useNotifications load error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const channel = subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev])
    })
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await markAllNotificationsRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [userId])

  return { notifications, unreadCount, loading, markAllRead, refetch: load }
}

export default useNotifications
