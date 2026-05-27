import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Doctor } from '../types'
import { useAuthStore } from '../stores/auth.store'

export function useProfile() {
  const { user, setDoctor } = useAuthStore()
  const queryClient = useQueryClient()

  const profileQuery = useQuery<Doctor | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('doctors')
        .select('id,user_id,email,full_name,date_of_birth,phone,cchn_number,cchn_issued_date,cchn_cycle_start,cchn_cycle_end,specialty,workplace,province,cme_target_credits,cme_min_per_year,role,created_at,updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      setDoctor(data) // update Zustand sync
      return data
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<Doctor>) => {
      if (!user?.id) throw new Error('Not logged in')
      const { data, error } = await supabase
        .from('doctors')
        .update(updatedData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data)
      setDoctor(data)
    },
  })

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  }
}
