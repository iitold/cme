import React from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartLine, 
  faBook, 
  faAward, 
  faUser, 
  faRightFromBracket,
  faBriefcaseMedical,
  faUserShield
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useAuthStore } from '../../stores/auth.store'
import { useLanguageStore } from '../../stores/language.store'
import { translations } from '../../lib/translations'

interface SidebarProps {
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { doctor, signOut } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]

  const menuItems: { name: string; path: string; icon: IconDefinition }[] = [
    { name: t.navOverview, path: '/', icon: faChartLine },
    { name: t.navCourses, path: '/courses', icon: faBook },
    { name: t.navCertificates, path: '/certificates', icon: faAward },
    { name: t.navProfile, path: '/profile', icon: faUser },
  ]

  if (doctor?.role === 'admin') {
    menuItems.push({
      name: language === 'vi' ? 'Quản trị hệ thống' : 'Admin Console',
      path: '/admin',
      icon: faUserShield
    })
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-white px-4 py-6 dark:bg-card">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-3 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
          <FontAwesomeIcon icon={faBriefcaseMedical} style={{ fontSize: '16px' }} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight text-foreground">
            {t.appName}
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium">{t.tagline}</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1 px-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group relative flex items-center space-x-3 rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent text-primary dark:bg-accent/15'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FontAwesomeIcon icon={Icon} style={{ fontSize: '13px' }} className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-0 top-[15%] h-[70%] w-0.5 rounded-l-md bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Account Summary */}
      <div className="mt-auto border-t border-border px-2 pt-4">
        {doctor && (
          <div className="rounded-md border border-border/50 bg-secondary/20 p-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary font-semibold text-xs border border-primary/15">
                {doctor.full_name?.split(' ').pop()?.charAt(0) || 'D'}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h2 className="truncate text-[11px] font-semibold text-foreground">
                  {doctor.role === 'admin' ? doctor.full_name : `BS. ${doctor.full_name}`}
                </h2>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {doctor.role === 'admin'
                    ? (language === 'vi' ? 'Quản trị hệ thống' : 'System administrator')
                    : (doctor.specialty || t.specialty)}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title={t.logout}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
