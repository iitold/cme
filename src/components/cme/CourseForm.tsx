import React from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Course } from '../../types'
import { courseSchema, type CourseSchemaInput } from '../../schemas/course.schema'
import { CertificateUpload } from './CertificateUpload'
import { toInputDateFormat } from '../../lib/date'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

import { useLanguageStore } from '../../stores/language.store'
import { translations } from '../../lib/translations'

interface CourseFormProps {
  initialData?: Course
  onSubmit: (data: CourseSchemaInput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export const CourseForm: React.FC<CourseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { language } = useLanguageStore()
  const t = translations[language]

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<CourseSchemaInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(courseSchema) as any,
    defaultValues: {
      course_name: initialData?.course_name || '',
      provider_name: initialData?.provider_name || '',
      provider_type: initialData?.provider_type || undefined,
      credits: initialData?.credits || 1,
      course_type: initialData?.course_type || undefined,
      start_date: initialData?.start_date ? toInputDateFormat(initialData.start_date) : '',
      end_date: initialData?.end_date ? toInputDateFormat(initialData.end_date) : '',
      certificate_url: initialData?.certificate_url || '',
      certificate_name: initialData?.certificate_name || '',
      notes: initialData?.notes || '',
    }
  })

  const certUrl = useWatch({ control, name: 'certificate_url' })
  const certName = useWatch({ control, name: 'certificate_name' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFormSubmit = handleSubmit(onSubmit as any)

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Tên khóa học */}
        <div className="space-y-2">
          <Label htmlFor="course_name">{t.courseNameLabel} *</Label>
          <Input 
            id="course_name" 
            placeholder={language === 'vi' ? "Ví dụ: Đào tạo Quản lý Điều dưỡng, Hội nghị Tim mạch toàn quốc..." : "Example: Nursing Management Training, Cardiology Conference..."} 
            {...register('course_name')} 
          />
          {errors.course_name && <p className="text-xs text-red-500">{errors.course_name.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Đơn vị tổ chức */}
          <div className="space-y-2">
            <Label htmlFor="provider_name">{t.providerNameLabel} *</Label>
            <Input 
              id="provider_name" 
              placeholder={language === 'vi' ? "Đại học Y Dược TP.HCM, Bệnh viện Bạch Mai..." : "University of Medicine and Pharmacy, Bach Mai Hospital..."} 
              {...register('provider_name')} 
            />
            {errors.provider_name && <p className="text-xs text-red-500">{errors.provider_name.message}</p>}
          </div>

          {/* Loại đơn vị */}
          <div className="space-y-2">
            <Label htmlFor="provider_type">{t.providerTypeLabel} *</Label>
            <Controller
              name="provider_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="provider_type">
                    <SelectValue placeholder={language === 'vi' ? "Chọn loại đơn vị" : "Select organizer type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">{language === 'vi' ? 'Trường đại học Y/Dược' : 'University of Medicine/Pharmacy'}</SelectItem>
                    <SelectItem value="hospital">{language === 'vi' ? 'Bệnh viện cấp tỉnh/trung ương' : 'Provincial/Central Hospital'}</SelectItem>
                    <SelectItem value="association">{language === 'vi' ? 'Hội nghề nghiệp y tế' : 'Medical Professional Association'}</SelectItem>
                    <SelectItem value="online">{language === 'vi' ? 'Nền tảng đào tạo online trực tuyến' : 'Online Education Platform'}</SelectItem>
                    <SelectItem value="other">{language === 'vi' ? 'Đơn vị khác' : 'Other Organizer'}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.provider_type && <p className="text-xs text-red-500">{errors.provider_type.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Số tín chỉ */}
          <div className="space-y-2">
            <Label htmlFor="credits">{t.creditsLabel} *</Label>
            <Input 
              id="credits" 
              type="number" 
              placeholder="1, 2, 4, 12..." 
              {...register('credits')} 
            />
            {errors.credits && <p className="text-xs text-red-500">{errors.credits.message}</p>}
          </div>

          {/* Hình thức đào tạo */}
          <div className="space-y-2">
            <Label htmlFor="course_type">{t.courseTypeLabel} *</Label>
            <Controller
              name="course_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="course_type">
                    <SelectValue placeholder={language === 'vi' ? "Chọn hình thức" : "Select format"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">{language === 'vi' ? 'Lý thuyết tập trung' : 'Concentrated Theory'}</SelectItem>
                    <SelectItem value="clinical">{language === 'vi' ? 'Lâm sàng thực hành' : 'Clinical Practice'}</SelectItem>
                    <SelectItem value="online">{language === 'vi' ? 'Trực tuyến (E-learning / Webinar)' : 'Online (E-learning / Webinar)'}</SelectItem>
                    <SelectItem value="conference">{language === 'vi' ? 'Hội thảo / Hội nghị khoa học' : 'Seminar / Conference'}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.course_type && <p className="text-xs text-red-500">{errors.course_type.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Ngày bắt đầu */}
          <div className="space-y-2">
            <Label htmlFor="start_date">{t.startDateLabel} *</Label>
            <Input id="start_date" type="date" {...register('start_date')} />
            {errors.start_date && <p className="text-xs text-red-500">{errors.start_date.message}</p>}
          </div>

          {/* Ngày kết thúc */}
          <div className="space-y-2">
            <Label htmlFor="end_date">{t.endDateLabel} *</Label>
            <Input id="end_date" type="date" {...register('end_date')} />
            {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
          </div>
        </div>

        {/* Certificate Upload Component */}
        <CertificateUpload
          value={certUrl}
          fileName={certName}
          onChange={(url, name) => {
            setValue('certificate_url', url)
            setValue('certificate_name', name)
          }}
        />

        {/* Ghi chú */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">{t.notesLabel}</Label>
          <textarea 
            id="notes" 
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus:ring-1 focus:ring-primary focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t.notesPlaceholder} 
            {...register('notes')} 
          />
        </div>
      </div>

      {/* Hành động */}
      <div className="flex justify-end gap-2.5 pt-4 border-t border-border/60">
        <Button type="button" variant="outline" size="sm" className="text-xs h-8.5 px-3" onClick={onCancel} disabled={isSubmitting}>
          {t.cancelBtn}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8.5 px-4 shadow-sm">
          {isSubmitting ? t.savingBtn : t.saveBtn}
        </Button>
      </div>
    </form>
  )
}
