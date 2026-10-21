import { apiClient } from './client';

export const issueApi = {
  getProjectIssues: (projectId, { status, priority, type, assigneeId, page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    apiClient(`/api/v1/projects/${projectId}/issues`, {
      params: { status, priority, type, assigneeId, page, size, sort },
    }),

  getIssueById: (issueId) =>
    apiClient(`/api/v1/issues/${issueId}`),

  createIssue: (projectId, issueData) =>
    apiClient(`/api/v1/projects/${projectId}/issues`, {
      method: 'POST',
      body: issueData,
    }),

  updateIssue: (issueId, issueData) =>
    apiClient(`/api/v1/issues/${issueId}`, {
      method: 'PATCH',
      body: issueData,
    }),

  assignIssue: (issueId, assigneeId) =>
    apiClient(`/api/v1/issues/${issueId}/assignee`, {
      method: 'PUT',
      body: { assigneeId },
    }),

  transitionStatus: (issueId, status) =>
    apiClient(`/api/v1/issues/${issueId}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  reopenIssue: (issueId, reason) =>
    apiClient(`/api/v1/issues/${issueId}/reopen`, {
      method: 'POST',
      body: { reason },
    }),

  archiveIssue: (issueId) =>
    apiClient(`/api/v1/issues/${issueId}/archive`, {
      method: 'POST',
    }),

  deleteIssue: (issueId) =>
    apiClient(`/api/v1/issues/${issueId}`, {
      method: 'DELETE',
    }),

  getIssueHistory: (issueId) =>
    apiClient(`/api/v1/issues/${issueId}/history`),
};
