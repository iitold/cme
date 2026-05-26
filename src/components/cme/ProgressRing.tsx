import React, { useEffect, useState } from 'react'

interface ProgressRingProps {
  totalCredits: number
  targetCredits: number
  progressPercent: number
  size?: number
  strokeWidth?: number
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  totalCredits,
  targetCredits,
  progressPercent,
  size = 160,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    // Animate transition from 0 to target percent on mount/change
    const targetOffset = circumference - (Math.min(100, progressPercent) / 100) * circumference
    const timer = setTimeout(() => {
      setOffset(targetOffset)
    }, 100)
    return () => clearTimeout(timer)
  }, [progressPercent, circumference])

  // Get color gradient ID based on percent
  let gradientId = 'progressBlue'
  let textColor = 'text-primary'
  if (progressPercent < 33) {
    gradientId = 'progressRed'
    textColor = 'text-destructive'
  } else if (progressPercent < 66) {
    gradientId = 'progressYellow'
    textColor = 'text-yellow-600 dark:text-yellow-500'
  } else if (progressPercent >= 100) {
    gradientId = 'progressGreen'
    textColor = 'text-emerald-600 dark:text-emerald-500'
  }

  return (
    <div 
      className="relative flex flex-col items-center justify-center"
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Tiến độ hoàn thành tín chỉ CME ${progressPercent}%`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          className="text-secondary dark:text-[#182740]"
          strokeWidth={strokeWidth}
        />
        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="progressBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1677ff" />
            <stop offset="100%" stopColor="#40a9ff" />
          </linearGradient>
          <linearGradient id="progressRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4f" />
            <stop offset="100%" stopColor="#ff7875" />
          </linearGradient>
          <linearGradient id="progressYellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#faad14" />
            <stop offset="100%" stopColor="#ffc069" />
          </linearGradient>
          <linearGradient id="progressGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#52c41a" />
            <stop offset="100%" stopColor="#73d13d" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center text-center select-none">
        <span className="text-2xl font-black tracking-tight text-foreground">
          {totalCredits}
        </span>
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
          trên {targetCredits} TC
        </span>
        <span className={`mt-0.5 text-xs font-bold ${textColor}`}>
          {progressPercent}%
        </span>
      </div>
    </div>
  )
}
