import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Doctor } from '../types'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  doctor: Doctor | null
  isLoading: boolean
  isInitialized: boolean
  cleanupListener: (() => void) | null
  setSession: (session: Session | null) => void
  setDoctor: (doctor: Doctor | null) => void
  fetchDoctorProfile: (userId: string) => Promise<Doctor | null>
  signOut: () => Promise<void>
  signInWithOtp: (email: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  doctor: null,
  isLoading: true,
  isInitialized: false,
  cleanupListener: null,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    })
  },

  setDoctor: (doctor) => {
    set({ doctor })
  },

  fetchDoctorProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching doctor profile:', error)
        return null
      }

      set({ doctor: data })
      return data
    } catch (e) {
      console.error('Exception fetching doctor profile:', e)
      return null
    }
  },

  signInWithOtp: async (email) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Error signing out:', error)
    } catch (e) {
      console.error('Exception during sign out:', e)
    } finally {
      set({ 
        session: null, 
        user: null, 
        doctor: null, 
        isLoading: false, 
        isInitialized: true
      })
    }
  },

  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })
    
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null })

      if (session?.user) {
        await get().fetchDoctorProfile(session.user.id)
      }

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().fetchDoctorProfile(session.user.id)
        } else {
          set({ doctor: null })
        }
        set({ isLoading: false })
      })

      set({ 
        isInitialized: true, 
        isLoading: false,
        cleanupListener: () => subscription.unsubscribe()
      })
    } catch (error) {
      console.error('Initialization failed:', error)
      set({ isLoading: false, isInitialized: false })
    }
  },
}))
