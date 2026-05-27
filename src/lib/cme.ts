import type { CMEStatus, AlertLevel } from '../types'
import { parseLocalDate, addYears } from './date'

export function calculateCMEStatus(
  courses: { credits: number; end_date: string }[],
  doctor?: {
    cme_target_credits?: number
  } | null
): CMEStatus {
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const windowStart = addYears(todayMidnight, -5) ?? todayMidnight

  const defaultStatus: CMEStatus = {
    totalCredits: 0,
    targetCredits: 120,
    remainingCredits: 120,
    progressPercent: 0,
    windowStartDate: windowStart,
    windowEndDate: todayMidnight,
    alertLevel: 'none',
    isComplete: false,
  }

  if (!doctor) {
    return defaultStatus
  }

  const validCourses = (courses || []).filter((c) => {
    const endDate = parseLocalDate(c.end_date)
    if (!endDate) return false
    const tEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime()
    return tEndDate >= windowStart.getTime() && tEndDate <= todayMidnight.getTime()
  })

  const totalCredits = validCourses.reduce((sum, c) => sum + (c.credits || 0), 0)
  const targetCredits = doctor.cme_target_credits ?? 120
  const remainingCredits = Math.max(0, targetCredits - totalCredits)

  let alertLevel: AlertLevel = 'none'
  if (remainingCredits > 0) {
    alertLevel = remainingCredits >= Math.ceil(targetCredits * 0.25) ? 'warning' : 'info'
  }

  const progressPercent = targetCredits > 0 
    ? Math.min(100, Math.round((totalCredits / targetCredits) * 100))
    : 0

  return {
    totalCredits,
    targetCredits,
    remainingCredits,
    progressPercent,
    windowStartDate: windowStart,
    windowEndDate: todayMidnight,
    alertLevel,
    isComplete: remainingCredits === 0,
  }
}
