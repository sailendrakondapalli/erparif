import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // Initialize auth state
  initialize: async () => {
    console.log('🔄 Starting auth initialization...')
    
    if (!supabase) {
      console.log('❌ Supabase not configured')
      set({ loading: false })
      return
    }
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth initialization timeout - stopping loading')
      set({ loading: false, error: 'Authentication timeout. Please check your Supabase credentials.' })
    }, 10000) // 10 second timeout
    
    try {
      console.log('🔍 Getting session from Supabase...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Clear timeout if we get a response
      clearTimeout(timeoutId)
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError)
        throw sessionError
      }
      
      console.log('📋 Session data:', session ? 'User found' : 'No user')
      
      if (session?.user) {
        console.log('👤 User ID:', session.user.id)
        console.log('📧 User email:', session.user.email)
        
        // Try to get profile, but don't fail if it doesn't exist yet
        try {
          console.log('🔍 Fetching user profile...')
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.log('⚠️ Profile error (might not exist yet):', profileError.message)
            set({ user: session.user, profile: null, loading: false })
          } else {
            console.log('✅ Profile loaded:', profile.role)
            set({ user: session.user, profile, loading: false })
          }
        } catch (profileError) {
          console.log('⚠️ Profile fetch failed:', profileError.message)
          set({ user: session.user, profile: null, loading: false })
        }
      } else {
        console.log('👋 No authenticated user - showing login')
        set({ loading: false })
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ Auth initialization failed:', error)
      set({ error: error.message, loading: false })
    }
  },

  // Sign in
  signIn: async (email, password) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      // Try to get profile
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        set({ user: data.user, profile, loading: false })
      } catch (profileError) {
        set({ user: data.user, profile: null, loading: false })
      }
      return { success: true }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Sign up
  signUp: async (email, password, userData) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: userData } 
      })
      if (error) throw error
      
      set({ loading: false })
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Sign out
  signOut: async () => {
    if (!supabase) return
    
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    try {
      const { user } = get()
      if (!user) throw new Error('No user logged in')
      
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      
      set({ profile: updatedProfile })
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Check permissions
  hasPermission: (requiredRole) => {
    const { profile } = get()
    if (!profile) return false
    
    const roleHierarchy = {
      'patient': 1,
      'staff': 2,
      'pharmacist': 3,
      'admin': 4,
      'retailer': 2,
      'wholesaler': 2
    }
    
    return roleHierarchy[profile.role] >= roleHierarchy[requiredRole]
  },

  // Get redirect path based on role
  getRedirectPath: () => {
    const { profile } = get()
    if (!profile) return '/login'
    
    switch (profile.role) {
      case 'admin':
        return '/admin'
      case 'pharmacist':
        return '/pharmacist'
      case 'staff':
        return '/staff'
      case 'patient':
        return '/patient'
      case 'retailer':
        return '/retailer'
      case 'wholesaler':
        return '/wholesaler'
      default:
        return '/login'
    }
  }
}))

export default useAuthStore