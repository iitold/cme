import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCircleCheck,
  faCircleInfo,
  faBell,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import type { AlertLevel } from '../../types'
import { useLanguageStore } from '../../stores/language.store'

interface AlertBannerProps {
  alertLevel: AlertLevel
  monthsRemaining: number
  remainingCredits: number
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alertLevel,
  monthsRemaining,
  remainingCredits,
}) => {
  const { language } = useLanguageStore()
  const isVi = language === 'vi'

  if (alertLevel === 'none' && remainingCredits > 0) return null

  if (remainingCredits === 0) {
    return (
      <div 
        className="flex items-center gap-3 rounded-lg border border-emerald-250 bg-emerald-50/40 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20"
        role="alert"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {isVi ? 'Đã hoàn thành mục tiêu CME!' : 'CME Target Completed!'}
          </h4>
          <p className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 mt-0.5">
            {isVi 
              ? 'Chúc mừng bác sĩ đã tích lũy đủ số tín chỉ yêu cầu cho chu kỳ hiện tại.' 
              : 'Congratulations! You have accumulated enough credits for the current cycle.'}
          </p>
        </div>
      </div>
    )
  }

  const alertConfigs = {
    info: {
      border: 'border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      title: isVi ? 'Nhắc nhở chu kỳ CME' : 'CME Cycle Reminder',
      desc: isVi 
        ? `Bác sĩ còn ${monthsRemaining} tháng để tích lũy thêm ${remainingCredits} tín chỉ. Hãy sắp xếp tham gia các lớp học bổ sung.`
        : `You have ${monthsRemaining} months left to accumulate ${remainingCredits} credits. Please arrange to participate in additional courses.`,
      icon: faCircleInfo,
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      title: isVi ? 'Chú ý thời hạn chu kỳ' : 'Cycle Deadline Notice',
      desc: isVi 
        ? `Chu kỳ CME sẽ kết thúc sau ${monthsRemaining} tháng. Bác sĩ còn thiếu ${remainingCredits} tín chỉ. Hãy đăng ký các khóa học gấp.`
        : `The CME cycle will end in ${monthsRemaining} months. You are missing ${remainingCredits} credits. Please register for courses urgently.`,
      icon: faBell,
    },
    critical: {
      border: 'border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20 motion-safe:animate-pulse',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      title: isVi ? 'CẢNH BÁO SẮP HẾT HẠN' : 'EXPIRATION WARNING',
      desc: isVi 
        ? `Thời hạn chu kỳ chỉ còn ${monthsRemaining} tháng! Bác sĩ vẫn thiếu ${remainingCredits} tín chỉ. Việc thiếu CME có thể ảnh hưởng đến CCHN theo quy định pháp luật.`
        : `The cycle deadline is in only ${monthsRemaining} months! You are still missing ${remainingCredits} credits. Lack of CME might affect your practice certificate.`,
      icon: faTriangleExclamation,
    },
    overdue: {
      border: 'border-red-350 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20',
      iconBg: 'bg-red-500/10 text-red-650 dark:text-red-400',
      title: isVi ? 'HỒ SƠ QUÁ HẠN CHU KỲ CME' : 'CME CYCLE OVERDUE',
      desc: isVi 
        ? `Chu kỳ 5 năm của bác sĩ đã kết thúc nhưng hồ sơ vẫn thiếu so với mục tiêu. Bác sĩ cần sớm bổ sung các chứng nhận CME theo Thông tư 32/2023/TT-BYT.`
        : `Your 5-year cycle has ended but your record is short of the target. Please upload missing CME certificates as soon as possible.`,
      icon: faTriangleExclamation,
    }
  }

  const config = alertConfigs[alertLevel as keyof typeof alertConfigs]
  if (!config) return null

  return (
    <div 
      className={`flex items-start gap-3 rounded-lg border p-3.5 ${config.border}`}
      role="alert"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${config.iconBg}`}>
        <FontAwesomeIcon icon={config.icon} className="text-sm" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-foreground">
          {config.title}
        </h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          {config.desc}
        </p>
      </div>
    </div>
  )
}
