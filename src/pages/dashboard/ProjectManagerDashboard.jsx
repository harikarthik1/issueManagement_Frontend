import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import {
  FolderGit2,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  BotMessageSquare,
  ArrowRight,
} from 'lucide-react';

export function ProjectManagerDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState(null);

  // Fetch projects list
  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);
      setError(null);
      try {
        const response = await projectApi.getProjects({ size: 100 });
        const list = response?.content || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  // Fetch dashboard for selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setDashboardData(null);
      return;
    }
    async function loadDashboard() {
      setLoadingDashboard(true);
      setError(null);
      try {
        const response = await projectApi.getProjectDashboard(selectedProjectId);
        setDashboardData(response);
      } catch (err) {
        setError(err.message || 'Failed to load project dashboard');
      } finally {
        setLoadingDashboard(false);
      }
    }
    loadDashboard();
  }, [selectedProjectId]);

  if (loadingProjects) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Project Management</h1>
            <p className="page-subtitle">Track project health and team allocations</p>
          </div>
        </div>
        <div className="grid-cols-auto">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Project Operations</h1>
            <p className="page-subtitle">No active projects assigned</p>
          </div>
        </div>
        <Card>
          <EmptyState
            icon={FolderGit2}
            title="No projects assigned to you"
            description="You do not currently manage any projects. Contact your system administrator to be assigned to a project."
          />
        </Card>
      </div>
    );
  }

  const {
    projectName = '',
    projectKey = '',
    totalIssues = 0,
    pendingWorkCount = 0,
    highPriorityActiveCount = 0,
    criticalPriorityActiveCount = 0,
    unassignedActiveCount = 0,
    memberWorkloads = [],
    unassignedActiveIssues = [],
  } = dashboardData || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Operations Dashboard</h1>
          <p className="page-subtitle">
            Operational metrics, member workloads, and unassigned issues
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="project-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Project:
            </label>
            <select
              id="project-select"
              className="form-control"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectKey})
                </option>
              ))}
            </select>
          </div>

          <Link to={`/issues/create?projectId=${selectedProjectId || ''}`}>
            <Button variant="primary" icon={Plus}>Create Issue</Button>
          </Link>
          <Link to="/assistant">
            <Button variant="secondary" icon={BotMessageSquare}>Analyze with AI</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}>
          {error}
        </div>
      )}

      {loadingDashboard ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-cols-auto">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid-cols-auto" style={{ marginBottom: '1.75rem' }}>
            <div className="stat-card">
              <div className="stat-card-title">Total Project Issues</div>
              <div className="stat-card-value">{totalIssues}</div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                <FolderGit2 size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Pending Work</div>
              <div className="stat-card-value">{pendingWorkCount}</div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
                <Clock size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Urgent Active</div>
              <div className="stat-card-value" style={{ color: criticalPriorityActiveCount > 0 ? 'var(--danger-solid)' : undefined }}>
                {highPriorityActiveCount + criticalPriorityActiveCount}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-solid)' }}>
                <AlertCircle size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Unassigned Active</div>
              <div className="stat-card-value" style={{ color: unassignedActiveCount > 0 ? 'var(--warning-solid)' : undefined }}>
                {unassignedActiveCount}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-solid)' }}>
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Unassigned Active Issues (Triage Section) */}
          <div style={{ marginBottom: '1.75rem' }}>
            <Card>
              <CardHeader
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Unassigned Active Issues (Triage)</span>
                    <span className="badge" style={{ backgroundColor: unassignedActiveCount > 0 ? 'var(--warning-bg)' : 'var(--slate-100)', color: unassignedActiveCount > 0 ? 'var(--warning-text)' : 'var(--slate-700)' }}>
                      {unassignedActiveIssues.length}
                    </span>
                  </div>
                }
                action={
                  <Link to={`/projects/${selectedProjectId}?tab=issues`}>
                    <Button variant="ghost" size="sm" icon={ArrowRight}>View Project Issues</Button>
                  </Link>
                }
              />
              <CardBody style={{ padding: 0 }}>
                {unassignedActiveIssues.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} style={{ color: 'var(--success-solid)', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontWeight: 600 }}>All active issues in {projectName} are assigned!</div>
                  </div>
                ) : (
                  <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Title</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedActiveIssues.map((issue) => (
                          <tr key={issue.id}>
                            <td style={{ fontWeight: 600 }}>
                              <Link to={`/issues/${issue.id}`} style={{ color: 'var(--primary-600)' }}>
                                {issue.issueKey}
                              </Link>
                            </td>
                            <td style={{ fontWeight: 500, maxWidth: '320px' }}>
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {issue.title}
                              </div>
                            </td>
                            <td>
                              <PriorityBadge priority={issue.priority} />
                            </td>
                            <td>
                              <StatusBadge status={issue.status} />
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                              {formatDate(issue.createdAt)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Link to={`/issues/${issue.id}`}>
                                <Button variant="secondary" size="sm">Triage & Assign</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Member Workload Breakdown */}
          <Card>
            <CardHeader
              title={`Team Workload Breakdown — ${projectName} (${projectKey})`}
              action={
                <Link to={`/projects/${selectedProjectId}?tab=members`}>
                  <Button variant="ghost" size="sm" icon={Users}>Manage Members</Button>
                </Link>
              }
            />
            <CardBody style={{ padding: 0 }}>
              {memberWorkloads.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No project members assigned"
                  description="Add employees to this project to start assigning workload."
                />
              ) : (
                <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Team Member</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'center' }}>Open</th>
                        <th style={{ textAlign: 'center' }}>In Progress</th>
                        <th style={{ textAlign: 'center' }}>Resolved</th>
                        <th style={{ textAlign: 'center' }}>Closed</th>
                        <th style={{ textAlign: 'center' }}>Total Assigned</th>
                        <th style={{ textAlign: 'right' }}>Drilldown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberWorkloads.map((mw) => (
                        <tr key={mw.employeeId}>
                          <td style={{ fontWeight: 600 }}>{mw.employeeName}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{mw.employeeEmail}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--status-open-text)' }}>
                            {mw.openCount}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--status-progress-text)' }}>
                            {mw.inProgressCount}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--status-resolved-text)' }}>
                            {mw.resolvedCount}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--status-closed-text)' }}>
                            {mw.closedCount}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: mw.totalAssignedCount > 0 ? 'var(--primary-50)' : 'var(--slate-100)',
                                color: mw.totalAssignedCount > 0 ? 'var(--primary-700)' : 'var(--slate-600)',
                              }}
                            >
                              {mw.totalAssignedCount}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to={`/projects/${selectedProjectId}?tab=issues&assigneeId=${mw.employeeId}`}>
                              <Button variant="ghost" size="sm">Filter Issues</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
