import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/auth.store'
import { useThemeStore } from './stores/theme.store'
import { useLanguageStore } from './stores/language.store'
import { router } from './router'
import { ErrorBoundary } from './components/layout/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize)
  const initTheme = useThemeStore((state) => state.initTheme)
  const initLanguage = useLanguageStore((state) => state.initLanguage)

  useEffect(() => {
    initializeAuth()
    initTheme()
    initLanguage()
  }, [initializeAuth, initTheme, initLanguage])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" duration={3500} closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
