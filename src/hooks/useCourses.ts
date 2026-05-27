import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Course } from '../types'
import { useAuthStore } from '../stores/auth.store'

export function useCourses() {
  const { doctor } = useAuthStore()
  const queryClient = useQueryClient()

  const coursesQuery = useQuery<Course[]>({
    queryKey: ['courses', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return []
      const { data, error } = await supabase
        .from('courses')
        .select('id,doctor_id,course_name,provider_name,provider_type,credits,course_type,start_date,end_date,verification_status,certificate_url,certificate_name,notes,created_at,updated_at')
        .eq('doctor_id', doctor.id)
        .order('end_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!doctor?.id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const addCourseMutation = useMutation({
    mutationFn: async (newCourse: Omit<Course, 'id' | 'doctor_id' | 'created_at' | 'updated_at' | 'verification_status'>) => {
      if (!doctor?.id) throw new Error('No doctor profile loaded')
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...newCourse,
          doctor_id: doctor.id,
          verification_status: 'self_entered',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', doctor?.id] })
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...updatedFields }: Partial<Course> & { id: string }) => {
      if (!doctor?.id) throw new Error('No doctor profile loaded')
      const { data, error } = await supabase
        .from('courses')
        .update(updatedFields)
        .eq('id', id)
        .eq('doctor_id', doctor.id) // security guard
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', doctor?.id] })
    },
  })

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!doctor?.id) throw new Error('No doctor profile loaded')
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('doctor_id', doctor.id) // security guard

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', doctor?.id] })
    },
  })

  return {
    courses: coursesQuery.data || [],
    isLoading: coursesQuery.isLoading,
    error: coursesQuery.error,
    addCourse: addCourseMutation.mutateAsync,
    isAdding: addCourseMutation.isPending,
    updateCourse: updateCourseMutation.mutateAsync,
    isUpdating: updateCourseMutation.isPending,
    deleteCourse: deleteCourseMutation.mutateAsync,
    isDeleting: deleteCourseMutation.isPending,
  }
}
