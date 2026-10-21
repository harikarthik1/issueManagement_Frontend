import { apiClient } from './client';

export const aiIssueApi = {
  searchSimilarIssues: (projectId, description) =>
    apiClient(`/api/v1/projects/${projectId}/issues/ai/search-similar`, {
      method: 'POST',
      body: { description },
    }),

  draftIssue: (projectId, description) =>
    apiClient(`/api/v1/projects/${projectId}/issues/ai/draft`, {
      method: 'POST',
      body: { description },
    }),

  syncVectors: (projectId) =>
    apiClient(`/api/v1/projects/${projectId}/issues/ai/sync-vectors`, {
      method: 'POST',
    }),
};
