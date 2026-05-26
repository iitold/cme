import { z } from 'zod'

export const courseSchema = z.object({
  course_name: z.string().min(2, 'Tên khóa học/hội thảo là bắt buộc'),
  provider_name: z.string().min(2, 'Đơn vị đào tạo/tổ chức là bắt buộc'),
  provider_type: z.enum(['university', 'hospital', 'association', 'online', 'other'], {
    message: 'Vui lòng chọn loại đơn vị đào tạo',
  }),
  credits: z.coerce.number().min(1, 'Số tín chỉ (credits) phải lớn hơn 0'),
  course_type: z.enum(['theory', 'clinical', 'online', 'conference'], {
    message: 'Vui lòng chọn hình thức đào tạo',
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (yyyy-MM-dd)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ (yyyy-MM-dd)'),
  certificate_url: z.string()
    .refine((val) => {
      if (!val) return true
      const isUrl = val.startsWith('http://') || val.startsWith('https://')
      if (isUrl) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        if (!val.startsWith(supabaseUrl)) return false
        const pathPart = val.split('/certificates/')[1]
        return pathPart ? /^[0-9a-f-]{36}\/[0-9]+\.(pdf|jpg|jpeg|png|webp)$/i.test(pathPart) : false
      }
      return /^[0-9a-f-]{36}\/[0-9]+\.(pdf|jpg|jpeg|png|webp)$/i.test(val)
    }, 'Đường dẫn chứng chỉ không hợp lệ')
    .optional()
    .or(z.literal('')),
  certificate_name: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date)
  }
  return true
}, {
  message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
  path: ['end_date'],
})

export type CourseSchemaInput = z.infer<typeof courseSchema>
