import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBriefcaseMedical,
  faCircleCheck,
  faCircleExclamation,
  faLock,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { toast } from 'sonner'

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const { language } = useLanguageStore()
  const t = translations[language]
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setHasRecoverySession(!!data.session)
      setIsCheckingSession(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(!!session)
        setIsCheckingSession(false)
      }
    })

    checkSession()
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMsg(null)

    if (password.length < 12) {
      setErrorMsg(language === 'vi' ? 'Mật khẩu mới phải có ít nhất 12 ký tự.' : 'New password must be at least 12 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg(t.passwordsMustMatch)
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast.success(language === 'vi' ? 'Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.' : 'Password updated. Please log in again.')
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.systemError
      setErrorMsg(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 px-4 transition-colors duration-200 dark:bg-[#070c15]">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <FontAwesomeIcon icon={faBriefcaseMedical} style={{ fontSize: '18px' }} />
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">{t.appName}</h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {language === 'vi' ? 'Thiết lập mật khẩu mới cho tài khoản của bạn' : 'Set a new password for your account'}
          </p>
        </div>

        <Card className="border-border bg-white text-foreground shadow-sm dark:bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-base font-bold">
              {language === 'vi' ? 'Đặt lại mật khẩu' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center text-[11px] text-muted-foreground">
              {language === 'vi' ? 'Nhập mật khẩu mới để hoàn tất khôi phục tài khoản.' : 'Enter a new password to complete account recovery.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCheckingSession ? (
              <div className="flex h-32 items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-primary text-xl" />
              </div>
            ) : !hasRecoverySession ? (
              <div className="space-y-4 text-center">
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <FontAwesomeIcon icon={faCircleExclamation} className="mr-2" />
                  {language === 'vi' ? 'Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.' : 'This password reset link is expired or invalid.'}
                </div>
                <Link to="/login">
                  <Button variant="outline" className="h-9 text-xs">
                    {language === 'vi' ? 'Quay lại đăng nhập' : 'Back to login'}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <FontAwesomeIcon icon={faCircleExclamation} className="shrink-0 text-xs" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="new_password" className="text-xs font-semibold text-muted-foreground">
                    {language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
                  </Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLock} className="absolute left-3 top-[32%] text-xs text-muted-foreground/75" />
                    <Input
                      id="new_password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-9 text-xs"
                      minLength={12}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm_password" className="text-xs font-semibold text-muted-foreground">
                    {t.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLock} className="absolute left-3 top-[32%] text-xs text-muted-foreground/75" />
                    <Input
                      id="confirm_password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="pl-9 text-xs"
                      minLength={12}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="h-9 w-full bg-primary text-xs font-semibold text-white hover:bg-primary/90">
                  {isSubmitting ? (language === 'vi' ? 'Đang cập nhật...' : 'Updating...') : (language === 'vi' ? 'Cập nhật mật khẩu' : 'Update Password')}
                </Button>
              </form>
            )}
          </CardContent>
          {hasRecoverySession && (
            <CardFooter className="border-t border-border/60 py-3">
              <p className="flex w-full items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" />
                {language === 'vi' ? 'Liên kết hợp lệ, bạn có thể đặt mật khẩu mới.' : 'Valid link, you can now set a new password.'}
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
