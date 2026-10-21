import { apiClient } from './client';

export const authApi = {
  login: (credentials) =>
    apiClient('/api/v1/auth/login', {
      method: 'POST',
      body: credentials,
    }),

  registerAdmin: (adminData) =>
    apiClient('/api/v1/auth/register-admin', {
      method: 'POST',
      body: adminData,
    }),

  changePassword: (passwords) =>
    apiClient('/api/v1/auth/change-password', {
      method: 'POST',
      body: passwords,
    }),

  logout: () =>
    apiClient('/api/v1/auth/logout', {
      method: 'POST',
    }),
};
