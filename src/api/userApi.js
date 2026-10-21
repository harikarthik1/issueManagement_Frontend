import { apiClient } from './client';

export const userApi = {
  getUsers: ({ role, page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    apiClient('/api/v1/users', {
      params: { role, page, size, sort },
    }),

  getUserById: (userId) =>
    apiClient(`/api/v1/users/${userId}`),

  createUser: (userData) =>
    apiClient('/api/v1/users', {
      method: 'POST',
      body: userData,
    }),

  updateUser: (userId, userData) =>
    apiClient(`/api/v1/users/${userId}`, {
      method: 'PATCH',
      body: userData,
    }),

  updateUserStatus: (userId, active) =>
    apiClient(`/api/v1/users/${userId}/status`, {
      method: 'PATCH',
      body: { active },
    }),

  getEligibleEmployees: () =>
    apiClient('/api/v1/users/eligible/employees'),

  getEligibleProjectManagers: () =>
    apiClient('/api/v1/users/eligible/managers'),
};
