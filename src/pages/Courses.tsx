import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faMagnifyingGlass, 
  faTrash, 
  faPenToSquare, 
  faFileLines, 
  faCalendarDays, 
  faBook, 
  faCircleExclamation,
  faFilter
} from '@fortawesome/free-solid-svg-icons'
import { useCourses } from '../hooks/useCourses'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import type { Course } from '../types'
import { CourseForm } from '../components/cme/CourseForm'
import type { CourseSchemaInput } from '../schemas/course.schema'
import { formatVietnamDate, parseLocalDate, addYears } from '../lib/date'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { getCertificatePath, getSignedUrl } from '../lib/storageHelpers'
import { toast } from 'sonner'

export const Courses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { courses, isLoading, addCourse, updateCourse, deleteCourse } = useCourses()
  const { language } = useLanguageStore()
  const t = translations[language]

  const handleViewCertificate = async (urlOrPath: string | undefined | null) => {
    if (!urlOrPath) return
    const path = getCertificatePath(urlOrPath)
    if (!path) return
    try {
      const signedUrl = await getSignedUrl(path)
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noreferrer')
      }
    } catch (err) {
      console.error('Failed to view certificate:', err)
    }
  }

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Open form directly if query param has add=true
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFormOpen(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || course.course_type === filterType

    return matchesSearch && matchesType
  })

  const handleAddClick = () => {
    setEditingCourse(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (course: Course) => {
    setEditingCourse(course)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (data: CourseSchemaInput) => {
    setIsSubmitting(true)
    try {
      if (editingCourse) {
        await updateCourse({ id: editingCourse.id, ...data })
        toast.success('Cập nhật khóa học thành công!')
      } else {
        await addCourse(data)
        toast.success('Thêm khóa học mới thành công!')
      }
      setIsFormOpen(false)
      setEditingCourse(null)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Đã xảy ra lỗi!'
      toast.error(message)
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCourseId) return
    setIsSubmitting(true)
    try {
      await deleteCourse(deletingCourseId)
      toast.success('Đã xóa khóa học thành công!')
      setDeletingCourseId(null)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Lỗi khi xóa khóa học!'
      toast.error(message)
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const providerTypeLabel = (type: string) => {
    const isVi = language === 'vi'
    const labels: Record<string, string> = isVi ? {
      university: 'Đại học',
      hospital: 'Bệnh viện',
      association: 'Hiệp hội',
      online: 'Trực tuyến',
      other: 'Khác',
    } : {
      university: 'University',
      hospital: 'Hospital',
      association: 'Association',
      online: 'Online',
      other: 'Other',
    }
    return labels[type] || type
  }

  const courseTypeLabel = (type: string) => {
    const isVi = language === 'vi'
    const labels: Record<string, string> = isVi ? {
      theory: 'Lý thuyết',
      clinical: 'Thực hành',
      online: 'Trực tuyến',
      conference: 'Hội nghị',
    } : {
      theory: 'Theory',
      clinical: 'Clinical',
      online: 'Online',
      conference: 'Conference',
    }
    return labels[type] || type
  }

  const isCourseValid = (endDateStr: string) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const fiveYearsAgo = addYears(todayMidnight, -5)
    if (!fiveYearsAgo) return true
    const endDate = parseLocalDate(endDateStr)
    if (!endDate) return false
    return endDate.getTime() >= fiveYearsAgo.getTime()
  }

  return (
    <div className="space-y-5 animate-fadeIn relative pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {t.coursesTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.coursesSubtitle}
          </p>
        </div>
        <div className="hidden sm:block">
          <Button 
            onClick={handleAddClick}
            className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/95 text-xs h-9 font-semibold shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
            <span>{t.recordNewCme}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-card px-3 py-1 text-xs text-foreground focus-visible:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 cursor-pointer"
          >
            <option value="all">{t.filterAll}</option>
            <option value="theory">{t.filterTheory}</option>
            <option value="clinical">{t.filterClinical}</option>
            <option value="online">{t.filterOnline}</option>
            <option value="conference">{t.filterConference}</option>
          </select>
          <FontAwesomeIcon icon={faFilter} className="absolute right-3 top-[32%] text-muted-foreground/80 pointer-events-none text-[11px]" />
        </div>
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded bg-secondary/80" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card className="border-border bg-white dark:bg-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <FontAwesomeIcon icon={faBook} className="text-muted-foreground/60 mb-2 text-2xl" />
            <p className="text-xs text-muted-foreground">{t.noCoursesFound}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id} 
              className="border-border bg-white dark:bg-card shadow-sm hover:border-primary/45 transition-colors"
            >
              <CardContent className="flex flex-col justify-between p-4.5 sm:flex-row sm:items-center gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                      {providerTypeLabel(course.provider_type)}
                    </span>
                    <span className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-[9px] font-bold text-secondary-foreground">
                      {courseTypeLabel(course.course_type)}
                    </span>
                    {isCourseValid(course.end_date) ? (
                      <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {t.valid}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-destructive/10 px-2 py-0.5 text-[9px] font-bold text-destructive">
                        {t.expiredBadgeText}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-foreground leading-snug break-words">
                    {course.course_name}
                  </h3>
                  
                  <p className="text-[11px] text-muted-foreground">
                    {language === 'vi' ? 'Đơn vị:' : 'Organizer:'} <span className="font-semibold text-foreground">{course.provider_name}</span>
                  </p>
                  
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-[11px]" />
                    <span>
                      {language === 'vi' 
                        ? `Học từ ${formatVietnamDate(course.start_date)} đến ${formatVietnamDate(course.end_date)}`
                        : `Study from ${formatVietnamDate(course.start_date)} to ${formatVietnamDate(course.end_date)}`}
                    </span>
                  </p>

                  {course.notes && (
                    <p className="text-[10px] italic text-muted-foreground/80 mt-1">
                      {language === 'vi' ? 'Ghi chú:' : 'Notes:'} {course.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end gap-2 shrink-0">
                  <div className="text-left sm:text-right">
                    {isCourseValid(course.end_date) ? (
                      <>
                        <span className="text-xl font-extrabold text-primary">
                          +{course.credits}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">{t.creditsAccumulated}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-extrabold text-muted-foreground line-through opacity-60">
                          +{course.credits}
                        </span>
                        <span className="text-[9px] text-destructive block font-medium">{t.creditsExpired}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {course.certificate_url && (
                      <button 
                        onClick={() => handleViewCertificate(course.certificate_url)}
                        title={course.certificate_name || (language === 'vi' ? "Xem chứng chỉ" : "View certificate")}
                        className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                      >
                        <FontAwesomeIcon icon={faFileLines} className="text-[13px]" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditClick(course)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white dark:bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-[13px]" />
                    </button>
                    
                    <button
                      onClick={() => setDeletingCourseId(course.id)}
                      className="flex h-8 w-8 items-center justify-center rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-[13px]" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed right-4 bottom-18 z-40 sm:hidden">
        <button
          onClick={handleAddClick}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/95 transition-transform active:scale-95 focus:outline-none"
          aria-label={t.recordNewCme}
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <FontAwesomeIcon icon={faPlus} className="text-[18px]" />
        </button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-card border-border">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-sm font-bold">{editingCourse ? t.editCourseTitle : t.addCourseTitle}</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
              {t.courseFormSubtitle}
            </DialogDescription>
          </DialogHeader>
          <CourseForm
            initialData={editingCourse || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCourseId} onOpenChange={(open) => !open && setDeletingCourseId(null)}>
        <DialogContent className="max-w-xs bg-white dark:bg-card border-border">
          <DialogHeader className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-xl" />
            </div>
            <DialogTitle className="text-center text-sm font-bold">{t.deleteCourseTitle}</DialogTitle>
            <DialogDescription className="text-center text-[10px] text-muted-foreground mt-0.5">
              {t.deleteCourseConfirm}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 mt-4 w-full">
            <Button variant="outline" size="sm" className="text-xs w-20 h-8" onClick={() => setDeletingCourseId(null)} disabled={isSubmitting}>
              {t.cancelBtn}
            </Button>
            <Button onClick={handleDeleteConfirm} size="sm" disabled={isSubmitting} className="bg-destructive text-white hover:bg-destructive/90 text-xs w-24 h-8 font-semibold">
              {isSubmitting ? t.deletingBtn : t.confirmBtn}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
