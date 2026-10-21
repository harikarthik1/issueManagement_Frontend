import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Role } from './utils/constants';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterAdminPage } from './pages/auth/RegisterAdminPage';
import { DashboardRouter } from './pages/dashboard/DashboardRouter';
import { ProjectListPage } from './pages/projects/ProjectListPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { IssueListPage } from './pages/issues/IssueListPage';
import { IssueDetailPage } from './pages/issues/IssueDetailPage';
import { CreateIssuePage } from './pages/issues/CreateIssuePage';
import { AssistantPage } from './pages/assistant/AssistantPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { CacheMetricsPage } from './pages/admin/CacheMetricsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-admin" element={<RegisterAdminPage />} />

            {/* Authenticated Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardRouter />} />

              {/* Projects */}
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

              {/* Issues */}
              <Route path="/issues" element={<IssueListPage />} />
              <Route path="/issues/create" element={<CreateIssuePage />} />
              <Route path="/issues/:issueId" element={<IssueDetailPage />} />

              {/* Centralized AI Assistant */}
              <Route path="/assistant" element={<AssistantPage />} />

              {/* Notifications */}
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Profile & Account Settings */}
              <Route path="/profile" element={<ProfilePage />} />

              {/* Administrative Routes (ADMIN only) */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cache"
                element={
                  <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <CacheMetricsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback inside AppLayout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
