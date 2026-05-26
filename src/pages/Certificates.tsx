import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faAward, 
  faFileLines, 
  faDownload, 
  faEye, 
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons'
import { useCourses } from '../hooks/useCourses'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { formatVietnamDate, parseLocalDate, addYears } from '../lib/date'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getCertificatePath, getSignedUrl } from '../lib/storageHelpers'
import { SecureImage } from '../components/cme/SecureImage'

export const Certificates: React.FC = () => {
  const { courses, isLoading } = useCourses()
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

  const isCourseValid = (endDateStr: string) => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const fiveYearsAgo = addYears(todayMidnight, -5)
    if (!fiveYearsAgo) return true
    const endDate = parseLocalDate(endDateStr)
    if (!endDate) return false
    return endDate.getTime() >= fiveYearsAgo.getTime()
  }

  // Filter courses that have certificate URLs
  const certCourses = courses.filter((c) => !!c.certificate_url)

  return (
    <div className="space-y-5 animate-fadeIn pb-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t.certificatesTitle}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.certificatesSubtitle}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded bg-secondary/80" />
          ))}
        </div>
      ) : certCourses.length === 0 ? (
        <Card className="border-border bg-white dark:bg-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FontAwesomeIcon icon={faAward} className="text-muted-foreground/60 mb-3 text-3xl" />
            <h3 className="text-sm font-bold text-foreground">{t.noCertificates}</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {t.noCertificatesSubtitle}
            </p>
            <Link to="/courses?add=true" className="mt-4">
              <Button className="bg-primary text-white hover:bg-primary/95 text-xs h-9 font-semibold shadow-sm">
                {t.uploadFirstCert}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {certCourses.map((course) => {
            const isPdf = getCertificatePath(course.certificate_url).toLowerCase().endsWith('.pdf')
            const isValid = isCourseValid(course.end_date)
            return (
              <Card 
                key={course.id} 
                className={`overflow-hidden border-border bg-white dark:bg-card shadow-sm hover:border-primary/45 transition-colors group flex flex-col ${!isValid ? 'opacity-70' : ''}`}
              >
                {/* Visual Thumbnail */}
                <div className="relative h-32 bg-secondary/40 flex items-center justify-center border-b border-border/60 overflow-hidden">
                  {!isPdf && course.certificate_url ? (
                    <SecureImage 
                      srcPath={course.certificate_url} 
                      alt={course.course_name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/80">
                      <FontAwesomeIcon icon={faFileLines} className="text-primary/80 text-2xl" />
                      <span className="text-[10px] font-bold mt-1.5 uppercase tracking-wide">{t.pdfDoc}</span>
                    </div>
                  )}
                  
                  {/* Badge credits */}
                  <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-bold shadow-sm ${isValid ? 'bg-primary text-white' : 'bg-destructive text-white'}`}>
                    {isValid ? `+${course.credits} ${language === 'vi' ? 'TC' : 'Credits'}` : t.expired}
                  </div>
                </div>

                <CardHeader className="p-3.5 flex-1">
                  <CardTitle className={`text-xs font-bold text-foreground line-clamp-2 leading-snug ${!isValid ? 'line-through decoration-muted-foreground/60' : ''}`}>
                    {course.course_name}
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground truncate mt-1">
                    {language === 'vi' ? 'Cấp bởi:' : 'Issued by:'} {course.provider_name}
                  </p>
                </CardHeader>

                <CardContent className="px-3.5 pb-2.5 pt-0">
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-[11px]" />
                    <span>{language === 'vi' ? 'Ngày cấp:' : 'Date issued:'} {formatVietnamDate(course.end_date)}</span>
                  </div>
                </CardContent>

                <CardFooter className="p-2.5 border-t border-border/60 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewCertificate(course.certificate_url)}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 border-border text-xs sm:h-8"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-[11px]" />
                    <span>{t.viewDetails}</span>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleViewCertificate(course.certificate_url)}
                    className="h-11 w-11 p-0 text-muted-foreground hover:text-foreground sm:h-8 sm:w-8"
                  >
                    <FontAwesomeIcon icon={faDownload} className="text-[13px]" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
