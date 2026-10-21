import { apiClient } from './client';

export const projectApi = {
  getProjects: ({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    apiClient('/api/v1/projects', {
      params: { page, size, sort },
    }),

  getProjectById: (projectId) =>
    apiClient(`/api/v1/projects/${projectId}`),

  createProject: (projectData) =>
    apiClient('/api/v1/projects', {
      method: 'POST',
      body: projectData,
    }),

  updateProject: (projectId, updateData) =>
    apiClient(`/api/v1/projects/${projectId}`, {
      method: 'PATCH',
      body: updateData,
    }),

  assignManager: (projectId, managerId) =>
    apiClient(`/api/v1/projects/${projectId}/manager`, {
      method: 'PUT',
      body: { managerId },
    }),

  getProjectMembers: (projectId) =>
    apiClient(`/api/v1/projects/${projectId}/members`),

  addProjectMember: (projectId, userId) =>
    apiClient(`/api/v1/projects/${projectId}/members`, {
      method: 'POST',
      body: { userId },
    }),

  removeProjectMember: (projectId, userId) =>
    apiClient(`/api/v1/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),

  archiveProject: (projectId) =>
    apiClient(`/api/v1/projects/${projectId}/archive`, {
      method: 'POST',
    }),

  getProjectDashboard: (projectId) =>
    apiClient(`/api/v1/projects/${projectId}/dashboard`),
};
