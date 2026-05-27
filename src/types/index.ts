export interface Doctor {
  id: string
  user_id: string
  full_name: string
  date_of_birth?: string
  phone?: string
  cchn_number?: string
  cchn_issued_date?: string
  cchn_cycle_start?: string
  cchn_cycle_end?: string
  specialty?: string
  workplace?: string
  province?: string
  cme_target_credits: number
  cme_min_per_year: number
  role?: 'doctor' | 'admin'
  email?: string
  created_at: string
  updated_at: string
}

export type ProviderType = 'university' | 'hospital' | 'association' | 'online' | 'other'
export type CourseType = 'theory' | 'clinical' | 'online' | 'conference'
export type VerificationStatus = 'self_entered' | 'provider_verified' | 'institution_verified'

export interface Course {
  id: string
  doctor_id: string
  course_name: string
  provider_name: string
  provider_type: ProviderType
  credits: number
  course_type: CourseType
  start_date: string
  end_date: string
  verification_status: VerificationStatus
  certificate_url?: string
  certificate_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ReminderType = 'deadline_3mo' | 'deadline_2mo' | 'deadline_1mo' | 'deadline_2w' | 'yearly_deficit'
export type ReminderChannel = 'email' | 'zalo'
export type ReminderStatus = 'pending' | 'sent' | 'failed'

export interface Reminder {
  id: string
  doctor_id: string
  reminder_type: ReminderType
  channel: ReminderChannel
  status: ReminderStatus
  credits_at_time?: number
  deadline_at_time?: string
  triggered_at: string
  sent_at?: string
}

export type AlertLevel = 'none' | 'info' | 'warning' | 'critical' | 'overdue'

export interface CMEStatus {
  totalCredits: number
  targetCredits: number
  remainingCredits: number
  progressPercent: number
  windowStartDate: Date
  windowEndDate: Date
  alertLevel: AlertLevel
  isComplete: boolean
}
