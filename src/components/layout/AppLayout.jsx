import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from '../../pages/auth/ChangePasswordModal';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { passwordChangeRequired } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`main-content-wrapper ${collapsed ? 'collapsed' : ''}`}>
        <Navbar onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="page-container" id="main-content">
          <Outlet />
        </main>
      </div>

      {passwordChangeRequired && (
        <ChangePasswordModal isOpen={true} required={true} />
      )}
    </div>
  );
}
