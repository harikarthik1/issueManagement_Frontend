import { useAuth } from '../../context/AuthContext';
import { Role } from '../../utils/constants';
import { AdminDashboard } from './AdminDashboard';
import { ProjectManagerDashboard } from './ProjectManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export function DashboardRouter() {
  const { role } = useAuth();

  if (role === Role.ADMIN) {
    return <AdminDashboard />;
  }
  if (role === Role.PROJECT_MANAGER) {
    return <ProjectManagerDashboard />;
  }
  return <EmployeeDashboard />;
}
