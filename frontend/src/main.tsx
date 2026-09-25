import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import './index.css'
import { ApiError } from './lib/api'
import { BookingPage } from './pages/BookingPage'
import { MyAppointmentsPage } from './pages/MyAppointmentsPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { PlanningPage } from './pages/admin/PlanningPage'
import { ScheduleAdminPage } from './pages/admin/ScheduleAdminPage'
import { ServicesAdminPage } from './pages/admin/ServicesAdminPage'
import { HomePage } from './pages/HomePage'
import { LegalPage } from './pages/LegalPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Inutile de réessayer une erreur 4xx : la requête échouera à nouveau.
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
})

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/connexion', element: <LoginPage /> },
      { path: '/inscription', element: <RegisterPage /> },
      { path: '/reserver/:serviceId', element: <BookingPage /> },
      { path: '/mentions-legales', element: <LegalPage /> },
      {
        path: '/mes-rendez-vous',
        element: (
          <RequireAuth>
            <MyAppointmentsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/admin',
        element: (
          <RequireAuth role="ADMIN">
            <AdminLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="planning" replace /> },
          { path: 'planning', element: <PlanningPage /> },
          { path: 'prestations', element: <ServicesAdminPage /> },
          { path: 'horaires', element: <ScheduleAdminPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
