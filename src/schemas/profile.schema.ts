import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không hợp lệ (yyyy-MM-dd)').optional().or(z.literal('')),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại Việt Nam không hợp lệ').optional().or(z.literal('')),
  specialty: z.string().min(2, 'Chuyên khoa là bắt buộc'),
  workplace: z.string().min(2, 'Nơi công tác là bắt buộc'),
  province: z.string().min(2, 'Tỉnh/Thành phố là bắt buộc'),
  cchn_number: z.string().min(2, 'Số CCHN/Mã định danh là bắt buộc'),
  cchn_issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày cấp CCHN không hợp lệ (yyyy-MM-dd)'),
  cchn_cycle_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu chu kỳ không hợp lệ (yyyy-MM-dd)'),
  cme_target_credits: z.coerce.number().min(1, 'Mục tiêu tín chỉ phải lớn hơn 0').default(120),
  cme_min_per_year: z.coerce.number().min(0).default(12),
})

export type ProfileSchemaInput = z.infer<typeof profileSchema>
