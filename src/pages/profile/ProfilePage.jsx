import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RoleBadge } from '../../components/common/Badge';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { formatDate } from '../../utils/formatters';
import { User, KeyRound, Shield, Mail, Calendar, CheckCircle2 } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Account Settings</h1>
          <p className="page-subtitle">Manage your account credentials and personal preferences</p>
        </div>

        <Button
          variant="primary"
          icon={KeyRound}
          onClick={() => setPasswordModalOpen(true)}
        >
          Change Password
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* User Card */}
        <Card>
          <CardHeader title="Account Information" />
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-600)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                }}
              >
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>
                  {user.firstName} {user.lastName}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <RoleBadge role={user.role} />
                  <span
                    className="badge"
                    style={{
                      backgroundColor: user.active ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: user.active ? 'var(--success-text)' : 'var(--danger-text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {user.active ? 'Active Account' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Mail size={18} style={{ color: 'var(--slate-400)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Shield size={18} style={{ color: 'var(--slate-400)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Security Role
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {user.role}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'var(--slate-400)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Member Since
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <User size={18} style={{ color: 'var(--slate-400)', marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    User ID
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    #{user.id}
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Security & Password Card */}
        <Card>
          <CardHeader title="Security & Authentication" />
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                  Account Password
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Change your password to maintain account security.
                </div>
              </div>

              <Button variant="secondary" icon={KeyRound} onClick={() => setPasswordModalOpen(true)}>
                Update Password
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {passwordModalOpen && (
        <ChangePasswordModal
          isOpen={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
        />
      )}
    </div>
  );
}
