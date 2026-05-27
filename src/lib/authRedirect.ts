const DEFAULT_PRODUCTION_URL = 'https://doctorcmes.web.app'

export function getAuthRedirectUrl() {
  const configuredUrl = import.meta.env.VITE_APP_URL?.trim()
  const baseUrl = configuredUrl || DEFAULT_PRODUCTION_URL

  return baseUrl.replace(/\/$/, '')
}
