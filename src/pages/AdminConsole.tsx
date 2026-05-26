import React, { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserShield, 
  faUsers, 
  faKey, 
  faUserPen, 
  faLock, 
  faUnlock, 
  faTrash, 
  faSearch, 
  faSpinner, 
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { useLanguageStore } from '../stores/language.store'
import { translations } from '../lib/translations'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { toast } from 'sonner'
import type { Doctor } from '../types'

interface ResetRequest {
  id: string
  email: string
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
}

export const AdminConsole: React.FC = () => {
  const { doctor } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]

  // Tab state
  const [activeTab, setActiveTab] = useState<'doctors' | 'requests'>('doctors')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [requests, setRequests] = useState<ResetRequest[]>([])
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Modal states
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<Doctor | ResetRequest | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    try {
      // Fetch all doctors
      const { data: doctorsData, error: docError } = await supabase
        .from('doctors')
        .select('*')
        .order('full_name', { ascending: true })

      if (docError) throw docError
      setDoctors(doctorsData || [])

      // Fetch all password reset requests
      const { data: requestsData, error: reqError } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (reqError) throw reqError
      setRequests(requestsData || [])

      // Fetch banned users
      const { data: bannedData, error: banError } = await supabase
        .rpc('admin_get_banned_users')

      if (!banError && bannedData) {
        setBannedUserIds(new Set(bannedData))
      }
    } catch (e: unknown) {
      console.error('Error loading admin console data:', e)
      toast.error(language === 'vi' ? 'Không thể tải dữ liệu quản trị' : 'Failed to load administration data')
    } finally {
      setLoading(false)
    }
  }, [language])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // Admin Actions
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoctor) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          full_name: editingDoctor.full_name,
          phone: editingDoctor.phone || null,
          specialty: editingDoctor.specialty || null,
          workplace: editingDoctor.workplace || null,
          province: editingDoctor.province || null,
          cchn_number: editingDoctor.cchn_number || null,
          cme_target_credits: Number(editingDoctor.cme_target_credits),
          role: editingDoctor.role,
        })
        .eq('id', editingDoctor.id)

      if (error) throw error

      toast.success(language === 'vi' ? 'Cập nhật hồ sơ bác sĩ thành công!' : 'Doctor profile updated successfully!')
      setEditingDoctor(null)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPasswordUser || !newPassword) return
    setIsSubmitting(true)
    try {
      // Find the user_id (if ResetRequest, we need to find the user_id from doctors by email)
      let targetUserId = ''
      if ('user_id' in resetPasswordUser) {
        targetUserId = resetPasswordUser.user_id
      } else {
        const foundDoc = doctors.find(d => d.email === resetPasswordUser.email)
        if (!foundDoc) {
          throw new Error(language === 'vi' ? 'Không tìm thấy hồ sơ bác sĩ ứng với email này' : 'No doctor profile found for this email')
        }
        targetUserId = foundDoc.user_id
      }

      const { error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: targetUserId,
        new_password: newPassword
      })

      if (error) throw error

      // If it was a reset request, update status to completed
      if (!('user_id' in resetPasswordUser)) {
        await supabase
          .from('password_reset_requests')
          .update({ status: 'completed' })
          .eq('id', resetPasswordUser.id)
      }

      toast.success(language === 'vi' ? 'Đổi mật khẩu thành công!' : 'Password reset successfully!')
      setResetPasswordUser(null)
      setNewPassword('')
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLock = async (doctor: Doctor) => {
    const isCurrentlyLocked = bannedUserIds.has(doctor.user_id)
    const actionText = isCurrentlyLocked 
      ? (language === 'vi' ? 'Mở khóa' : 'Unlock') 
      : (language === 'vi' ? 'Khóa' : 'Lock')
      
    try {
      const { error } = await supabase.rpc('admin_toggle_lock_user', {
        target_user_id: doctor.user_id,
        is_locked: !isCurrentlyLocked
      })

      if (error) throw error

      toast.success(`${actionText} tài khoản thành công!`)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const handleDeleteUser = async (doctor: Doctor) => {
    const confirmDelete = window.confirm(
      language === 'vi' 
        ? `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN bác sĩ ${doctor.full_name}? Hành động này không thể hoàn tác.`
        : `WARNING: Are you sure you want to PERMANENTLY DELETE doctor ${doctor.full_name}? This cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: doctor.user_id
      })

      if (error) throw error

      toast.success(language === 'vi' ? 'Xóa tài khoản bác sĩ thành công!' : 'Doctor account deleted successfully!')
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: 'completed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      toast.success(language === 'vi' ? 'Cập nhật yêu cầu thành công!' : 'Request updated successfully!')
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message)
    }
  }

  const filteredDoctors = doctors.filter(doc => {
    const q = searchQuery.toLowerCase()
    return (
      doc.full_name?.toLowerCase().includes(q) ||
      doc.email?.toLowerCase().includes(q) ||
      doc.cchn_number?.toLowerCase().includes(q) ||
      doc.specialty?.toLowerCase().includes(q) ||
      doc.workplace?.toLowerCase().includes(q)
    )
  })

  // Check role: Only allow admins (called after hook declarations)
  if (!doctor || doctor.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 text-foreground animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FontAwesomeIcon icon={faUserShield} className="text-primary text-lg" />
            {language === 'vi' ? 'Quản trị Hệ thống' : 'Admin Console'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'vi' 
              ? 'Quản lý tài khoản bác sĩ, phân quyền và duyệt các yêu cầu bảo mật.' 
              : 'Manage doctor accounts, permissions, and approve security requests.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border select-none">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'doctors'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faUsers} className="text-xs" />
          {language === 'vi' ? 'Danh sách Bác sĩ' : 'Doctors List'}
          <span className="ml-1 px-1.5 py-0.2 bg-secondary text-[10px] text-muted-foreground rounded-full">
            {doctors.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FontAwesomeIcon icon={faKey} className="text-xs" />
          {language === 'vi' ? 'Yêu cầu Đổi mật khẩu' : 'Password Reset Requests'}
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-[10px] text-white rounded-full animate-pulse">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin text-2xl" />
        </div>
      ) : (
        <>
          {activeTab === 'doctors' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-[32%] text-muted-foreground text-xs" />
                <Input
                  placeholder={language === 'vi' ? 'Tìm bác sĩ theo tên, email, CCHN...' : 'Search by name, email, license...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs border-border placeholder:text-muted-foreground/60 bg-card"
                />
              </div>

              {/* Table */}
              <Card className="border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20 text-muted-foreground font-semibold">
                        <th className="p-3.5">{language === 'vi' ? 'Họ và Tên' : 'Full Name'}</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">{language === 'vi' ? 'Số CCHN' : 'License ID'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Chuyên khoa / Nơi làm việc' : 'Specialty / Workplace'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                        <th className="p-3.5 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            {language === 'vi' ? 'Không tìm thấy bác sĩ nào.' : 'No doctors found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc) => {
                          const isLocked = bannedUserIds.has(doc.user_id)
                          return (
                            <tr key={doc.id} className="hover:bg-secondary/15 transition-colors">
                              <td className="p-3.5 font-bold text-foreground">BS. {doc.full_name}</td>
                              <td className="p-3.5 text-muted-foreground">{doc.email || '—'}</td>
                              <td className="p-3.5 text-muted-foreground font-mono">{doc.cchn_number || '—'}</td>
                              <td className="p-3.5 text-muted-foreground">
                                <div>{doc.specialty || '—'}</div>
                                <div className="text-[10px] text-muted-foreground/75 mt-0.5">{doc.workplace || '—'}</div>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  doc.role === 'admin' 
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                }`}>
                                  {doc.role === 'admin' ? 'Admin' : (language === 'vi' ? 'Bác sĩ' : 'Doctor')}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  isLocked 
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isLocked ? (language === 'vi' ? 'Đã khóa' : 'Locked') : (language === 'vi' ? 'Hoạt động' : 'Active')}
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1">
                                <button
                                  onClick={() => setEditingDoctor(doc)}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                                  title={language === 'vi' ? 'Sửa thông tin' : 'Edit profile'}
                                >
                                  <FontAwesomeIcon icon={faUserPen} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => setResetPasswordUser(doc)}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                                  title={language === 'vi' ? 'Đặt lại mật khẩu' : 'Reset password'}
                                >
                                  <FontAwesomeIcon icon={faKey} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleToggleLock(doc)}
                                  className={`p-1.5 rounded transition-colors ${
                                    isLocked 
                                      ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10' 
                                      : 'text-rose-600 hover:text-rose-700 hover:bg-rose-500/10'
                                  }`}
                                  title={isLocked ? (language === 'vi' ? 'Mở khóa' : 'Unlock') : (language === 'vi' ? 'Khóa tài khoản' : 'Lock Account')}
                                >
                                  <FontAwesomeIcon icon={isLocked ? faUnlock : faLock} className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(doc)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded transition-colors"
                                  title={language === 'vi' ? 'Xóa tài khoản' : 'Delete Account'}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4 animate-fadeIn">
              <Card className="border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/20 text-muted-foreground font-semibold">
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">{language === 'vi' ? 'Ngày Yêu cầu' : 'Requested At'}</th>
                        <th className="p-3.5">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                        <th className="p-3.5 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            {language === 'vi' ? 'Không có yêu cầu khôi phục nào.' : 'No reset requests found.'}
                          </td>
                        </tr>
                      ) : (
                        requests.map((req) => (
                          <tr key={req.id} className="hover:bg-secondary/15 transition-colors">
                            <td className="p-3.5 font-bold text-foreground">{req.email}</td>
                            <td className="p-3.5 text-muted-foreground">
                              {new Date(req.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                req.status === 'pending'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : req.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                              }`}>
                                {req.status === 'pending' 
                                  ? (language === 'vi' ? 'Đang chờ' : 'Pending') 
                                  : req.status === 'completed' 
                                  ? (language === 'vi' ? 'Đã xử lý' : 'Completed') 
                                  : (language === 'vi' ? 'Từ chối' : 'Rejected')}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              {req.status === 'pending' && (
                                <>
                                  <Button
                                    onClick={() => setResetPasswordUser(req)}
                                    size="sm"
                                    className="h-7 text-[10px] font-semibold bg-primary text-white hover:bg-primary/95 shadow-sm"
                                  >
                                    <FontAwesomeIcon icon={faKey} className="mr-1.5" />
                                    {language === 'vi' ? 'Duyệt & Đổi Pass' : 'Approve & Reset'}
                                  </Button>
                                  <button
                                    onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                    className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-secondary rounded transition-colors"
                                    title={language === 'vi' ? 'Từ chối' : 'Reject'}
                                  >
                                    <FontAwesomeIcon icon={faXmark} className="text-xs" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={async () => {
                                  if (window.confirm(language === 'vi' ? 'Xóa yêu cầu này?' : 'Delete this request?')) {
                                    await supabase.from('password_reset_requests').delete().eq('id', req.id)
                                    toast.success(language === 'vi' ? 'Đã xóa yêu cầu.' : 'Request deleted.')
                                    loadData()
                                  }
                                }}
                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-secondary rounded transition-colors"
                                title={language === 'vi' ? 'Xóa' : 'Delete'}
                              >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Edit Doctor Dialog */}
      <Dialog open={editingDoctor !== null} onOpenChange={(open) => !open && setEditingDoctor(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-card border-border text-foreground">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {language === 'vi' ? 'Sửa thông tin Bác sĩ' : 'Edit Doctor Profile'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {language === 'vi' ? 'Cập nhật các thông tin thực hành và CCHN của bác sĩ.' : "Update doctor's practice and license details."}
              </DialogDescription>
            </DialogHeader>

            {editingDoctor && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_name" className="text-xs">{t.fullNameLabel} *</Label>
                  <Input
                    id="edit_name"
                    value={editingDoctor.full_name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, full_name: e.target.value })}
                    className="text-xs border-border"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_phone" className="text-xs">{t.phoneLabel}</Label>
                    <Input
                      id="edit_phone"
                      value={editingDoctor.phone || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                      className="text-xs border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_cchn" className="text-xs">{t.cchnNumber} *</Label>
                    <Input
                      id="edit_cchn"
                      value={editingDoctor.cchn_number || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, cchn_number: e.target.value })}
                      className="text-xs border-border"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_specialty" className="text-xs">{t.specialty} *</Label>
                    <Input
                      id="edit_specialty"
                      value={editingDoctor.specialty || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                      className="text-xs border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_province" className="text-xs">{t.province} *</Label>
                    <Input
                      id="edit_province"
                      value={editingDoctor.province || ''}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, province: e.target.value })}
                      className="text-xs border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_workplace" className="text-xs">{language === 'vi' ? 'Nơi công tác' : 'Workplace'}</Label>
                  <Input
                    id="edit_workplace"
                    value={editingDoctor.workplace || ''}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, workplace: e.target.value })}
                    className="text-xs border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_target" className="text-xs">{t.targetCreditsLabel}</Label>
                    <Input
                      id="edit_target"
                      type="number"
                      value={editingDoctor.cme_target_credits}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, cme_target_credits: Number(e.target.value) })}
                      className="text-xs border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_role" className="text-xs">{language === 'vi' ? 'Vai trò' : 'Role'} *</Label>
                    <Select
                      defaultValue={editingDoctor.role}
                      onValueChange={(val: 'doctor' | 'admin') => setEditingDoctor({ ...editingDoctor, role: val })}
                    >
                      <SelectTrigger id="edit_role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">{language === 'vi' ? 'Bác sĩ' : 'Doctor'}</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" className="text-xs h-8.5" onClick={() => setEditingDoctor(null)} disabled={isSubmitting}>
                {t.cancelBtn}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8.5 px-4 shadow-sm">
                {isSubmitting ? t.savingBtn : t.saveBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordUser !== null} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-card border-border text-foreground">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {language === 'vi' ? 'Đặt lại mật khẩu mới' : 'Reset User Password'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {language === 'vi' 
                  ? `Nhập mật khẩu mới cho tài khoản: ${resetPasswordUser?.email}`
                  : `Enter the new password for account: ${resetPasswordUser?.email}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset_pass" className="text-xs">{language === 'vi' ? 'Mật khẩu mới *' : 'New Password *'}</Label>
                <Input
                  id="reset_pass"
                  type="text"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" className="text-xs h-8.5" onClick={() => setResetPasswordUser(null)} disabled={isSubmitting}>
                {t.cancelBtn}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-8.5 px-4 shadow-sm">
                {isSubmitting ? (language === 'vi' ? 'Đang thực hiện...' : 'Resetting...') : (language === 'vi' ? 'Đổi Mật Khẩu' : 'Reset Password')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
