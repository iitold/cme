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
  remainingCredits: number
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alertLevel,
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
              ? 'Chúc mừng bác sĩ đã tích lũy đủ số tín chỉ yêu cầu trong 5 năm gần nhất.'
              : 'Congratulations! You have accumulated enough required credits in the last 5 years.'}
          </p>
        </div>
      </div>
    )
  }

  const alertConfigs = {
    info: {
      border: 'border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      title: isVi ? 'Nhắc nhở hồ sơ CME' : 'CME Record Reminder',
      desc: isVi 
        ? `Bác sĩ còn thiếu ${remainingCredits} tín chỉ trong giai đoạn 5 năm gần nhất. Hãy bổ sung chứng chỉ hoặc ghi nhận khóa học phù hợp.`
        : `You are missing ${remainingCredits} credits in the rolling 5-year window. Please add eligible certificates or courses.`,
      icon: faCircleInfo,
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      title: isVi ? 'Thiếu tín chỉ CME' : 'CME Credit Gap',
      desc: isVi 
        ? `Hồ sơ hiện còn thiếu ${remainingCredits} tín chỉ khi tính lùi từ hôm nay về 5 năm trước. Các chứng chỉ quá 5 năm sẽ không được cộng vào tổng này.`
        : `Your record is missing ${remainingCredits} credits when calculated from today back 5 years. Certificates older than 5 years are excluded.`,
      icon: faBell,
    },
    critical: {
      border: 'border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20 motion-safe:animate-pulse',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      title: isVi ? 'CẢNH BÁO THIẾU TÍN CHỈ' : 'CREDIT GAP WARNING',
      desc: isVi 
        ? `Bác sĩ vẫn thiếu ${remainingCredits} tín chỉ trong 5 năm gần nhất. Cần rà soát lại chứng chỉ và bổ sung khóa học hợp lệ.`
        : `You are still missing ${remainingCredits} credits in the last 5 years. Please review certificates and add eligible courses.`,
      icon: faTriangleExclamation,
    },
    overdue: {
      border: 'border-red-350 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20',
      iconBg: 'bg-red-500/10 text-red-650 dark:text-red-400',
      title: isVi ? 'HỒ SƠ CME CHƯA ĐẠT' : 'CME RECORD INCOMPLETE',
      desc: isVi 
        ? `Hồ sơ vẫn thiếu so với mục tiêu tín chỉ khi tính theo 5 năm gần nhất. Bác sĩ cần sớm bổ sung các chứng nhận CME phù hợp.`
        : `Your record is short of the target in the rolling 5-year window. Please upload eligible CME certificates as soon as possible.`,
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
