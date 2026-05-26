import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUpload, 
  faFileLines, 
  faXmark, 
  faSpinner 
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth.store'
import { useLanguageStore } from '../../stores/language.store'
import { translations } from '../../lib/translations'
import { getCertificatePath, getSignedUrl } from '../../lib/storageHelpers'

interface CertificateUploadProps {
  value?: string
  onChange: (url: string, name: string) => void
  fileName?: string
}

export const CertificateUpload: React.FC<CertificateUploadProps> = ({
  value,
  onChange,
  fileName,
}) => {
  const { user } = useAuthStore()
  const { language } = useLanguageStore()
  const t = translations[language]
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleViewCertificate = async () => {
    if (!value) return
    const path = getCertificatePath(value)
    if (!path) return
    try {
      const signedUrl = await getSignedUrl(path)
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noreferrer')
      }
    } catch (err) {
      console.error('Failed to view certificate:', err)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t.fileSizeError)
      return
    }

    // Validate type (images + pdf)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg(t.fileTypeError)
      return
    }

    setIsUploading(true)
    setErrorMsg(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileNameStr = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(fileNameStr, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        throw error
      }

      onChange(data.path, file.name)
    } catch (err: unknown) {
      console.error('Upload error:', err)
      const message = err instanceof Error ? err.message : t.uploadError
      setErrorMsg(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    onChange('', '')
    setErrorMsg(null)
  }

  return (
    <div className="space-y-1.5 text-foreground">
      <label className="block text-xs font-semibold text-muted-foreground">
        {t.uploadLabel}
      </label>

      {errorMsg && (
        <p className="text-[10px] font-semibold text-destructive">{errorMsg}</p>
      )}

      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/10 p-2.5 dark:border-emerald-950/30">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FontAwesomeIcon icon={faFileLines} className="text-sm" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-foreground">
                {fileName || (language === 'vi' ? 'Chung_chi_CME.pdf' : 'CME_Certificate.pdf')}
              </p>
              <button
                type="button"
                onClick={handleViewCertificate}
                className="text-[10px] text-primary hover:underline font-bold text-left"
              >
                {t.viewUploaded}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        </div>
      ) : (
        <div className="relative flex justify-center rounded-lg border-2 border-dashed border-border px-6 py-6 bg-secondary/15">
          <div className="text-center">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin text-lg" />
                <p className="mt-2 text-xs text-muted-foreground">{t.uploadingText}</p>
              </div>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="mx-auto text-muted-foreground/60 text-lg" />
                <div className="mt-3 flex text-xs text-muted-foreground justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded font-bold text-primary hover:underline"
                  >
                    <span>{t.uploadBtn}</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">{t.uploadOrDrag}</p>
                </div>
                <p className="text-[10px] text-muted-foreground/75 mt-1">{t.uploadTypes}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
