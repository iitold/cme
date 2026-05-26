import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faBriefcaseMedical,
  faCircleExclamation,
  faCircleCheck,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { useThemeStore } from '../stores/theme.store'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginForm = z.infer<typeof loginSchema>

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { fetchDoctorProfile, signInWithOtp } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const t = translations[language]
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMagicSubmitting, setIsMagicSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password states
  const [showForgotDialog, setShowForgotDialog] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotSubmitting(true)
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .insert({ email: forgotEmail })

      if (error) throw error

      setForgotSuccess(true)
      toast.success(language === 'vi' ? 'Đã gửi yêu cầu khôi phục tới Admin!' : 'Password reset request sent to Admin!')
      setTimeout(() => {
        setShowForgotDialog(false)
        setForgotSuccess(false)
        setForgotEmail('')
      }, 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setForgotSubmitting(false)
    }
  }

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' ? t.invalidCredentials : error.message)
        setIsSubmitting(false)
        return
      }

      if (authData.user) {
        toast.success(t.loginSuccess)
        const profile = await fetchDoctorProfile(authData.user.id)
        if (profile) {
          navigate('/')
        } else {
          navigate('/onboarding')
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.systemError
      setErrorMsg(message)
      setIsSubmitting(false)
    }
  }

  const handleMagicLink = async () => {
    const email = getValues('email')
    if (!email || errors.email) {
      setErrorMsg(t.magicLinkError)
      return
    }
    setIsMagicSubmitting(true)
    setErrorMsg(null)
    try {
      await signInWithOtp(email)
      setMagicLinkSent(true)
      toast.success(t.magicLinkSuccessAlert)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.systemError
      setErrorMsg(message)
    } finally {
      setIsMagicSubmitting(false)
    }
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
            <CardTitle className="text-base font-bold text-center">{t.loginTitle}</CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground text-center">
              {t.loginSubtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-xs shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {magicLinkSent && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs shrink-0" />
                <span>{t.magicLinkSuccessAlert}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">{t.emailLabel}</Label>
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
                {errors.email && <p className="text-[10px] text-destructive mt-0.5">{t.invalidEmail}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">{t.passwordLabel}</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotDialog(true)}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    {t.forgotPassword || 'Quên mật khẩu?'}
                  </button>
                </div>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
                    className="pl-9 pr-9 text-xs placeholder:text-muted-foreground/60 border-border"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[32%] text-muted-foreground/75 hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? (
                      <FontAwesomeIcon icon={faEyeSlash} className="text-xs" />
                    ) : (
                      <FontAwesomeIcon icon={faEye} className="text-xs" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-destructive mt-0.5">{t.passwordMinLength}</p>}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full text-xs h-9 bg-primary text-white hover:bg-primary/90 font-semibold"
                >
                  {isSubmitting ? t.authenticating : t.loginBtn}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleMagicLink}
                  disabled={isMagicSubmitting}
                  variant="outline" 
                  className="w-full text-xs h-9 border-border bg-transparent text-primary hover:bg-secondary/40 font-semibold"
                >
                  {isMagicSubmitting ? t.sending : t.magicLinkBtnQuick}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-1 border-t border-border/60 py-3">
            <p className="text-[11px] text-muted-foreground text-center">
              {t.noAccount}{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                {t.registerNow}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={(open) => !open && setShowForgotDialog(false)}>
        <DialogContent className="max-w-sm bg-white dark:bg-card border-border text-foreground">
          <form onSubmit={handleForgotSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {language === 'vi' ? 'Yêu cầu khôi phục mật khẩu' : 'Forgot Password Request'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {language === 'vi' 
                  ? 'Nhập email của bạn để gửi yêu cầu đổi mật khẩu tới quản trị viên.' 
                  : 'Enter your email to send a password reset request to the administrator.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {forgotSuccess ? (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <span>{language === 'vi' ? 'Yêu cầu đã gửi thành công! Vui lòng liên hệ Admin để nhận mật khẩu.' : 'Request sent! Contact admin to get your new password.'}</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="forgot_email" className="text-xs">{t.emailLabel} *</Label>
                  <Input
                    id="forgot_email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="text-xs border-border"
                    required
                  />
                </div>
              )}
            </div>

            {!forgotSuccess && (
              <DialogFooter className="border-t border-border pt-4">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8.5" onClick={() => setShowForgotDialog(false)} disabled={forgotSubmitting}>
                  {t.cancelBtn}
                </Button>
                <Button type="submit" size="sm" disabled={forgotSubmitting} className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8.5 px-4 shadow-sm">
                  {forgotSubmitting ? (language === 'vi' ? 'Đang gửi...' : 'Sending...') : (language === 'vi' ? 'Gửi yêu cầu' : 'Send Request')}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
