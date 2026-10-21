import PropTypes from 'prop-types';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  BotMessageSquare,
  Bell,
  Users,
  ShieldCheck,
  Cpu,
  User,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../utils/constants';

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.EMPLOYEE],
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderGit2,
      roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.EMPLOYEE],
    },
    {
      to: '/issues',
      label: 'Issues',
      icon: CheckSquare,
      roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.EMPLOYEE],
    },
    {
      to: '/assistant',
      label: 'AI Assistant',
      icon: BotMessageSquare,
      roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.EMPLOYEE],
      highlight: true,
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      roles: [Role.ADMIN, Role.PROJECT_MANAGER, Role.EMPLOYEE],
    },
  ];

  const adminItems = [
    {
      to: '/admin/users',
      label: 'User Management',
      icon: Users,
      roles: [Role.ADMIN],
    },
    {
      to: '/admin/audit',
      label: 'Audit Logs',
      icon: ShieldCheck,
      roles: [Role.ADMIN],
    },
    {
      to: '/admin/cache',
      label: 'Cache Metrics',
      icon: Cpu,
      roles: [Role.ADMIN],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));
  const filteredAdminItems = adminItems.filter((item) => item.roles.includes(role));

  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
      >
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand" onClick={closeMobile}>
            <div className="sidebar-brand-icon">
              <Sparkles size={18} />
            </div>
            {!collapsed && <span>IssueAI</span>}
          </NavLink>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: 'var(--slate-400)', padding: '6px' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!collapsed && <div className="nav-section-title">Navigation</div>}
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="nav-item-icon" />
                {!collapsed && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                    {item.label}
                    {item.highlight && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        AI
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            );
          })}

          {filteredAdminItems.length > 0 && (
            <>
              {!collapsed && <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>Administration</div>}
              {filteredAdminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={closeMobile}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="nav-item-icon" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </>
          )}

          <div style={{ marginTop: 'auto' }} />
          {!collapsed && <div className="nav-section-title">Account</div>}
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
            title={collapsed ? 'Profile' : undefined}
          >
            <User className="nav-item-icon" />
            {!collapsed && <span>Profile & Settings</span>}
          </NavLink>

          <button
            type="button"
            className="nav-item"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="nav-item-icon" style={{ color: 'var(--danger-solid)' }} />
            {!collapsed && <span style={{ color: 'var(--danger-border)' }}>Logout</span>}
          </button>
        </nav>

        {!collapsed && user && (
          <div className="sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-700)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  setCollapsed: PropTypes.func.isRequired,
  mobileOpen: PropTypes.bool.isRequired,
  setMobileOpen: PropTypes.func.isRequired,
};
