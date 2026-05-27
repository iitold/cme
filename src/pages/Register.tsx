import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, 
  faEnvelope, 
  faLock, 
  faBriefcaseMedical,
  faCircleCheck,
  faCircleExclamation,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'
import { getAuthRedirectUrl } from '../lib/authRedirect'
import { useThemeStore } from '../stores/theme.store'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { toast } from 'sonner'

const registerSchema = z.object({
  fullName: z.string().min(2, 'fullNameMinLength'),
  email: z.string().email('invalidEmail'),
  password: z.string().min(6, 'passwordMinLength'),
  confirmPassword: z.string().min(6, 'passwordMinLength'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordsMustMatch',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const t = translations[language]

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordVal, setPasswordVal] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-transparent' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1
    
    if (score === 1) return { score: 1, text: t.passwordWeak, color: 'bg-destructive' }
    if (score === 2) return { score: 2, text: t.passwordMedium, color: 'bg-yellow-500' }
    return { score: 3, text: t.passwordStrong, color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(passwordVal)

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (error) {
        setErrorMsg(error.message)
        setIsSubmitting(false)
        return
      }

      if (authData.user) {
        setSuccessMsg(t.registerSuccess)
        toast.success(t.registerSuccessToast)
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.systemError
      setErrorMsg(message)
      setIsSubmitting(false)
    }
  }

  const getErrorMessage = (errorKey: string | undefined) => {
    if (!errorKey) return ''
    if (errorKey === 'fullNameMinLength') return t.fullNameMinLength
    if (errorKey === 'invalidEmail') return t.invalidEmail
    if (errorKey === 'passwordMinLength') return t.passwordMinLength
    if (errorKey === 'passwordsMustMatch') return t.passwordsMustMatch
    return errorKey
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#070c15] px-4 transition-colors duration-200">
      {/* Floating Language/Theme Utility Bar */}
      <div className="absolute top-4 right-4 flex items-center space-x-3 z-50 animate-fadeIn">
        {/* Language Switcher */}
        <div className="flex items-center rounded bg-white/80 p-0.5 text-[9px] font-extrabold border border-border/40 select-none dark:bg-card/80 backdrop-blur">
          <button
            onClick={() => setLanguage('vi')}
            type="button"
            className={`px-1.5 py-0.5 rounded transition-colors ${language === 'vi' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            VI
          </button>
          <button
            onClick={() => setLanguage('en')}
            type="button"
            className={`px-1.5 py-0.5 rounded transition-colors ${language === 'en' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
          >
            EN
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded border border-border/80 bg-white/80 hover:bg-secondary/40 text-muted-foreground hover:text-foreground dark:bg-card dark:border-border/30 dark:hover:bg-secondary/10 shadow-sm backdrop-blur"
          title={theme === 'light' ? 'Theme mode' : 'Theme mode'}
        >
          {theme === 'light' ? <FontAwesomeIcon icon={faMoon} className="text-xs" /> : <FontAwesomeIcon icon={faSun} className="text-xs" />}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <FontAwesomeIcon icon={faBriefcaseMedical} style={{ fontSize: '18px' }} />
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">{t.appName}</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">{language === 'vi' ? 'Hệ thống quản lý tín chỉ ĐTYLLT dành cho Bác sĩ' : 'CME credit management system for Doctors'}</p>
        </div>

        <Card className="border-border bg-white dark:bg-card shadow-sm text-foreground">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-center">{t.registerTitleCard}</CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground text-center">
              {t.registerSubtitleCard}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-xs shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground">{t.fullNameLabel}</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    className="pl-9 text-xs placeholder:text-muted-foreground/60 border-border"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && <p className="text-[10px] text-destructive mt-0.5">{getErrorMessage(errors.fullName.message)}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">{language === 'vi' ? 'Email đăng ký' : 'Registration Email'}</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    className="pl-9 text-xs placeholder:text-muted-foreground/60 border-border"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-[10px] text-destructive mt-0.5">{getErrorMessage(errors.email.message)}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">{t.passwordLabel}</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.passwordPlaceholder}
                    className="pl-9 text-xs placeholder:text-muted-foreground/60 border-border"
                    {...register('password', {
                      onChange: (e) => setPasswordVal(e.target.value)
                    })}
                  />
                </div>
                {passwordVal && (
                  <div className="mt-1.5 space-y-1 animate-fadeIn">
                    <div className="flex h-1 w-full gap-1 rounded bg-secondary">
                      <div className={`h-full rounded transition-all duration-300 ${strength.color} ${strength.score >= 1 ? 'w-1/3' : 'w-0'}`} />
                      <div className={`h-full rounded transition-all duration-300 ${strength.color} ${strength.score >= 2 ? 'w-1/3' : 'w-0'}`} />
                      <div className={`h-full rounded transition-all duration-300 ${strength.color} ${strength.score >= 3 ? 'w-1/3' : 'w-0'}`} />
                    </div>
                    <p className="text-[9px] text-muted-foreground">{t.passwordStrength}: <span className="font-semibold text-foreground">{strength.text}</span></p>
                  </div>
                )}
                {errors.password && <p className="text-[10px] text-destructive mt-0.5">{getErrorMessage(errors.password.message)}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground">{t.confirmPasswordLabel}</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t.registerConfirmPasswordPlaceholder}
                    className="pl-9 text-xs placeholder:text-muted-foreground/60 border-border"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-destructive mt-0.5">{getErrorMessage(errors.confirmPassword.message)}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full text-xs h-9 bg-primary text-white hover:bg-primary/90 font-semibold mt-4 shadow-sm animate-fadeIn"
              >
                {isSubmitting ? t.registerLoading : t.registerBtn}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-1 border-t border-border/60 py-3">
            <p className="text-[11px] text-muted-foreground text-center">
              {t.hasAccount}{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                {t.loginNow}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
