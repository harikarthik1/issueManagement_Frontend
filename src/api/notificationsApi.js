import { apiClient } from './client';

/**
 * Notifications API Service
 * 
 * NOTE / GAP DOCUMENTATION:
 * The backend modular monolith currently does not expose a dedicated /api/v1/notifications controller.
 * This service isolates the proposed REST contract:
 *   - GET /api/v1/notifications (list user notifications)
 *   - PATCH /api/v1/notifications/{id}/read (mark as read)
 *   - POST /api/v1/notifications/read-all (mark all as read)
 * 
 * In the event that the backend endpoint returns 404, this client handles the missing
 * contract gracefully without crashing or fabricating fake persistent notifications.
 */

export const notificationsApi = {
  getNotifications: async () => {
    try {
      return await apiClient('/api/v1/notifications');
    } catch (err) {
      if (err.status === 404) {
        return {
          contractAvailable: false,
          items: [],
          message: 'Notifications API endpoint (/api/v1/notifications) is not yet implemented on the backend.',
        };
      }
      throw err;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      return await apiClient(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
    } catch (err) {
      if (err.status === 404) {
        return { success: false, notImplemented: true };
      }
      throw err;
    }
  },

  markAllAsRead: async () => {
    try {
      return await apiClient('/api/v1/notifications/read-all', {
        method: 'POST',
      });
    } catch (err) {
      if (err.status === 404) {
        return { success: false, notImplemented: true };
      }
      throw err;
    }
  },
};
