import { useState, useEffect } from 'react';
import { notificationsApi } from '../../api/notificationsApi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, Info } from 'lucide-react';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [contractAvailable, setContractAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const result = await notificationsApi.getNotifications();
        if (result && result.contractAvailable === false) {
          setContractAvailable(false);
          setNotifications([]);
        } else if (Array.isArray(result)) {
          setNotifications(result);
        } else if (result?.items) {
          setNotifications(result.items);
        }
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">System notifications, assignments, and ticket updates</p>
        </div>
      </div>

      {!contractAvailable && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--info-bg)',
            border: '1px solid var(--info-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--info-text)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Backend Integration Notice:</strong> The backend modular monolith currently does not expose a dedicated <code>/api/v1/notifications</code> endpoint. The frontend integration has been isolated behind <code>src/api/notificationsApi.js</code> in accordance with the documented contract.
          </div>
        </div>
      )}

      <Card>
        <CardHeader title={`Notifications (${notifications.length})`} />
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Checking notifications...
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No unread notifications"
              description="You are caught up! When you are assigned to an issue or mentioned in a comment, updates will appear here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
