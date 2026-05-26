import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartLine, 
  faBook, 
  faAward, 
  faUser, 
  faSun, 
  faMoon,
  faBriefcaseMedical,
  faUserShield
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { Sidebar } from './Sidebar'
import { useThemeStore } from '../../stores/theme.store'
import { useLanguageStore } from '../../stores/language.store'
import { useAuthStore } from '../../stores/auth.store'
import { translations } from '../../lib/translations'

export const AppShell: React.FC = () => {
  const location = useLocation()
  const { doctor } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const t = translations[language]

  const navItems: { name: string; path: string; icon: IconDefinition }[] = [
    { name: t.navOverview, path: '/', icon: faChartLine },
    { name: t.navCourses, path: '/courses', icon: faBook },
    { name: t.navCertificates, path: '/certificates', icon: faAward },
    { name: t.navProfile, path: '/profile', icon: faUser },
  ]

  if (doctor?.role === 'admin') {
    navItems.push({
      name: language === 'vi' ? 'Quản trị' : 'Admin',
      path: '/admin',
      icon: faUserShield,
    })
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden pb-[60px] md:pb-0">
        {/* Top Header Nav (Desktop & Tablet) */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:bg-card/80">
          <div className="flex items-center space-x-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-white shadow-sm">
              <FontAwesomeIcon icon={faBriefcaseMedical} style={{ fontSize: '13px' }} />
            </div>
            <span className="text-xs font-bold tracking-tight text-foreground">{t.appName}</span>
          </div>

          <div className="hidden md:block" />

          <div className="flex items-center space-x-3.5">
            <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              {t.circularInfo}
            </span>

            {/* Language Switcher */}
            <div className="flex items-center rounded bg-secondary/80 p-0.5 text-[9px] font-extrabold border border-border/40 select-none dark:bg-secondary/15">
              <button
                onClick={() => setLanguage('vi')}
                className={`px-1.5 py-0.5 rounded transition-colors ${language === 'vi' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                VI
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded transition-colors ${language === 'en' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-7 w-7 items-center justify-center rounded border border-border/80 bg-white hover:bg-secondary/40 text-muted-foreground hover:text-foreground dark:bg-card dark:border-border/30 dark:hover:bg-secondary/10 shadow-sm"
              title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            >
              {theme === 'light' ? <FontAwesomeIcon icon={faMoon} className="text-xs" /> : <FontAwesomeIcon icon={faSun} className="text-xs" />}
            </button>
          </div>
        </header>

        {/* Dynamic Page Router Outlet */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6">
          <div key={location.pathname} className="mx-auto max-w-4xl animate-slideUp">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-md pb-safe dark:bg-card/95 md:hidden">
        <nav className="flex h-14 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-lg text-center transition-all duration-150 ${
                    isActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
                style={{ minHeight: '44px' }}
              >
                {({ isActive }) => (
                  <>
                    <FontAwesomeIcon icon={Icon} className={`text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="mt-1 text-[10px] tracking-tight leading-none">{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
