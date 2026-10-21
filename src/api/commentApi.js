import { apiClient } from './client';

export const commentApi = {
  getCommentsForIssue: (issueId) =>
    apiClient(`/api/v1/issues/${issueId}/comments`),

  addComment: (issueId, content) =>
    apiClient(`/api/v1/issues/${issueId}/comments`, {
      method: 'POST',
      body: { content },
    }),

  updateComment: (commentId, content) =>
    apiClient(`/api/v1/comments/${commentId}`, {
      method: 'PATCH',
      body: { content },
    }),

  deleteComment: (commentId) =>
    apiClient(`/api/v1/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
