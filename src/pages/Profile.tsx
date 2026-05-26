import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUser, 
  faHospital, 
  faLocationDot, 
  faFileLines,
  faStethoscope,
  faPhone,
  faSpinner,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { useProfile } from '../hooks/useProfile'
import { profileSchema, type ProfileSchemaInput } from '../schemas/profile.schema'
import { toInputDateFormat, addYears, formatVietnamDate } from '../lib/date'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { toast } from 'sonner'

import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'

export const Profile: React.FC = () => {
  const { profile, isLoading, error, updateProfile, isUpdating } = useProfile()
  const { language } = useLanguageStore()
  const t = translations[language]

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProfileSchemaInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    values: profile ? {
      full_name: profile.full_name,
      date_of_birth: profile.date_of_birth ? toInputDateFormat(profile.date_of_birth) : '',
      phone: profile.phone || '',
      specialty: profile.specialty || '',
      workplace: profile.workplace || '',
      province: profile.province || '',
      cchn_number: profile.cchn_number || '',
      cchn_issued_date: profile.cchn_issued_date ? toInputDateFormat(profile.cchn_issued_date) : '',
      cchn_cycle_start: profile.cchn_cycle_start ? toInputDateFormat(profile.cchn_cycle_start) : '',
      cme_target_credits: profile.cme_target_credits,
      cme_min_per_year: profile.cme_min_per_year,
    } : undefined
  })

  const cycleStart = watch('cchn_cycle_start')
  const getCycleEndDisplay = () => {
    if (!cycleStart) return language === 'vi' ? 'Tự động tính' : 'Auto computed'
    const end = addYears(cycleStart, 5)
    return end ? formatVietnamDate(end) : (language === 'vi' ? 'Ngày không hợp lệ' : 'Invalid date')
  }

  const onSubmit = async (data: ProfileSchemaInput) => {
    try {
      await updateProfile(data)
      toast.success(t.updateProfileSuccess)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.systemError
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin text-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
        <FontAwesomeIcon icon={faCircleExclamation} className="text-destructive text-3xl mb-2" />
        <p className="text-sm font-semibold text-foreground">{t.loadFailed || 'Tải dữ liệu thất bại'}</p>
        <p className="text-xs text-muted-foreground max-w-xs">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
        <FontAwesomeIcon icon={faCircleExclamation} className="text-muted-foreground text-3xl mb-2" />
        <p className="text-sm font-semibold text-foreground">Không tìm thấy thông tin hồ sơ bác sĩ.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-10">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t.profileTitle}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.profileSubtitle}
        </p>
      </div>

      <Card className="border-border bg-white dark:bg-card shadow-sm text-foreground">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-primary" />
            <span>{t.personalInfoTitle}</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t.profileDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Personal Group */}
            <div className="space-y-3.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.personalGroup}</h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs">{t.fullNameLabel} *</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
                  <Input id="full_name" className="pl-9 text-xs" placeholder={t.fullNamePlaceholder} {...register('full_name')} />
                </div>
                {errors.full_name && <p className="text-[10px] text-destructive mt-0.5">{errors.full_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="date_of_birth" className="text-xs">{t.dobLabel}</Label>
                  <Input id="date_of_birth" className="text-xs" type="date" {...register('date_of_birth')} />
                  {errors.date_of_birth && <p className="text-[10px] text-destructive mt-0.5">{errors.date_of_birth.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">{t.phoneLabel}</Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
                    <Input id="phone" className="pl-9 text-xs" placeholder="0912345678" {...register('phone')} />
                  </div>
                  {errors.phone && <p className="text-[10px] text-destructive mt-0.5">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="specialty" className="text-xs">{t.specialty} *</Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faStethoscope} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
                    <Input id="specialty" className="pl-9 text-xs" placeholder={t.specialtyPlaceholder} {...register('specialty')} />
                  </div>
                  {errors.specialty && <p className="text-[10px] text-destructive mt-0.5">{errors.specialty.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="province" className="text-xs">{t.province} *</Label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faLocationDot} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
                    <Input id="province" className="pl-9 text-xs" placeholder={t.provincePlaceholder} {...register('province')} />
                  </div>
                  {errors.province && <p className="text-[10px] text-destructive mt-0.5">{errors.province.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="workplace" className="text-xs">{t.workplace} *</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faHospital} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
                  <Input id="workplace" className="pl-9 text-xs" placeholder={t.workplacePlaceholder} {...register('workplace')} />
                </div>
                {errors.workplace && <p className="text-[10px] text-destructive mt-0.5">{errors.workplace.message}</p>}
              </div>
            </div>

            {/* CCHN Group */}
            <div className="space-y-3.5 border-t border-border pt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.cchnGroup}</h3>
              
              <div className="space-y-1.5">
                <Label htmlFor="cchn_number" className="text-xs">{t.cchnNumber} *</Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faFileLines} className="absolute left-3 top-[32%] text-muted-foreground/75 text-[11px]" />
                  <Input id="cchn_number" className="pl-9 text-xs" placeholder={t.cchnNumberPlaceholder} {...register('cchn_number')} />
                </div>
                {errors.cchn_number && <p className="text-[10px] text-destructive mt-0.5">{errors.cchn_number.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="cchn_issued_date" className="text-xs">{t.cchnIssuedDate} *</Label>
                  <Input id="cchn_issued_date" className="text-xs" type="date" {...register('cchn_issued_date')} />
                  {errors.cchn_issued_date && <p className="text-[10px] text-destructive mt-0.5">{errors.cchn_issued_date.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cchn_cycle_start" className="text-xs">{t.cchnCycleStart} *</Label>
                  <Input id="cchn_cycle_start" className="text-xs" type="date" {...register('cchn_cycle_start')} />
                  {errors.cchn_cycle_start && <p className="text-[10px] text-destructive mt-0.5">{errors.cchn_cycle_start.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.cchnCycleEnd}</Label>
                  <div className="flex h-9 w-full rounded bg-secondary/60 px-3 py-2 text-xs font-semibold text-primary items-center border border-border/40 select-none">
                    {getCycleEndDisplay()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cme_target_credits" className="text-xs">{t.targetCreditsLabel} *</Label>
                  <Input id="cme_target_credits" className="text-xs" type="number" {...register('cme_target_credits')} />
                  {errors.cme_target_credits && <p className="text-[10px] text-destructive mt-0.5">{errors.cme_target_credits.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cme_min_per_year" className="text-xs">{t.minCreditsYearLabel} *</Label>
                  <Input id="cme_min_per_year" className="text-xs" type="number" {...register('cme_min_per_year')} />
                  {errors.cme_min_per_year && <p className="text-[10px] text-destructive mt-0.5">{errors.cme_min_per_year.message}</p>}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isUpdating} 
              className="w-full text-xs h-9 bg-primary text-white hover:bg-primary/90 font-semibold mt-4 shadow-sm"
            >
              {isUpdating ? t.updatingProfile : t.updateProfileBtn}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
