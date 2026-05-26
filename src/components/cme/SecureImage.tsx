import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { getCertificatePath, getSignedUrl } from '../../lib/storageHelpers'

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcPath: string
}

export const SecureImage: React.FC<SecureImageProps> = ({ srcPath, ...props }) => {
  const [signedUrl, setSignedUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const resolveUrl = async () => {
      setLoading(true)
      setError(false)
      const path = getCertificatePath(srcPath)
      if (!path) {
        setSignedUrl('')
        setLoading(false)
        return
      }

      try {
        const url = await getSignedUrl(path)
        if (active) {
          if (url) {
            setSignedUrl(url)
          } else {
            setError(true)
          }
        }
      } catch (err) {
        console.error('Failed to resolve signed URL:', err)
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    resolveUrl()
    return () => {
      active = false
    }
  }, [srcPath])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary/20 rounded">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-muted-foreground/60 text-sm" />
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-secondary/15 text-muted-foreground/70 p-3 text-center rounded">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500/80 mb-1" />
        <span className="text-[9px] font-semibold">Failed to load image</span>
      </div>
    )
  }

  return <img src={signedUrl} {...props} alt={props.alt || 'CME Proof'} />
}
