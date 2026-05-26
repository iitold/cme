import { supabase } from './supabase'

/**
 * Extracts the relative storage path (e.g. "user_id/filename.ext") 
 * from either a full Supabase storage URL or a relative path.
 */
export const getCertificatePath = (urlOrPath: string | null | undefined): string => {
  if (!urlOrPath) return ''
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const parts = urlOrPath.split('/certificates/')
    if (parts.length > 1) {
      // Return everything after the bucket name
      return decodeURIComponent(parts[1])
    }
  }
  return urlOrPath
}

/**
 * Generates a temporary signed URL for a given certificate storage path.
 * The link is valid for 15 minutes.
 */
export const getSignedUrl = async (path: string): Promise<string> => {
  if (!path) return ''
  try {
    const { data, error } = await supabase.storage
      .from('certificates')
      .createSignedUrl(path, 60 * 15) // 15 minutes expiration
    
    if (error) {
      console.error('Error generating signed URL:', error.message)
      return ''
    }
    return data.signedUrl
  } catch (err) {
    console.error('Exception generating signed URL:', err)
    return ''
  }
}
