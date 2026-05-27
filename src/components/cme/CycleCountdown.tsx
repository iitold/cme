import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { formatVietnamDate } from '../../lib/date'
import { useLanguageStore } from '../../stores/language.store'

interface CycleCountdownProps {
  windowStartDate: Date
  windowEndDate: Date
}

export const CycleCountdown: React.FC<CycleCountdownProps> = ({
  windowStartDate,
  windowEndDate,
}) => {
  const { language } = useLanguageStore()
  const isVi = language === 'vi'
  
  const formattedStartDate = formatVietnamDate(windowStartDate)
  const formattedEndDate = formatVietnamDate(windowEndDate)

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-white dark:bg-card p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-primary/10 text-primary">
          <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: '15px' }} />
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {isVi ? 'Giai đoạn đánh giá CME' : 'CME Evaluation Window'}
          </h4>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {formattedStartDate} - {formattedEndDate}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-sm font-black text-primary">
          {isVi ? '5 năm' : '5 years'}
        </span>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isVi ? 'gần nhất' : 'rolling'}
        </p>
      </div>
    </div>
  )
}
