import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../services/supabase'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        set({ loading: true })
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({ user: session.user })
          await get().fetchProfile(session.user.id)
        }
        set({ loading: false, initialized: true })

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            set({ user: session.user })
            await get().fetchProfile(session.user.id)
          } else {
            set({ user: null, profile: null })
          }
        })
      },

      fetchProfile: async (userId) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (error) { console.error('fetchProfile error:', error); return }
        set({ profile: data })
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        set({ user: data.user })
        await get().fetchProfile(data.user.id)
        return data
      },

      register: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error
        // If email confirmation is disabled, session is returned immediately
        if (data.session) {
          set({ user: data.user })
          await get().fetchProfile(data.user.id)
        }
        return data
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },

      updateProfile: async (updates) => {
        const userId = get().user?.id
        if (!userId) return
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single()
        if (error) { console.error('updateProfile error:', error); throw error }
        set({ profile: data })
        return data
      },

      isAdmin: () => get().profile?.role === 'admin',
    }),
    {
      name: 'civiceye-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    },
  ),
)

export default useAuthStore
