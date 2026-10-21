import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { useToast } from '../../context/ToastContext';
import { Role } from '../../utils/constants';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RoleBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export function UserManagementPage() {
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: Role.EMPLOYEE,
  });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState({});

  // Status Change Dialog
  const [statusTarget, setStatusTarget] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getUsers({
        role: roleFilter || undefined,
        page,
        size: 15,
      });
      setUsersData(data);
    } catch (err) {
      toastError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, page, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateErrors({});

    const errors = {};
    if (!createForm.email.trim()) errors.email = 'Email is required';
    if (!createForm.password) errors.password = 'Password is required';
    else if (createForm.password.length < 8) errors.password = 'Minimum 8 characters';
    if (!createForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!createForm.lastName.trim()) errors.lastName = 'Last name is required';

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreating(true);
    try {
      const created = await userApi.createUser({
        email: createForm.email.trim(),
        password: createForm.password,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        role: createForm.role,
      });
      success(`User ${created.firstName} ${created.lastName} created successfully`);
      setCreateModalOpen(false);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: Role.EMPLOYEE,
      });
      fetchUsers();
    } catch (err) {
      if (err.validationErrors) {
        setCreateErrors(err.validationErrors);
      } else {
        toastError(err.message || 'Failed to create user');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;
    setUpdatingStatus(true);
    try {
      const nextActive = !statusTarget.active;
      await userApi.updateUserStatus(statusTarget.id, nextActive);
      success(
        nextActive
          ? `User ${statusTarget.firstName} activated`
          : `User ${statusTarget.firstName} deactivated. All active assigned issues were unassigned.`
      );
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      toastError(err.message || 'Failed to update user status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const users = usersData?.content || [];
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Provision users, manage roles, and activate/deactivate accounts</p>
        </div>

        <Button variant="primary" icon={UserPlus} onClick={() => setCreateModalOpen(true)}>
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--slate-400)',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.25rem', height: '36px' }}
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: 'auto', height: '36px', fontSize: '0.8125rem' }}
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Roles</option>
                <option value={Role.ADMIN}>Administrators</option>
                <option value={Role.PROJECT_MANAGER}>Project Managers</option>
                <option value={Role.EMPLOYEE}>Employees</option>
              </select>
            </div>
          }
          action={
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total: <strong>{usersData?.totalElements || filteredUsers.length}</strong>
            </div>
          }
        />

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="No user accounts matched the given search or role filter."
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Password Reset</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--slate-200)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              color: 'var(--slate-700)',
                            }}
                          >
                            {u.firstName ? u.firstName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td>
                        {u.active ? (
                          <span
                            className="badge"
                            style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', gap: '4px' }}
                          >
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', gap: '4px' }}
                          >
                            <XCircle size={12} />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {u.passwordChangeRequired ? (
                          <span style={{ color: 'var(--warning-solid)', fontWeight: 600 }}>Required</span>
                        ) : (
                          'Normal'
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant={u.active ? 'ghost' : 'secondary'}
                          size="sm"
                          style={{ color: u.active ? 'var(--danger-solid)' : 'var(--success-solid)' }}
                          onClick={() => setStatusTarget(u)}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {usersData && (
          <Pagination
            pageNumber={usersData.pageNumber}
            totalPages={usersData.totalPages}
            totalElements={usersData.totalElements}
            pageSize={usersData.pageSize}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </Card>

      {/* Create User Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New User"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateModalOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateSubmit} loading={creating}>
                Create User
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="first-name">First Name</label>
                <input
                  id="first-name"
                  type="text"
                  className="form-control"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  disabled={creating}
                  required
                />
                {createErrors.firstName && <div className="form-error">{createErrors.firstName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="last-name">Last Name</label>
                <input
                  id="last-name"
                  type="text"
                  className="form-control"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  disabled={creating}
                  required
                />
                {createErrors.lastName && <div className="form-error">{createErrors.lastName}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email-address">Email Address</label>
              <input
                id="email-address"
                type="email"
                className="form-control"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={creating}
                required
              />
              {createErrors.email && <div className="form-error">{createErrors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="temp-password">Temporary Password</label>
              <input
                id="temp-password"
                type="password"
                className="form-control"
                placeholder="Minimum 8 characters"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                disabled={creating}
                required
              />
              {createErrors.password && <div className="form-error">{createErrors.password}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role-select">Role</label>
              <select
                id="role-select"
                className="form-control"
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                disabled={creating}
              >
                <option value={Role.EMPLOYEE}>EMPLOYEE — Regular member on assigned projects</option>
                <option value={Role.PROJECT_MANAGER}>PROJECT_MANAGER — Manages assigned projects & teams</option>
                <option value={Role.ADMIN}>ADMIN — Full system-wide administrative control</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Confirmation Dialog */}
      {statusTarget && (
        <ConfirmDialog
          isOpen={!!statusTarget}
          onClose={() => setStatusTarget(null)}
          onConfirm={handleConfirmStatusChange}
          title={statusTarget.active ? 'Deactivate User Account' : 'Activate User Account'}
          message={
            statusTarget.active
              ? `Are you sure you want to deactivate ${statusTarget.firstName} ${statusTarget.lastName}? They will be immediately blocked from logging in, and all OPEN and IN_PROGRESS issues assigned to them across all projects will be automatically unassigned.`
              : `Are you sure you want to reactivate ${statusTarget.firstName} ${statusTarget.lastName}? They will be able to log in and be assigned to projects again.`
          }
          confirmText={statusTarget.active ? 'Deactivate User' : 'Activate User'}
          variant={statusTarget.active ? 'danger' : 'primary'}
          loading={updatingStatus}
        />
      )}
    </div>
  );
}
