import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';
import { userApi } from '../../api/userApi';
import { auditApi } from '../../api/auditApi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';
import { formatDate } from '../../utils/formatters';
import {
  FolderGit2,
  Users,
  ShieldCheck,
  BotMessageSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';

export function AdminDashboard() {
  const [projectsData, setProjectsData] = useState(null);
  const [managersCount, setManagersCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [projRes, mgrRes, empRes, auditRes] = await Promise.allSettled([
          projectApi.getProjects({ size: 10 }),
          userApi.getEligibleProjectManagers(),
          userApi.getEligibleEmployees(),
          auditApi.getAuditLogs({ size: 5 }),
        ]);

        if (projRes.status === 'fulfilled') setProjectsData(projRes.value);
        if (mgrRes.status === 'fulfilled') setManagersCount(mgrRes.value?.length || 0);
        if (empRes.status === 'fulfilled') setEmployeesCount(empRes.value?.length || 0);
        if (auditRes.status === 'fulfilled') setRecentAudits(auditRes.value?.content || []);
      } catch (err) {
        setError(err.message || 'Failed to load system metrics');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">System Administration</h1>
            <p className="page-subtitle">Overview of projects, users, and system audit trail</p>
          </div>
        </div>
        <div className="grid-cols-auto" style={{ marginBottom: '1.75rem' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  const projects = projectsData?.content || [];
  const totalProjects = projectsData?.totalElements || projects.length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Administration</h1>
          <p className="page-subtitle">
            System overview, organizational projects, access control, and audit trail
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/projects?action=create">
            <Button variant="primary" icon={Plus}>Create Project</Button>
          </Link>
          <Link to="/admin/users?action=create">
            <Button variant="secondary" icon={Users}>Add User</Button>
          </Link>
          <Link to="/assistant">
            <Button variant="secondary" icon={BotMessageSquare}>AI Assistant</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', color: 'var(--danger-solid)' }}>
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid-cols-auto" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-card-title">Total Projects</div>
          <div className="stat-card-value">{totalProjects}</div>
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <FolderGit2 size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Project Managers</div>
          <div className="stat-card-value">{managersCount}</div>
          <div className="stat-card-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
            <Users size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Active Employees</div>
          <div className="stat-card-value">{employeesCount}</div>
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-solid)' }}>
            <Users size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Audit Events Logged</div>
          <div className="stat-card-value">{recentAudits.length > 0 ? 'Active' : 'Clean'}</div>
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-solid)' }}>
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Projects Overview */}
        <Card>
          <CardHeader
            title="Projects Overview"
            action={
              <Link to="/projects">
                <Button variant="ghost" size="sm" icon={ArrowRight}>All Projects</Button>
              </Link>
            }
          />
          <CardBody style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Name</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 6).map((proj) => (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/projects/${proj.id}`} style={{ color: 'var(--primary-600)' }}>
                          {proj.projectKey}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500 }}>{proj.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{proj.managerName || 'Unassigned'}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: proj.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--slate-100)',
                            color: proj.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--slate-600)',
                          }}
                        >
                          {proj.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/projects/${proj.id}`}>
                          <Button variant="secondary" size="sm">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No projects created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Recent Audit Logs */}
        <Card>
          <CardHeader
            title="Recent Audit Activity"
            action={
              <Link to="/admin/audit">
                <Button variant="ghost" size="sm" icon={ArrowRight}>View All</Button>
              </Link>
            }
          />
          <CardBody style={{ padding: '0.5rem 0' }}>
            {recentAudits.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No audit activity recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentAudits.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.action}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Actor: <strong>{item.actorEmail || 'System'}</strong> | Target: {item.entityType} #{item.entityId}
                    </div>
                    {item.details && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.125rem' }}>
                        {item.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
