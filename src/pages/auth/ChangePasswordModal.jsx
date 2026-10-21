import { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { KeyRound } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose, required = false }) {
  const { changePassword } = useAuth();
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) errors.newPassword = 'New password is required';
    else if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters long';
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onClose) onClose();
    } catch (err) {
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors);
      } else {
        error(err.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={required ? () => {} : onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={20} color="var(--primary-600)" />
          <span>{required ? 'Password Change Required' : 'Change Password'}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {required && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            Your account requires a password change before you can continue using the application.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-control"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            required
          />
          {fieldErrors.currentPassword && (
            <div className="form-error">{fieldErrors.currentPassword}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          <div className="form-hint">Must be at least 8 characters and different from current password</div>
          {fieldErrors.newPassword && (
            <div className="form-error">{fieldErrors.newPassword}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
          />
          {fieldErrors.confirmPassword && (
            <div className="form-error">{fieldErrors.confirmPassword}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          {!required && (
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" loading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

ChangePasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  required: PropTypes.bool,
};
