import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { PlannerWrapper, ParticipantsWrapper, PartsWrapper, SkillsWrapper, TrackingWrapper, MyAssignmentsWrapper, MonthWrapper } from './components/wrappers/RouteWrappers';
import { ReportsView } from './components/features/ReportsView';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const queryClient = new QueryClient();

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/confirm/:assignmentId" element={<ConfirmationPage />} />
      <Route path="/confirm/:assignmentId/:personId" element={<ConfirmationPage />} />

      {/* Main App Structure - Protected */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE', 'ASSISTENTE', 'USER']} />}>
        {/* MainLayout provides Data and AppLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/planner" replace />} />

          {/* Planner */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE', 'ASSISTENTE', 'USER']} />}>
            <Route path="/planner" element={<PlannerWrapper />} />
          </Route>

          {/* Admin Only Views */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/participants" element={<ParticipantsWrapper />} />
            <Route path="/parts" element={<PartsWrapper />} />
            <Route path="/skills" element={<SkillsWrapper />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Tracking */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE', 'ASSISTENTE']} />}>
            <Route path="/tracking" element={<TrackingWrapper />} />
          </Route>

          {/* Reports */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PRESIDENTE']} />}>
            <Route path="/reports" element={<ReportsView />} />
          </Route>

          <Route path="/month" element={<MonthWrapper />} />

          {/* Participant View */}
          <Route path="/my-assignments" element={<MyAssignmentsWrapper />} />
        </Route>
      </Route>
    </>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }
  }
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingSpinner />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
