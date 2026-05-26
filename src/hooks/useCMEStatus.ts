import { useMemo } from 'react'
import { calculateCMEStatus } from '../lib/cme'
import { useAuthStore } from '../stores/auth.store'
import { useCourses } from './useCourses'
import type { CMEStatus } from '../types'

export function useCMEStatus(): CMEStatus | null {
  const { doctor } = useAuthStore()
  const { courses } = useCourses()

  return useMemo(() => {
    if (!doctor) return null
    return calculateCMEStatus(courses, {
      cchn_cycle_start: doctor.cchn_cycle_start,
      cme_target_credits: doctor.cme_target_credits,
    })
  }, [courses, doctor])
}
