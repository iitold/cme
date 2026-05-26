import type { CMEStatus, AlertLevel } from '../types'
import { parseLocalDate, addYears, daysBetween } from './date'

export function calculateCMEStatus(
  courses: { credits: number; end_date: string }[],
  doctor?: {
    cchn_cycle_start?: string
    cme_target_credits?: number
  } | null
): CMEStatus {
  const defaultStatus: CMEStatus = {
    totalCredits: 0,
    targetCredits: 120,
    remainingCredits: 120,
    progressPercent: 0,
    cycleEndDate: new Date(),
    daysRemaining: 0,
    monthsRemaining: 0,
    alertLevel: 'none',
    isComplete: false,
  }

  if (!doctor || !doctor.cchn_cycle_start) {
    return defaultStatus
  }

  const cycleStart = parseLocalDate(doctor.cchn_cycle_start)
  if (!cycleStart) return defaultStatus

  const cycleEnd = addYears(cycleStart, 5)
  if (!cycleEnd) return defaultStatus

  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const fiveYearsAgo = addYears(todayMidnight, -5)

  const validCourses = (courses || []).filter((c) => {
    const endDate = parseLocalDate(c.end_date)
    if (!endDate || !fiveYearsAgo) return false
    const tEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime()
    return tEndDate >= fiveYearsAgo.getTime()
  })

  const totalCredits = validCourses.reduce((sum, c) => sum + (c.credits || 0), 0)
  const targetCredits = doctor.cme_target_credits ?? 120
  const remainingCredits = Math.max(0, targetCredits - totalCredits)

  const daysRemaining = daysBetween(today, cycleEnd) ?? 0
  const monthsRemaining = Math.ceil(daysRemaining / 30)

  let alertLevel: AlertLevel = 'none'
  if (remainingCredits > 0) {
    if (daysRemaining <= 0) {
      alertLevel = 'overdue'
    } else if (monthsRemaining <= 1) {
      alertLevel = 'critical'
    } else if (monthsRemaining <= 2) {
      alertLevel = 'warning'
    } else if (monthsRemaining <= 3) {
      alertLevel = 'info'
    }
  }

  const progressPercent = targetCredits > 0 
    ? Math.min(100, Math.round((totalCredits / targetCredits) * 100))
    : 0

  return {
    totalCredits,
    targetCredits,
    remainingCredits,
    progressPercent,
    cycleEndDate: cycleEnd,
    daysRemaining: Math.max(0, daysRemaining),
    monthsRemaining: Math.max(0, monthsRemaining),
    alertLevel,
    isComplete: remainingCredits === 0,
  }
}
