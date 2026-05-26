import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { formatVietnamDate } from '../../lib/date'
import { useLanguageStore } from '../../stores/language.store'

interface CycleCountdownProps {
  daysRemaining: number
  cycleEndDate: Date
}

export const CycleCountdown: React.FC<CycleCountdownProps> = ({
  daysRemaining,
  cycleEndDate,
}) => {
  const { language } = useLanguageStore()
  const isVi = language === 'vi'
  
  const formattedEndDate = formatVietnamDate(cycleEndDate)
  const isExpired = daysRemaining <= 0

  // Urgency colors
  let countdownColor = 'text-foreground'
  let bgIconColor = 'bg-primary/10 text-primary'

  if (isExpired) {
    countdownColor = 'text-destructive'
    bgIconColor = 'bg-destructive/10 text-destructive'
  } else if (daysRemaining <= 60) {
    countdownColor = 'text-destructive'
    bgIconColor = 'bg-destructive/10 text-destructive'
  } else if (daysRemaining <= 180) {
    countdownColor = 'text-yellow-600 dark:text-yellow-500'
    bgIconColor = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-white dark:bg-card p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded ${bgIconColor}`}>
          <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: '15px' }} />
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {isVi ? 'Thời hạn chu kỳ 5 năm' : '5-Year Cycle Duration'}
          </h4>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {isVi ? 'Ngày kết thúc' : 'End date'}: {formattedEndDate}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        {isExpired ? (
          <span className="text-xs font-bold text-destructive uppercase tracking-wider">
            {isVi ? 'Đã quá hạn' : 'Overdue'}
          </span>
        ) : (
          <>
            <span className={`text-xl font-black ${countdownColor}`}>
              {daysRemaining}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              {isVi ? 'ngày còn lại' : 'days left'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
