import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  BotMessageSquare,
  ArrowRight,
} from 'lucide-react';

export function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getEmployeeDashboard();
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to load employee dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">My Workload</h1>
            <p className="page-subtitle">Personal issue tracker and urgent action items</p>
          </div>
        </div>
        <div className="grid-cols-auto" style={{ marginBottom: '1.75rem' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger-solid)', marginBottom: '1rem' }}>{error}</p>
        <Button variant="secondary" onClick={fetchDashboard}>Retry</Button>
      </div>
    );
  }

  const {
    totalAssignedIssues = 0,
    openCount = 0,
    inProgressCount = 0,
    resolvedCount = 0,
    closedCount = 0,
    highPriorityActiveCount = 0,
    criticalPriorityActiveCount = 0,
    activeAssignedIssues = [],
  } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Workload</h1>
          <p className="page-subtitle">
            Welcome back, {data?.employeeName || 'Team Member'}. Here is your active assignment summary.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/issues/create">
            <Button variant="primary" icon={Plus}>Create Issue</Button>
          </Link>
          <Link to="/assistant">
            <Button variant="secondary" icon={BotMessageSquare}>Ask Assistant</Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-cols-auto" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-card-title">Total Assigned</div>
          <div className="stat-card-value">{totalAssignedIssues}</div>
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <CheckSquare size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Open & In Progress</div>
          <div className="stat-card-value">{openCount + inProgressCount}</div>
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
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Resolved & Closed</div>
          <div className="stat-card-value">{resolvedCount + closedCount}</div>
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-solid)' }}>
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Prioritized Active Work Table */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Prioritized Active Issues</span>
              <span className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)' }}>
                {activeAssignedIssues.length}
              </span>
            </div>
          }
          action={
            <Link to="/issues">
              <Button variant="ghost" size="sm" icon={ArrowRight}>View All Issues</Button>
            </Link>
          }
        />
        <CardBody style={{ padding: 0 }}>
          {activeAssignedIssues.length === 0 ? (
            <EmptyState
              title="No active issues assigned"
              description="You have no open or in-progress issues currently assigned to you."
              actionText="Browse Project Issues"
              onAction={() => {}}
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssignedIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/issues/${issue.id}`} style={{ color: 'var(--primary-600)' }}>
                          {issue.issueKey}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: '300px' }}>
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {issue.title}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>{issue.projectName || issue.projectKey}</span>
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
                          <Button variant="secondary" size="sm">Open</Button>
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
  );
}
