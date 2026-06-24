import { useEffect } from 'react'
import useAuthStore from '../store/authStore'

export function useAuth() {
  const { user, profile, loading, initialized, initialize, login, register, logout, updateProfile, isAdmin } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    login,
    register,
    logout,
    updateProfile,
    refetchProfile: () => user && useAuthStore.getState().fetchProfile(user.id),
  }
}

export default useAuth
