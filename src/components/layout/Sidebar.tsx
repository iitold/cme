import React from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartLine, 
  faBook, 
  faAward, 
  faUser, 
  faRightFromBracket,
  faBriefcaseMedical
} from '@fortawesome/free-solid-svg-icons'
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

  const menuItems = [
    { name: t.navOverview, path: '/', icon: faChartLine },
    { name: t.navCourses, path: '/courses', icon: faBook },
    { name: t.navCertificates, path: '/certificates', icon: faAward },
    { name: t.navProfile, path: '/profile', icon: faUser },
  ]

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

      {/* Doctor Card Profile */}
      {doctor && (
        <div className="mb-6 mx-2 rounded-lg bg-secondary/30 p-3.5 border border-border/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {doctor.full_name?.split(' ').pop()?.charAt(0) || 'D'}
            </div>
            <div className="overflow-hidden">
              <h2 className="truncate text-xs font-semibold text-foreground">
                BS. {doctor.full_name}
              </h2>
              <p className="truncate text-[10px] text-muted-foreground">
                {doctor.specialty || t.specialty}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Footer Info / Logout */}
      <div className="mt-auto border-t border-border pt-4 px-2">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center space-x-3 rounded-md px-3 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: '13px' }} />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  )
}
