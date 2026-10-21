import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Role } from './utils/constants';

import './App.css';

// Code-splitting helper for named exports
const lazyNamed = (importFn, name) =>
  lazy(() => importFn().then((module) => ({ default: module[name] })));

// Lazy-loaded route components for high performance production bundle
const LoginPage = lazyNamed(() => import('./pages/auth/LoginPage'), 'LoginPage');
const RegisterAdminPage = lazyNamed(() => import('./pages/auth/RegisterAdminPage'), 'RegisterAdminPage');
const DashboardRouter = lazyNamed(() => import('./pages/dashboard/DashboardRouter'), 'DashboardRouter');
const ProjectListPage = lazyNamed(() => import('./pages/projects/ProjectListPage'), 'ProjectListPage');
const ProjectDetailPage = lazyNamed(() => import('./pages/projects/ProjectDetailPage'), 'ProjectDetailPage');
const IssueListPage = lazyNamed(() => import('./pages/issues/IssueListPage'), 'IssueListPage');
const IssueDetailPage = lazyNamed(() => import('./pages/issues/IssueDetailPage'), 'IssueDetailPage');
const CreateIssuePage = lazyNamed(() => import('./pages/issues/CreateIssuePage'), 'CreateIssuePage');
const AssistantPage = lazyNamed(() => import('./pages/assistant/AssistantPage'), 'AssistantPage');
const NotificationsPage = lazyNamed(() => import('./pages/notifications/NotificationsPage'), 'NotificationsPage');
const UserManagementPage = lazyNamed(() => import('./pages/admin/UserManagementPage'), 'UserManagementPage');
const AuditLogsPage = lazyNamed(() => import('./pages/admin/AuditLogsPage'), 'AuditLogsPage');
const CacheMetricsPage = lazyNamed(() => import('./pages/admin/CacheMetricsPage'), 'CacheMetricsPage');
const ProfilePage = lazyNamed(() => import('./pages/profile/ProfilePage'), 'ProfilePage');
const NotFoundPage = lazyNamed(() => import('./pages/NotFoundPage'), 'NotFoundPage');

function PageLoader() {
  return (
    <div className="page-loader-container">
      <Loader2 size={36} className="animate-spin" />
      <span style={{ fontSize: '0.875rem', color: 'var(--slate-500, #64748b)', fontWeight: 500 }}>
        Loading...
      </span>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
