import { apiClient } from './client';

export const dashboardApi = {
  getEmployeeDashboard: () =>
    apiClient('/api/v1/dashboard/employee'),

  getProjectManagerDashboard: (projectId) =>
    apiClient(`/api/v1/projects/${projectId}/dashboard`),
};
