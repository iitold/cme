import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faBook, 
  faUser,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore } from '../stores/auth.store'
import { useLanguageStore } from '../stores/language.store'
import { useCourses } from '../hooks/useCourses'
import { useCMEStatus } from '../hooks/useCMEStatus'
import { ProgressRing } from '../components/cme/ProgressRing'
import { AlertBanner } from '../components/cme/AlertBanner'
import { CycleCountdown } from '../components/cme/CycleCountdown'
import { formatVietnamDate, parseLocalDate, addYears } from '../lib/date'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { translations } from '../lib/translations'

export const Dashboard: React.FC = () => {
  const { doctor } = useAuthStore()
  const { courses, isLoading: isCoursesLoading } = useCourses()
  const cmeStatus = useCMEStatus()
  const { language } = useLanguageStore()
  const t = translations[language]

  const isCourseValid = (endDateStr: string) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const fiveYearsAgo = addYears(todayMidnight, -5)
    if (!fiveYearsAgo) return true
    const endDate = parseLocalDate(endDateStr)
    if (!endDate) return false
    return endDate.getTime() >= fiveYearsAgo.getTime()
  }

  if (!doctor) return null

  const recentCourses = courses.slice(0, 3)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {t.hello}, BS. {doctor.full_name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.dashboardSubtitle}
          </p>
        </div>
        <div>
          <Link to="/courses?add=true">
            <Button className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/95 text-xs h-9 font-semibold shadow-sm">
              <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
              <span>{t.recordNewCme}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Banner based on status */}
      {cmeStatus && (
        <AlertBanner
          alertLevel={cmeStatus.alertLevel}
          monthsRemaining={cmeStatus.monthsRemaining}
          remainingCredits={cmeStatus.remainingCredits}
        />
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Progress Ring Card */}
        <Card className="md:col-span-1 border-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t.accumulationRate}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2 pb-4">
            {cmeStatus ? (
              <>
                <ProgressRing
                  totalCredits={cmeStatus.totalCredits}
                  targetCredits={cmeStatus.targetCredits}
                  progressPercent={cmeStatus.progressPercent}
                />
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {cmeStatus.remainingCredits > 0 ? (
                    <span>{t.needMore.replace('{credits}', String(cmeStatus.remainingCredits))}</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.cycleCompleted}</span>
                  )}
                </p>
              </>
            ) : (
              <div className="h-[160px] w-[160px] animate-pulse rounded-full bg-secondary/80" />
            )}
          </CardContent>
        </Card>

        {/* Time Tracking / Info Cards */}
        <div className="md:col-span-2 space-y-6">
          {cmeStatus && (
            <CycleCountdown
              daysRemaining={cmeStatus.daysRemaining}
              cycleEndDate={cmeStatus.cycleEndDate}
            />
          )}

          {/* CCHN Profile Details */}
          <Card className="border-border bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4 border-b border-border/60 pb-2">
                <FontAwesomeIcon icon={faUser} className="text-primary" />
                <span>{t.cchnDetails}</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground">{t.cchnNumber}</span>
                  <p className="font-semibold text-foreground mt-0.5">{doctor.cchn_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.specialty}</span>
                  <p className="font-semibold text-foreground mt-0.5">{doctor.specialty || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.workplace}</span>
                  <p className="font-semibold text-foreground mt-0.5 truncate">{doctor.workplace || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.cchnCycleStart}</span>
                  <p className="font-semibold text-foreground mt-0.5">{formatVietnamDate(doctor.cchn_cycle_start)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Courses List */}
      <Card className="border-border bg-white dark:bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faBook} className="text-primary" />
            <span>{t.recentCourses}</span>
          </CardTitle>
          <Link to="/courses" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>{t.viewAll}</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          </Link>
        </CardHeader>
        <CardContent className="pt-2">
          {isCoursesLoading ? (
            <div className="space-y-2.5 py-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 animate-pulse rounded bg-secondary/80" />
              ))}
            </div>
          ) : recentCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-muted-foreground">{t.noRecentCourses}</p>
              <Link to="/courses?add=true" className="mt-3">
                <Button variant="outline" size="sm" className="border-border text-xs">
                  {t.addFirstCourse}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentCourses.map((course) => {
                const isValid = isCourseValid(course.end_date)
                return (
                  <div key={course.id} className={`flex items-center justify-between py-3.5 first:pt-1 last:pb-1 ${!isValid ? 'opacity-70' : ''}`}>
                    <div>
                      <h4 className={`text-xs font-bold text-foreground ${!isValid ? 'line-through decoration-muted-foreground/60' : ''}`}>{course.course_name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {course.provider_name} • {formatVietnamDate(course.end_date)}
                        {!isValid && <span className="text-destructive font-medium ml-1.5">(Hết hạn quá 5 năm)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isValid ? (
                        <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          +{course.credits} tín chỉ
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          +{course.credits} tín chỉ (hết hạn)
                        </span>
                      )}
                      {course.certificate_url && (
                        <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Minh chứng
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
