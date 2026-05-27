
/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Courses } from './pages/Courses'
import { Certificates } from './pages/Certificates'
import { Profile } from './pages/Profile'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

// Lazy load AdminConsole to keep initial bundle size small
const AdminConsole = lazy(() =>
  import('./pages/AdminConsole').then((module) => ({ default: module.AdminConsole }))
)

const LoadingFallback = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin text-2xl" />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <Onboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/courses',
        element: <Courses />,
      },
      {
        path: '/certificates',
        element: <Certificates />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/admin',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AdminConsole />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
