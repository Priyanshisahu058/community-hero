import { supabase } from './supabase'

/**
 * Fetch notifications for a user
 */
export async function fetchNotifications(userId, limit = 10) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('fetchNotifications error:', error); return [] }
  return data || []
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) console.error('markAllNotificationsRead error:', error)
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) console.error('markNotificationRead error:', error)
}

/**
 * Subscribe to realtime notifications for a user
 * @param {string} userId
 * @param {function} callback - called with new notification payload
 * @returns {object} Supabase channel (call .unsubscribe() to clean up)
 */
export function subscribeToNotifications(userId, callback) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => callback(payload.new),
    )
    .subscribe()
  return channel
}
