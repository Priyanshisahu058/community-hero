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
        } else {
          set({ user: null, profile: null })
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
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (!data) {
          // Retry once in case trigger was slightly delayed during signup
          await new Promise(r => setTimeout(r, 400))
          const retry = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          data = retry.data
        }

        if (data) {
          console.info('[AUTH USER]', { id: data.id, email: data.email, role: data.role })
          set({ profile: data })
        } else if (error) {
          console.error('fetchProfile error:', error)
          set({ profile: { id: userId, role: 'citizen' } })
        } else {
          console.info('[AUTH USER] Profile row missing, defaulting to citizen for id:', userId)
          set({ profile: { id: userId, role: 'citizen' } })
        }
      },

      login: async (email, password) => {
        set({ profile: null })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        set({ user: data.user })
        await get().fetchProfile(data.user.id)
        return data
      },

      register: async (email, password, name) => {
        set({ profile: null })
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error
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
      isAuthority: () => get().profile?.role === 'authority',
      isAdminOrAuthority: () => ['admin', 'authority'].includes(get().profile?.role),
    }),
    {
      name: 'civiceye-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    },
  ),
)

export default useAuthStore
