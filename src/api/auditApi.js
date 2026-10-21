import { apiClient } from './client';

export const auditApi = {
  getAuditLogs: ({ entityType, page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    apiClient('/api/v1/audit-logs', {
      params: { entityType, page, size, sort },
    }),
};
