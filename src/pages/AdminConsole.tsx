import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserShield, 
  faUsers, 
  faKey, 
  faUserPen, 
  faLock, 
  faUnlock, 
  faTrash, 
  faSearch, 
  faSpinner, 
  faXmark,
  faBook,
  faFolderOpen,
  faPlus,
  faClock,
  faGlobe,
  faStethoscope,
  faUserGraduate,
  faCheck,
  faTimes,
  faEye,
  faChartSimple,
  faArrowTrendUp
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { CertificateUpload } from '../components/cme/CertificateUpload'
import { getCertificatePath, getSignedUrl } from '../lib/storageHelpers'
import { getAuthRedirectUrl } from '../lib/authRedirect'
import { toast } from 'sonner'
import type { Doctor, Course, ProviderType, CourseType, VerificationStatus } from '../types'

interface ResetRequest {
  id: string
  email: string
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
}

export const AdminConsole: React.FC = () => {
  const { doctor } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]

  // Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'doctors' | 'requests'>('dashboard')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [totalDoctorsCount, setTotalDoctorsCount] = useState(0)
  const [doctorsPage, setDoctorsPage] = useState(0)
  const [requests, setRequests] = useState<ResetRequest[]>([])
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Stats state for dashboard
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalCourses: 0,
    totalCredits: 0,
    specialtyCounts: {} as Record<string, number>,
    provinceCounts: {} as Record<string, number>,
  })

  // Recent activities state
  interface RecentDoctor {
    id: string
    full_name: string
    email: string | null
    created_at: string
  }

  interface RecentCourse {
    id: string
    course_name: string
    credits: number
    created_at: string
    doctor_id: string
    doctors: {
      full_name: string
    } | {
      full_name: string
    }[] | null
  }

  const [recentDocs, setRecentDocs] = useState<RecentDoctor[]>([])
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([])

  // Modal states
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<Doctor | ResetRequest | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // CME Folder States
  const [selectedDoctorCme, setSelectedDoctorCme] = useState<Doctor | null>(null)
  const [doctorCourses, setDoctorCourses] = useState<Course[]>([])
  const [loadingDoctorCourses, setLoadingDoctorCourses] = useState(false)
  const [isCmeFormOpen, setIsCmeFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Course Form Fields
  const [courseName, setCourseName] = useState('')
  const [providerName, setProviderName] = useState('')
  const [providerType, setProviderType] = useState<ProviderType>('hospital')
  const [credits, setCredits] = useState<number>(24)
  const [courseType, setCourseType] = useState<CourseType>('theory')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('self_entered')
  const [notes, setNotes] = useState('')
  const [certificateName, setCertificateName] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')

  const fetchDoctors = useCallback(async (search = '', page = 0) => {
    try {
      let query = supabase
        .from('doctors')
        .select('id,user_id,email,full_name,phone,specialty,workplace,province,role,cchn_number,cchn_cycle_start,cchn_cycle_end,cme_target_credits,cme_min_per_year,created_at,updated_at', { count: 'exact' })
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,cchn_number.ilike.%${search}%,specialty.ilike.%${search}%,workplace.ilike.%${search}%`)
      }

      const { data, count, error } = await query
        .order('full_name')
        .range(page * 50, page * 50 + 49)

      if (error) throw error
      setDoctors(data || [])
      setTotalDoctorsCount(count || 0)
    } catch (e) {
      console.error('Error fetching doctors:', e)
    }
  }, [])

  const fetchDoctorCourses = useCallback(async (doctorId: string) => {
    setLoadingDoctorCourses(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('end_date', { ascending: false })
      if (error) throw error
      setDoctorCourses(data || [])
    } catch (e) {
      console.error('Error fetching doctor courses:', e)
    } finally {
      setLoadingDoctorCourses(false)
    }
  }, [])

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    try {
      // 1. Fetch Stats for Dashboard
      const { data: docStats, error: docStatsError } = await supabase
        .from('doctors')
        .select('specialty,province')
      if (docStatsError) throw docStatsError

      const { data: coursesStats, error: coursesStatsError } = await supabase
        .from('courses')
        .select('credits')
      if (coursesStatsError) throw coursesStatsError

      const totalDoctorsVal = docStats?.length || 0
      const totalCoursesVal = coursesStats?.length || 0
      const totalCreditsVal = coursesStats?.reduce((sum, c) => sum + (c.credits || 0), 0) || 0

      const specCounts = (docStats || []).reduce((acc: Record<string, number>, doc) => {
        const spec = doc.specialty || (language === 'vi' ? 'Chưa cập nhật' : 'Unspecified')
        acc[spec] = (acc[spec] || 0) + 1
        return acc
      }, {})

      const provCounts = (docStats || []).reduce((acc: Record<string, number>, doc) => {
        const prov = doc.province || (language === 'vi' ? 'Chưa cập nhật' : 'Unspecified')
        acc[prov] = (acc[prov] || 0) + 1
        return acc
      }, {})

      setStats({
        totalDoctors: totalDoctorsVal,
        totalCourses: totalCoursesVal,
        totalCredits: totalCreditsVal,
        specialtyCounts: specCounts,
        provinceCounts: provCounts,
      })

      // 2. Fetch Password Reset Requests
      const { data: requestsData, error: reqError } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (reqError) throw reqError
      setRequests(requestsData || [])

      // 3. Fetch Banned User IDs
      const { data: bannedData, error: banError } = await supabase
        .rpc('admin_get_banned_users')
      if (!banError && bannedData) {
        setBannedUserIds(new Set(bannedData.map((b: { banned_user_id: string }) => b.banned_user_id)))
      }

      // 4. Fetch 5 most recent doctors and courses for activity log
      const { data: recentDocsData } = await supabase
        .from('doctors')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentDocs(recentDocsData || [])

      const { data: recentCoursesData } = await supabase
        .from('courses')
        .select('id, course_name, credits, created_at, doctor_id, doctors(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentCourses(recentCoursesData || [])

      // 5. Fetch Doctors
      await fetchDoctors(searchQuery, doctorsPage)
    } catch (e: unknown) {
      console.error('Error loading admin console data:', e)
      toast.error(language === 'vi' ? 'Không thể tải dữ liệu quản trị' : 'Failed to load administration data')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, fetchDoctors])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDoctors(searchQuery, doctorsPage)
  }, [searchQuery, doctorsPage, fetchDoctors])

  useEffect(() => {
    if (selectedDoctorCme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDoctorCourses(selectedDoctorCme.id)
    } else {
      setDoctorCourses([])
    }
  }, [selectedDoctorCme, fetchDoctorCourses])

  // Admin Actions
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoctor) return
    setIsSubmitting(true)
    try {
      const originalDoctor = doctors.find(d => d.id === editingDoctor.id)

      const { error } = await supabase
        .from('doctors')
        .update({
          full_name: editingDoctor.full_name,
          phone: editingDoctor.phone || null,
          specialty: editingDoctor.specialty || null,
          workplace: editingDoctor.workplace || null,
          province: editingDoctor.province || null,
          cme_target_credits: Number(editingDoctor.cme_target_credits),
        })
        .eq('id', editingDoctor.id)

      if (error) throw error

      if (originalDoctor && originalDoctor.role !== editingDoctor.role) {
        const { error: roleError } = await supabase.rpc('admin_update_doctor_role', {
          target_doctor_id: editingDoctor.id,
          new_role: editingDoctor.role,
        })
        if (roleError) throw roleError
      }

      toast.success(language === 'vi' ? 'Cập nhật hồ sơ bác sĩ thành công!' : 'Doctor profile updated successfully!')
      setEditingDoctor(null)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordUser) return
    setIsSubmitting(true)
    try {
      const targetEmail = resetPasswordUser.email
      if (!targetEmail) {
        throw new Error(language === 'vi' ? 'Tài khoản này chưa có email.' : 'This account does not have an email address.')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${getAuthRedirectUrl()}/reset-password`,
      })

      if (error) throw error

      if ('user_id' in resetPasswordUser) {
        toast.success(language === 'vi' ? 'Đã gửi email đặt lại mật khẩu cho người dùng.' : 'Password reset email sent to the user.')
      } else {
        await supabase
          .from('password_reset_requests')
          .update({ status: 'completed' })
          .eq('id', resetPasswordUser.id)
        toast.success(language === 'vi' ? 'Đã duyệt yêu cầu và gửi email đặt lại mật khẩu.' : 'Request approved and password reset email sent.')
      }

      setResetPasswordUser(null)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLock = async (doctorToLock: Doctor) => {
    const isCurrentlyLocked = bannedUserIds.has(doctorToLock.user_id)
    const actionText = isCurrentlyLocked 
      ? (language === 'vi' ? 'Mở khóa' : 'Unlock') 
      : (language === 'vi' ? 'Khóa' : 'Lock')
      
    try {
      const { error } = await supabase.rpc('admin_toggle_lock_user', {
        target_user_id: doctorToLock.user_id,
        is_locked: !isCurrentlyLocked
      })

      if (error) throw error

      toast.success(language === 'vi' ? `${actionText} tài khoản thành công!` : `Account ${actionText}ed successfully!`)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const handleDeleteUser = async (doctorToDelete: Doctor) => {
    const confirmDelete = window.confirm(
      language === 'vi' 
        ? `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN bác sĩ ${doctorToDelete.full_name}? Hành động này không thể hoàn tác.`
        : `WARNING: Are you sure you want to PERMANENTLY DELETE doctor ${doctorToDelete.full_name}? This cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: doctorToDelete.user_id
      })

      if (error) throw error

      toast.success(language === 'vi' ? 'Xóa tài khoản bác sĩ thành công!' : 'Doctor account deleted successfully!')
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: 'completed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      toast.success(language === 'vi' ? 'Cập nhật yêu cầu thành công!' : 'Request updated successfully!')
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  // CME Specific Actions
  const openCmeForm = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course)
      setCourseName(course.course_name || '')
      setProviderName(course.provider_name || '')
      setProviderType(course.provider_type || 'hospital')
      setCredits(course.credits || 24)
      setCourseType(course.course_type || 'theory')
      setStartDate(course.start_date || '')
      setEndDate(course.end_date || '')
      setVerificationStatus(course.verification_status || 'self_entered')
      setNotes(course.notes || '')
      setCertificateName(course.certificate_name || '')
      setCertificateUrl(course.certificate_url || '')
    } else {
      setEditingCourse(null)
      setCourseName('')
      setProviderName('')
      setProviderType('hospital')
      setCredits(24)
      setCourseType('theory')
      setStartDate('')
      setEndDate('')
      setVerificationStatus('self_entered')
      setNotes('')
      setCertificateName('')
      setCertificateUrl('')
    }
    setIsCmeFormOpen(true)
  }

  const handleCmeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctorCme) return
    setIsSubmitting(true)

    const payload = {
      doctor_id: selectedDoctorCme.id,
      course_name: courseName,
      provider_name: providerName,
      provider_type: providerType,
      credits: Number(credits),
      course_type: courseType,
      start_date: startDate,
      end_date: endDate,
      verification_status: verificationStatus,
      notes: notes || null,
      certificate_name: certificateName || null,
      certificate_url: certificateUrl || null,
    }

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editingCourse.id)
        if (error) throw error
        toast.success(language === 'vi' ? 'Cập nhật khóa học thành công!' : 'Course updated successfully!')
      } else {
        const { error } = await supabase
          .from('courses')
          .insert(payload)
        if (error) throw error
        toast.success(language === 'vi' ? 'Ghi nhận khóa học thành công!' : 'Course recorded successfully!')
      }
      setIsCmeFormOpen(false)
      setEditingCourse(null)
      loadData()
      if (selectedDoctorCme) {
        fetchDoctorCourses(selectedDoctorCme.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCmeToggleVerify = async (course: Course) => {
    const newStatus: VerificationStatus = course.verification_status === 'self_entered' ? 'provider_verified' : 'self_entered'
    try {
      const { error } = await supabase
        .from('courses')
        .update({ verification_status: newStatus })
        .eq('id', course.id)
      if (error) throw error
      toast.success(
        language === 'vi' 
          ? (newStatus === 'provider_verified' ? 'Đã phê duyệt chứng chỉ!' : 'Đã hủy phê duyệt!')
          : (newStatus === 'provider_verified' ? 'Certificate approved!' : 'Approval cancelled!')
      )
      loadData()
      if (selectedDoctorCme) {
        fetchDoctorCourses(selectedDoctorCme.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const handleCmeDelete = async (courseId: string) => {
    const confirmDelete = window.confirm(
      language === 'vi' 
        ? 'Bạn có chắc chắn muốn xóa khóa học này không?' 
        : 'Are you sure you want to delete this course?'
    )
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
      if (error) throw error
      toast.success(language === 'vi' ? 'Xóa khóa học thành công!' : 'Course deleted successfully!')
      loadData()
      if (selectedDoctorCme) {
        fetchDoctorCourses(selectedDoctorCme.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const handleViewCertificate = async (urlOrPath: string | undefined | null) => {
    if (!urlOrPath) return
    const path = getCertificatePath(urlOrPath)
    if (!path) return
    try {
      const signedUrl = await getSignedUrl(path)
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noreferrer')
      } else {
        toast.error(language === 'vi' ? 'Không thể tạo liên kết tải chứng chỉ.' : 'Failed to generate signed download link.')
      }
    } catch (err) {
      console.error('Failed to view certificate:', err)
    }
  }

  // Doctors are filtered and paginated on the server
  const filteredDoctors = doctors

  // Compute Dashboard Analytics from stats state
  const totalDoctors = stats.totalDoctors
  const totalCourses = stats.totalCourses
  const totalCredits = stats.totalCredits
  const averageCredits = totalDoctors ? Math.round(totalCredits / totalDoctors) : 0

  const sortedSpecialties = Object.entries(stats.specialtyCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const sortedProvinces = Object.entries(stats.provinceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Combined Recent Activities using server-fetched recent activities
  const recentActivities = useMemo(() => {
    return [
      ...recentDocs.map(d => ({
        id: `doc-${d.id}`,
        type: 'doctor',
        title: language === 'vi' ? `Bác sĩ ${d.full_name} đăng ký` : `Dr. ${d.full_name} registered`,
        subtitle: d.email || '',
        date: new Date(d.created_at),
        icon: faUserShield
      })),
      ...recentCourses.map(c => {
        const doctorName = Array.isArray(c.doctors)
          ? c.doctors[0]?.full_name
          : (c.doctors as { full_name: string } | null)?.full_name
        return {
          id: `course-${c.id}`,
          type: 'course',
          title: language === 'vi' 
            ? `Bác sĩ ${doctorName || 'Hệ thống'} đã thêm khóa học` 
            : `Dr. ${doctorName || 'System'} added a course`,
          subtitle: `${c.course_name} (+${c.credits} tín chỉ)`,
          date: new Date(c.created_at),
          icon: faBook
        }
      })
    ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
  }, [recentDocs, recentCourses, language])

  // Redirect if not admin
  if (!doctor || doctor.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 text-foreground animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FontAwesomeIcon icon={faUserShield} className="text-primary text-lg" />
            {language === 'vi' ? 'Hệ thống Quản trị Web & CME' : 'System Administration & CME'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'vi' 
              ? 'Phân tích hệ thống, quản lý tài khoản bác sĩ, chỉnh sửa hồ sơ, quản lý lịch sử học tập CME và bảo mật.' 
              : 'Analyze system, manage doctor profiles, edit CME history, and manage platform security.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border select-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faChartSimple} className="text-xs" />
          {language === 'vi' ? 'Tổng quan Analytics' : 'Overview Analytics'}
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'doctors'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faUsers} className="text-xs" />
          {language === 'vi' ? 'Quản lý Bác sĩ' : 'Manage Doctors'}
          <span className="ml-1 px-1.5 py-0.2 bg-secondary text-[10px] text-muted-foreground rounded-full">
            {doctors.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faKey} className="text-xs" />
          {language === 'vi' ? 'Yêu cầu Đổi mật khẩu' : 'Reset Requests'}
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-[10px] text-white rounded-full animate-pulse">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin text-2xl" />
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 border-border bg-white dark:bg-card shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {language === 'vi' ? 'Tổng số Bác sĩ' : 'Total Doctors'}
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{totalDoctors}</h3>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                </Card>

                <Card className="p-4 border-border bg-white dark:bg-card shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {language === 'vi' ? 'Tổng số Khóa học' : 'Total Courses'}
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{totalCourses}</h3>
                  </div>
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FontAwesomeIcon icon={faBook} />
                  </div>
                </Card>

                <Card className="p-4 border-border bg-white dark:bg-card shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {language === 'vi' ? 'Tổng Tín chỉ tích lũy' : 'Total CME Credits'}
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{totalCredits}</h3>
                  </div>
                  <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <FontAwesomeIcon icon={faArrowTrendUp} />
                  </div>
                </Card>

                <Card className="p-4 border-border bg-white dark:bg-card shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {language === 'vi' ? 'Tín chỉ trung bình' : 'Avg Credits/Doctor'}
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{averageCredits}</h3>
                  </div>
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FontAwesomeIcon icon={faUserGraduate} />
                  </div>
                </Card>
              </div>

              {/* Lower Section Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Stats Breakdown */}
                <div className="space-y-6">
                  {/* Specialties Distribution */}
                  <Card className="p-5 border-border bg-white dark:bg-card shadow-sm">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
                      <FontAwesomeIcon icon={faStethoscope} className="text-primary" />
                      <span>{language === 'vi' ? 'Phân bố Chuyên khoa hàng đầu' : 'Top Specialties Distribution'}</span>
                    </h3>
                    <div className="space-y-3.5">
                      {sortedSpecialties.map(([name, count]) => {
                        const percent = totalDoctors ? Math.round((count / totalDoctors) * 100) : 0
                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground">{name}</span>
                              <span className="text-muted-foreground">{count} {language === 'vi' ? 'Bác sĩ' : 'Doctors'} ({percent}%)</span>
                            </div>
                            <div className="w-full bg-secondary/50 rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Provinces Distribution */}
                  <Card className="p-5 border-border bg-white dark:bg-card shadow-sm">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
                      <FontAwesomeIcon icon={faGlobe} className="text-primary" />
                      <span>{language === 'vi' ? 'Phân bố Tỉnh thành hàng đầu' : 'Top Provinces Distribution'}</span>
                    </h3>
                    <div className="space-y-3.5">
                      {sortedProvinces.map(([name, count]) => {
                        const percent = totalDoctors ? Math.round((count / totalDoctors) * 100) : 0
                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground">{name}</span>
                              <span className="text-muted-foreground">{count} {language === 'vi' ? 'Bác sĩ' : 'Doctors'} ({percent}%)</span>
                            </div>
                            <div className="w-full bg-secondary/50 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>

                {/* Recent Activities */}
                <Card className="p-5 border-border bg-white dark:bg-card shadow-sm">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faClock} className="text-primary" />
                    <span>{language === 'vi' ? 'Hoạt động Hệ thống Gần đây' : 'Recent System Activities'}</span>
                  </h3>
                  <div className="relative border-l border-border/80 pl-4 ml-2.5 space-y-5 py-1">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="relative">
                        {/* Bullet Icon */}
                        <div className={`absolute -left-[27px] top-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[9px] ${
                          act.type === 'doctor' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <FontAwesomeIcon icon={act.icon} />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <h4 className="font-bold text-foreground">{act.title}</h4>
                          <p className="text-muted-foreground text-[10px]">{act.subtitle}</p>
                          <span className="text-[9px] text-muted-foreground/60 block pt-0.5">
                            {act.date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Doctors List Tab */}
          {activeTab === 'doctors' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-[32%] text-muted-foreground text-xs" />
                <Input
                  placeholder={language === 'vi' ? 'Tìm bác sĩ theo tên, email, CCHN...' : 'Search by name, email, license...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setDoctorsPage(0)
                  }}
                  className="pl-9 text-xs border-border placeholder:text-muted-foreground/60 bg-card"
                />
              </div>

              {/* Table */}
              <Card className="border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                <div className="divide-y divide-border md:hidden">
                  {filteredDoctors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      {language === 'vi' ? 'Không tìm thấy bác sĩ nào.' : 'No doctors found.'}
                    </div>
                  ) : (
                    filteredDoctors.map((doc) => {
                      const isLocked = bannedUserIds.has(doc.user_id)
                      return (
                        <div key={doc.id} className="space-y-3 p-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <h3 className="truncate text-xs font-bold text-foreground">{doc.full_name}</h3>
                                {doc.role === 'admin' && (
                                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-[11px] text-muted-foreground">{doc.email || 'N/A'}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isLocked
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {isLocked
                                ? (language === 'vi' ? 'Bị khóa' : 'Locked')
                                : (language === 'vi' ? 'Hoạt động' : 'Active')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-muted-foreground">{language === 'vi' ? 'CCHN' : 'License'}</span>
                              <p className="mt-0.5 truncate font-semibold text-foreground">{doc.cchn_number || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{language === 'vi' ? 'Vai trò' : 'Role'}</span>
                              <p className="mt-0.5 font-semibold text-foreground">
                                {doc.role === 'admin' ? 'Admin' : (language === 'vi' ? 'Bác sĩ' : 'Doctor')}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">{language === 'vi' ? 'Chuyên khoa / Nơi làm việc' : 'Specialty / Workplace'}</span>
                              <p className="mt-0.5 line-clamp-2 font-semibold text-foreground">
                                {doc.specialty ? `${doc.specialty} • ${doc.workplace || 'N/A'}` : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-2 pt-1">
                            <button
                              onClick={() => setSelectedDoctorCme(doc)}
                              className="flex h-11 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 transition-colors hover:bg-emerald-500/20"
                              title={language === 'vi' ? 'Xem & Quản lý CME' : 'View & Manage CME'}
                            >
                              <FontAwesomeIcon icon={faFolderOpen} className="text-sm" />
                            </button>
                            <button
                              onClick={() => setEditingDoctor(doc)}
                              className="flex h-11 items-center justify-center rounded bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                              title={language === 'vi' ? 'Sửa thông tin' : 'Edit Profile'}
                            >
                              <FontAwesomeIcon icon={faUserPen} className="text-sm" />
                            </button>
                            <button
                              onClick={() => setResetPasswordUser(doc)}
                              className="flex h-11 items-center justify-center rounded bg-amber-500/10 text-amber-600 transition-colors hover:bg-amber-500/20"
                              title={language === 'vi' ? 'Đổi mật khẩu' : 'Reset Password'}
                            >
                              <FontAwesomeIcon icon={faKey} className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleToggleLock(doc)}
                              className={`flex h-11 items-center justify-center rounded transition-colors ${
                                isLocked
                                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                              }`}
                              title={isLocked ? (language === 'vi' ? 'Mở khóa' : 'Unlock') : (language === 'vi' ? 'Khóa tài khoản' : 'Lock Account')}
                            >
                              <FontAwesomeIcon icon={isLocked ? faUnlock : faLock} className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(doc)}
                              className="flex h-11 items-center justify-center rounded bg-rose-500/10 text-rose-600 transition-colors hover:bg-rose-500/20"
                              title={language === 'vi' ? 'Xóa tài khoản' : 'Delete Account'}
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20 text-muted-foreground font-semibold">
                        <th className="p-3.5">{language === 'vi' ? 'Họ và Tên' : 'Full Name'}</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">{language === 'vi' ? 'Số CCHN' : 'License ID'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Chuyên khoa / Nơi làm việc' : 'Specialty / Workplace'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                        <th className="p-3.5 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            {language === 'vi' ? 'Không tìm thấy bác sĩ nào.' : 'No doctors found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc) => {
                          const isLocked = bannedUserIds.has(doc.user_id)
                          return (
                            <tr key={doc.id} className="hover:bg-secondary/15 transition-colors">
                              <td className="p-3.5 font-bold text-foreground">
                                <div className="flex items-center space-x-2">
                                  <span>{doc.full_name}</span>
                                  {doc.role === 'admin' && (
                                    <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[9px] font-bold rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 text-muted-foreground">{doc.email || 'N/A'}</td>
                              <td className="p-3.5 font-semibold text-foreground">{doc.cchn_number || 'N/A'}</td>
                              <td className="p-3.5 text-muted-foreground">
                                {doc.specialty ? (
                                  <span>{doc.specialty} • {doc.workplace || 'N/A'}</span>
                                ) : (
                                  <span>N/A</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className={`capitalize ${doc.role === 'admin' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                  {doc.role === 'admin' ? 'Admin' : (language === 'vi' ? 'Bác sĩ' : 'Doctor')}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  isLocked 
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isLocked 
                                    ? (language === 'vi' ? 'Bị khóa' : 'Locked') 
                                    : (language === 'vi' ? 'Hoạt động' : 'Active')}
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1">
                                <button
                                  onClick={() => setSelectedDoctorCme(doc)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-emerald-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700"
                                  title={language === 'vi' ? 'Xem & Quản lý CME' : 'View & Manage CME'}
                                >
                                  <FontAwesomeIcon icon={faFolderOpen} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => setEditingDoctor(doc)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-primary transition-colors hover:bg-primary/10 hover:text-primary/80"
                                  title={language === 'vi' ? 'Sửa thông tin' : 'Edit Profile'}
                                >
                                  <FontAwesomeIcon icon={faUserPen} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => setResetPasswordUser(doc)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-amber-600 transition-colors hover:bg-amber-500/10 hover:text-amber-700"
                                  title={language === 'vi' ? 'Đổi mật khẩu' : 'Reset Password'}
                                >
                                  <FontAwesomeIcon icon={faKey} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleToggleLock(doc)}
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors ${
                                    isLocked 
                                      ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10' 
                                      : 'text-rose-600 hover:text-rose-700 hover:bg-rose-500/10'
                                  }`}
                                  title={isLocked ? (language === 'vi' ? 'Mở khóa' : 'Unlock') : (language === 'vi' ? 'Khóa tài khoản' : 'Lock Account')}
                                >
                                  <FontAwesomeIcon icon={isLocked ? faUnlock : faLock} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(doc)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-rose-600 transition-colors hover:bg-rose-500/10 hover:text-rose-700"
                                  title={language === 'vi' ? 'Xóa tài khoản' : 'Delete Account'}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {totalDoctorsCount > 50 && (
                  <div className="flex flex-col gap-3 border-t border-border bg-secondary/5 p-3.5 text-xs text-muted-foreground select-none sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {language === 'vi' 
                        ? `Hiển thị ${doctorsPage * 50 + 1}-${Math.min((doctorsPage + 1) * 50, totalDoctorsCount)} trong tổng số ${totalDoctorsCount} bác sĩ`
                        : `Showing ${doctorsPage * 50 + 1}-${Math.min((doctorsPage + 1) * 50, totalDoctorsCount)} of ${totalDoctorsCount} doctors`}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={doctorsPage === 0}
                        onClick={() => setDoctorsPage(prev => Math.max(0, prev - 1))}
                        className="h-10 bg-transparent px-3 text-xs font-semibold border-border sm:h-8"
                      >
                        {language === 'vi' ? 'Trước' : 'Previous'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(doctorsPage + 1) * 50 >= totalDoctorsCount}
                        onClick={() => setDoctorsPage(prev => prev + 1)}
                        className="h-10 bg-transparent px-3 text-xs font-semibold border-border sm:h-8"
                      >
                        {language === 'vi' ? 'Sau' : 'Next'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Password Resets Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4 animate-fadeIn">
              <Card className="border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20 text-muted-foreground font-semibold">
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">{language === 'vi' ? 'Ngày Yêu cầu' : 'Requested At'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                        <th className="p-3.5 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            {language === 'vi' ? 'Không có yêu cầu khôi phục nào.' : 'No reset requests found.'}
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => (
                          <tr key={req.id} className="hover:bg-secondary/15 transition-colors">
                            <td className="p-3.5 font-bold text-foreground">{req.email}</td>
                            <td className="p-3.5 text-muted-foreground">
                              {new Date(req.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                req.status === 'pending'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : req.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                              }`}>
                                {req.status === 'pending' 
                                  ? (language === 'vi' ? 'Đang chờ' : 'Pending') 
                                  : req.status === 'completed' 
                                  ? (language === 'vi' ? 'Đã xử lý' : 'Completed') 
                                  : (language === 'vi' ? 'Từ chối' : 'Rejected')}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              {req.status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => setResetPasswordUser(req)}
                                    size="sm"
                                    className="h-7 text-[10px] font-semibold bg-primary text-white hover:bg-primary/95 shadow-sm"
                                  >
                                    <FontAwesomeIcon icon={faKey} className="mr-1.5" />
                                    {language === 'vi' ? 'Duyệt & Gửi Email' : 'Approve & Email'}
                                  </Button>
                                  <button
                                    onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                    className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-secondary rounded transition-colors"
                                    title={language === 'vi' ? 'Từ chối' : 'Reject'}
                                  >
                                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={async () => {
                                  if (window.confirm(language === 'vi' ? 'Xóa yêu cầu này?' : 'Delete this request?')) {
                                    await supabase.from('password_reset_requests').delete().eq('id', req.id)
                                    toast.success(language === 'vi' ? 'Đã xóa yêu cầu.' : 'Request deleted.')
                                    loadData()
                                  }
                                }}
                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-secondary rounded transition-colors"
                                title={language === 'vi' ? 'Xóa' : 'Delete'}
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Edit Doctor Dialog */}
      <Dialog open={editingDoctor !== null} onOpenChange={(open) => !open && setEditingDoctor(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-card border-border text-foreground">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {language === 'vi' ? 'Sửa thông tin Bác sĩ' : 'Edit Doctor Profile'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {language === 'vi' ? 'Cập nhật các thông tin thực hành và CCHN của bác sĩ.' : "Update doctor's practice and license details."}
              </DialogDescription>
            </DialogHeader>

            {editingDoctor && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_name" className="text-xs">{t.fullNameLabel} *</Label>
                  <Input
                    id="edit_name"
                    value={editingDoctor.full_name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, full_name: e.target.value })}
                    className="text-xs border-border"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_phone" className="text-xs">{t.phoneLabel}</Label>
                    <Input
                      id="edit_phone"
                      value={editingDoctor.phone || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                      className="text-xs border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_cchn" className="text-xs">{t.cchnNumber}</Label>
                    <Input
                      id="edit_cchn"
                      value={editingDoctor.cchn_number || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, cchn_number: e.target.value })}
                      className="text-xs border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_specialty" className="text-xs">{t.specialty}</Label>
                    <Input
                      id="edit_specialty"
                      value={editingDoctor.specialty || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                      className="text-xs border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_province" className="text-xs">{t.province}</Label>
                    <Input
                      id="edit_province"
                      value={editingDoctor.province || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, province: e.target.value })}
                      className="text-xs border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_workplace" className="text-xs">{language === 'vi' ? 'Nơi công tác' : 'Workplace'}</Label>
                  <Input
                    id="edit_workplace"
                    value={editingDoctor.workplace || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, workplace: e.target.value })}
                    className="text-xs border-border"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_target" className="text-xs">{t.targetCreditsLabel}</Label>
                    <Input
                      id="edit_target"
                      type="number"
                      value={editingDoctor.cme_target_credits}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, cme_target_credits: Number(e.target.value) })}
                      className="text-xs border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_role" className="text-xs">{language === 'vi' ? 'Vai trò' : 'Role'} *</Label>
                    <Select
                      defaultValue={editingDoctor.role}
                      onValueChange={(val: 'doctor' | 'admin') => setEditingDoctor({ ...editingDoctor, role: val })}
                    >
                      <SelectTrigger id="edit_role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">{language === 'vi' ? 'Bác sĩ' : 'Doctor'}</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" className="text-xs h-8.5" onClick={() => setEditingDoctor(null)} disabled={isSubmitting}>
                {t.cancelBtn}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8.5 px-4 shadow-sm">
                {isSubmitting ? t.savingBtn : t.saveBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Email Dialog */}
      <Dialog open={resetPasswordUser !== null} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-card border-border text-foreground">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {language === 'vi' ? 'Gửi email đặt lại mật khẩu' : 'Send Password Reset Email'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {language === 'vi' 
                  ? `Hệ thống sẽ gửi liên kết đặt lại mật khẩu tới: ${resetPasswordUser?.email}`
                  : `The system will send a password reset link to: ${resetPasswordUser?.email}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-md border border-primary/15 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
                {language === 'vi'
                  ? 'Người dùng sẽ tự đặt mật khẩu mới qua email. Admin không cần biết hoặc nhập mật khẩu của người dùng.'
                  : 'The user will set a new password from the email link. Admins do not need to know or enter user passwords.'}
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" className="text-xs h-8.5" onClick={() => setResetPasswordUser(null)} disabled={isSubmitting}>
                {t.cancelBtn}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8.5 px-4 shadow-sm">
                {isSubmitting ? (language === 'vi' ? 'Đang gửi...' : 'Sending...') : (language === 'vi' ? 'Gửi email' : 'Send Email')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Doctor CME Folder Dialog */}
      <Dialog open={selectedDoctorCme !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedDoctorCme(null)
          setIsCmeFormOpen(false)
          setEditingCourse(null)
        }
      }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-card border-border text-foreground overflow-y-auto max-h-[85vh]">
          <DialogHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faFolderOpen} className="text-emerald-500" />
                <span>
                  {language === 'vi' 
                    ? `Hồ sơ CME: BS. ${selectedDoctorCme?.full_name}` 
                    : `CME Folder: Dr. ${selectedDoctorCme?.full_name}`}
                </span>
              </DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
                {selectedDoctorCme?.email} • CCHN: {selectedDoctorCme?.cchn_number || 'N/A'}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Form to Add/Edit Course */}
          {isCmeFormOpen ? (
            <form onSubmit={handleCmeFormSubmit} className="space-y-4 py-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-foreground">
                {editingCourse 
                  ? (language === 'vi' ? 'Chỉnh sửa khóa học CME' : 'Edit CME Course') 
                  : (language === 'vi' ? 'Thêm khóa học CME mới cho bác sĩ' : 'Record New CME Course for Doctor')}
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="course_name" className="text-xs">{t.courseNameLabel} *</Label>
                <Input
                  id="course_name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="text-xs border-border"
                  placeholder={language === 'vi' ? 'Tên khóa đào tạo liên tục...' : 'Course title...'}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="provider_name" className="text-xs">{t.providerNameLabel} *</Label>
                  <Input
                    id="provider_name"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="text-xs border-border"
                    placeholder={language === 'vi' ? 'Đơn vị cấp chứng chỉ...' : 'Issuing provider...'}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="provider_type" className="text-xs">{language === 'vi' ? 'Loại hình đơn vị' : 'Provider Type'} *</Label>
                  <Select
                    value={providerType}
                    onValueChange={(val: ProviderType) => setProviderType(val)}
                  >
                    <SelectTrigger id="provider_type" className="text-xs border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">{language === 'vi' ? 'Bệnh viện' : 'Hospital'}</SelectItem>
                      <SelectItem value="university">{language === 'vi' ? 'Đại học Y' : 'University'}</SelectItem>
                      <SelectItem value="association">{language === 'vi' ? 'Hội nghề nghiệp' : 'Association'}</SelectItem>
                      <SelectItem value="online">{language === 'vi' ? 'Trực tuyến' : 'Online'}</SelectItem>
                      <SelectItem value="other">{language === 'vi' ? 'Khác' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="credits" className="text-xs">{t.creditsLabel} *</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="text-xs border-border"
                    required
                    min={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="course_type" className="text-xs">{language === 'vi' ? 'Hình thức đào tạo' : 'Course Type'} *</Label>
                  <Select
                    value={courseType}
                    onValueChange={(val: CourseType) => setCourseType(val)}
                  >
                    <SelectTrigger id="course_type" className="text-xs border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory">{language === 'vi' ? 'Lý thuyết' : 'Theory'}</SelectItem>
                      <SelectItem value="clinical">{language === 'vi' ? 'Lâm sàng' : 'Clinical'}</SelectItem>
                      <SelectItem value="online">{language === 'vi' ? 'Trực tuyến' : 'Online'}</SelectItem>
                      <SelectItem value="conference">{language === 'vi' ? 'Hội nghị/Hội thảo' : 'Conference'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="verification_status" className="text-xs">{language === 'vi' ? 'Trạng thái duyệt' : 'Verification Status'} *</Label>
                  <Select
                    value={verificationStatus}
                    onValueChange={(val: VerificationStatus) => setVerificationStatus(val)}
                  >
                    <SelectTrigger id="verification_status" className="text-xs border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self_entered">{language === 'vi' ? 'Tự khai báo' : 'Self Entered'}</SelectItem>
                      <SelectItem value="provider_verified">{language === 'vi' ? 'Đã phê duyệt' : 'Approved'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="start_date" className="text-xs">{t.startDateLabel} *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs border-border"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_date" className="text-xs">{t.endDateLabel} *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">{t.notesLabel}</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs border-border"
                  placeholder={language === 'vi' ? 'Ghi chú thêm...' : 'Additional notes...'}
                />
              </div>

              {/* Certificate Upload Component */}
              <CertificateUpload
                value={certificateUrl}
                onChange={(url, name) => {
                  setCertificateUrl(url)
                  setCertificateName(name)
                }}
                fileName={certificateName}
              />

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => {
                    setIsCmeFormOpen(false)
                    setEditingCourse(null)
                  }}
                  disabled={isSubmitting}
                >
                  {t.cancelBtn}
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isSubmitting} 
                  className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold px-4 shadow-sm"
                >
                  {isSubmitting ? t.savingBtn : t.saveBtn}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground">
                  {language === 'vi' ? `Danh sách Chứng chỉ (${doctorCourses.length})` : `Certificate List (${doctorCourses.length})`}
                </h4>
                <Button 
                  onClick={() => openCmeForm(null)}
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/95 text-[10px] font-semibold h-7 px-3 flex items-center gap-1.5 shadow-sm"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                  <span>{language === 'vi' ? 'Nạp CME hộ' : 'Record CME'}</span>
                </Button>
              </div>

              <div className="divide-y divide-border/60 max-h-[50vh] overflow-y-auto border border-border rounded-lg bg-secondary/5 pr-1.5 pl-2.5">
                {loadingDoctorCourses ? (
                  <div className="text-center py-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-primary text-sm" />
                    <span>{language === 'vi' ? 'Đang tải minh chứng...' : 'Loading proofs...'}</span>
                  </div>
                ) : doctorCourses.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {language === 'vi' ? 'Bác sĩ chưa ghi nhận khóa học nào.' : 'No courses recorded by this doctor.'}
                  </div>
                ) : (
                  doctorCourses.map((c) => {
                    const isVerified = c.verification_status !== 'self_entered'
                    return (
                      <div key={c.id} className="py-3 flex items-center justify-between first:pt-3 last:pb-3">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-foreground">{c.course_name}</h5>
                          <p className="text-[10px] text-muted-foreground">
                            {c.provider_name} • {c.credits} {language === 'vi' ? 'tín chỉ' : 'credits'} • {c.end_date}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                              isVerified 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {isVerified 
                                ? (language === 'vi' ? 'Đã phê duyệt' : 'Verified') 
                                : (language === 'vi' ? 'Tự khai báo' : 'Self Entered')}
                            </span>
                            {c.certificate_url && (
                              <button 
                                onClick={() => handleViewCertificate(c.certificate_url)}
                                className="text-[9px] text-primary hover:underline font-semibold flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faEye} />
                                <span>{language === 'vi' ? 'Xem minh chứng' : 'View Proof'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCmeToggleVerify(c)}
                            className={`p-1.5 rounded transition-colors ${
                              isVerified 
                                ? 'text-amber-600 hover:bg-amber-500/10 hover:text-amber-700' 
                                : 'text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700'
                            }`}
                            title={isVerified ? (language === 'vi' ? 'Hủy duyệt' : 'Unverify') : (language === 'vi' ? 'Phê duyệt' : 'Verify')}
                          >
                            <FontAwesomeIcon icon={isVerified ? faTimes : faCheck} className="text-xs" />
                          </button>
                          <button
                            onClick={() => openCmeForm(c)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                            title={language === 'vi' ? 'Sửa' : 'Edit'}
                          >
                            <FontAwesomeIcon icon={faUserPen} className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleCmeDelete(c.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded transition-colors"
                            title={language === 'vi' ? 'Xóa' : 'Delete'}
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => setSelectedDoctorCme(null)} 
                  variant="outline" 
                  size="sm"
                  className="text-xs font-semibold h-8 px-4"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
