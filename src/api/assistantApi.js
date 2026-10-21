import { apiClient } from './client';

export const assistantApi = {
  createConversation: (title) =>
    apiClient('/api/v1/assistant/conversations', {
      method: 'POST',
      body: title ? { title } : {},
    }),

  listConversations: () =>
    apiClient('/api/v1/assistant/conversations'),

  getMessages: (conversationId) =>
    apiClient(`/api/v1/assistant/conversations/${conversationId}/messages`),

  sendMessage: (conversationId, message) =>
    apiClient(`/api/v1/assistant/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { message },
    }),

  deleteConversation: (conversationId) =>
    apiClient(`/api/v1/assistant/conversations/${conversationId}`, {
      method: 'DELETE',
    }),

  clearSession: () =>
    apiClient('/api/v1/assistant/session', {
      method: 'DELETE',
    }),

  getCacheMetrics: () =>
    apiClient('/api/v1/assistant/cache/metrics'),
};
