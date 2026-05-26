import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useAuthStore } from '../../stores/auth.store'
import { useLanguageStore } from '../../stores/language.store'
import { translations } from '../../lib/translations'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, doctor, isLoading, isInitialized, signOut } = useAuthStore()
  const location = useLocation()
  const [takeTooLong, setTakeTooLong] = useState(false)
  const { language } = useLanguageStore()
  const t = translations[language]

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (isLoading || !isInitialized) {
      timer = setTimeout(() => {
        setTakeTooLong(true)
      }, 6000) // 6 seconds timeout
    }
    return () => {
      setTakeTooLong(false)
      if (timer) clearTimeout(timer)
    }
  }, [isLoading, isInitialized])

  if (isLoading || !isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground animate-fadeIn">
        <div className="flex flex-col items-center space-y-4 max-w-xs text-center p-6">
          <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin" style={{ fontSize: '32px' }} />
          <p className="text-xs text-muted-foreground mt-2">{t.loadFailed}</p>
          
          {takeTooLong && (
            <div className="mt-4 pt-4 border-t border-border animate-fadeIn">
              <p className="text-xs text-destructive mb-3">{t.takeTooLong}</p>
              <button 
                onClick={() => signOut()}
                className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary/90 transition-colors shadow-sm"
              >
                {t.logoutAndRetry}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not logged in
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but no profile (hasn't completed onboarding)
  if (!doctor && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Logged in and has profile but trying to go to onboarding
  if (doctor && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
