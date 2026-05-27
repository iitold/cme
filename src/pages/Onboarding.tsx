import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBriefcaseMedical, 
  faHospital, 
  faFileLines, 
  faLocationDot,
  faUser,
  faPhone,
  faCompass,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons'
import { useAuthStore } from '../stores/auth.store'
import { useThemeStore } from '../stores/theme.store'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { supabase } from '../lib/supabase'
import { profileSchema, type ProfileSchemaInput } from '../schemas/profile.schema'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { toast } from 'sonner'

export const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const { user, fetchDoctorProfile } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const t = translations[language]

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileSchemaInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      cme_target_credits: 120,
      cme_min_per_year: 12,
    }
  })

  const onSubmit = async (data: ProfileSchemaInput) => {
    if (!user) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase
        .from('doctors')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: data.full_name,
          date_of_birth: data.date_of_birth || null,
          phone: data.phone || null,
          cchn_number: data.cchn_number,
          cchn_issued_date: data.cchn_issued_date,
          cchn_cycle_start: data.cchn_issued_date,
          specialty: data.specialty,
          workplace: data.workplace,
          province: data.province,
          cme_target_credits: data.cme_target_credits,
          cme_min_per_year: data.cme_min_per_year,
        })

      if (error) {
        setErrorMsg(error.message === 'duplicate key value violates unique constraint "doctors_cchn_number_key"' 
          ? t.duplicateCchn 
          : error.message)
        setIsSubmitting(false)
        return
      }

      toast.success(t.onboardingSuccess)
      await fetchDoctorProfile(user.id)
      navigate('/')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.systemError
      setErrorMsg(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#070c15] py-8 px-4 transition-colors duration-200">
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

      <Card className="w-full max-w-lg border-border bg-white dark:bg-card shadow-sm text-foreground">
        <CardHeader className="text-center pb-5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FontAwesomeIcon icon={faBriefcaseMedical} style={{ fontSize: '20px' }} />
          </div>
          <CardTitle className="mt-3 text-lg font-bold">{t.onboardingTitle}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t.onboardingSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          {errorMsg && (
            <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Basic Info Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.personalGroup}</h3>
              
              <div className="space-y-1">
                <Label htmlFor="full_name" className="text-xs">{t.fullNameLabel} *</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input id="full_name" className="pl-9 text-xs" placeholder={t.fullNamePlaceholder} {...register('full_name')} />
                </div>
                {errors.full_name && <p className="text-[10px] text-destructive mt-0.5">{errors.full_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="date_of_birth" className="text-xs">{t.dobLabel}</Label>
                  <Input id="date_of_birth" className="text-xs" type="date" {...register('date_of_birth')} />
                  {errors.date_of_birth && <p className="text-[10px] text-destructive mt-0.5">{errors.date_of_birth.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">{t.phoneLabel}</Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                    <Input id="phone" className="pl-9 text-xs" placeholder="0912345678" {...register('phone')} />
                  </div>
                  {errors.phone && <p className="text-[10px] text-destructive mt-0.5">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="specialty" className="text-xs">{t.specialty} *</Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faCompass} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                    <Input id="specialty" className="pl-9 text-xs" placeholder={t.specialtyPlaceholder} {...register('specialty')} />
                  </div>
                  {errors.specialty && <p className="text-[10px] text-destructive mt-0.5">{errors.specialty.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="province" className="text-xs">{t.province} *</Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLocationDot} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                    <Input id="province" className="pl-9 text-xs" placeholder={t.provincePlaceholder} {...register('province')} />
                  </div>
                  {errors.province && <p className="text-[10px] text-destructive mt-0.5">{errors.province.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="workplace" className="text-xs">{language === 'vi' ? 'Nơi công tác hiện tại *' : 'Current Workplace *'}</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faHospital} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input id="workplace" className="pl-9 text-xs" placeholder={t.workplacePlaceholder} {...register('workplace')} />
                </div>
                {errors.workplace && <p className="text-[10px] text-destructive mt-0.5">{errors.workplace.message}</p>}
              </div>
            </div>

            {/* CCHN / CME Info Group */}
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.cchnGroup}</h3>
              
              <div className="space-y-1">
                <Label htmlFor="cchn_number" className="text-xs">{t.cchnNumber} *</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faFileLines} className="absolute left-3 top-[32%] text-muted-foreground/75 text-xs" />
                  <Input id="cchn_number" className="pl-9 text-xs" placeholder={t.cchnNumberPlaceholder} {...register('cchn_number')} />
                </div>
                {errors.cchn_number && <p className="text-[10px] text-destructive mt-0.5">{errors.cchn_number.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cchn_issued_date" className="text-xs">{t.cchnIssuedDate} *</Label>
                  <Input id="cchn_issued_date" className="text-xs" type="date" {...register('cchn_issued_date')} />
                  {errors.cchn_issued_date && <p className="text-[10px] text-destructive mt-0.5">{errors.cchn_issued_date.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cme_target_credits" className="text-xs">{t.targetCreditsLabel}</Label>
                  <Input id="cme_target_credits" className="text-xs" type="number" {...register('cme_target_credits')} />
                  {errors.cme_target_credits && <p className="text-[10px] text-destructive mt-0.5">{errors.cme_target_credits.message}</p>}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full text-xs h-9 bg-primary text-white hover:bg-primary/90 font-semibold mt-4 shadow-sm animate-fadeIn"
            >
              {isSubmitting ? t.onboardingFinishing : t.onboardingFinish}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
