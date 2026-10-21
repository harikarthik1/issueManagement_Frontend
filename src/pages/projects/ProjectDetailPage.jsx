import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';
import { issueApi } from '../../api/issueApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Role, IssueStatus, IssuePriority, IssueType } from '../../utils/constants';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TableSkeleton, CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge, PriorityBadge, RoleBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import {
  Users,
  CheckSquare,
  Plus,
  BotMessageSquare,
  Trash2,
  Edit,
  UserPlus,
  Filter,
  BarChart3,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'issues';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState(null);

  // Issues Tab State
  const [issuesData, setIssuesData] = useState(null);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState(searchParams.get('assigneeId') || '');
  const [issuesPage, setIssuesPage] = useState(0);

  // Members Tab State
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Dashboard Tab State
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Archive & Edit Project State
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const canManageProject = role === Role.ADMIN || (role === Role.PROJECT_MANAGER && project?.managerId === user?.id);

  // 1. Fetch Project Details
  const fetchProject = useCallback(async () => {
    setLoadingProject(true);
    setProjectError(null);
    try {
      const data = await projectApi.getProjectById(projectId);
      setProject(data);
      setEditName(data.name);
      setEditDesc(data.description || '');
    } catch (err) {
      setProjectError(err.message || 'Failed to load project details');
    } finally {
      setLoadingProject(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // 2. Fetch Issues
  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    setLoadingIssues(true);
    try {
      const data = await issueApi.getProjectIssues(projectId, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        type: typeFilter || undefined,
        assigneeId: assigneeFilter ? Number(assigneeFilter) : undefined,
        page: issuesPage,
        size: 15,
      });
      setIssuesData(data);
    } catch (err) {
      toastError(err.message || 'Failed to load project issues');
    } finally {
      setLoadingIssues(false);
    }
  }, [projectId, statusFilter, priorityFilter, typeFilter, assigneeFilter, issuesPage, toastError]);

  useEffect(() => {
    if (activeTab === 'issues') {
      fetchIssues();
    }
  }, [activeTab, fetchIssues]);

  // 3. Fetch Members
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    setLoadingMembers(true);
    try {
      const data = await projectApi.getProjectMembers(projectId);
      setMembers(data || []);
    } catch (err) {
      toastError(err.message || 'Failed to load project members');
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId, toastError]);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab, fetchMembers]);

  // 4. Fetch Dashboard
  const fetchDashboard = useCallback(async () => {
    if (!projectId || !canManageProject) return;
    setLoadingDashboard(true);
    try {
      const data = await projectApi.getProjectDashboard(projectId);
      setDashboardMetrics(data);
    } catch (err) {
      toastError(err.message || 'Failed to load operational dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  }, [projectId, canManageProject, toastError]);

  useEffect(() => {
    if (activeTab === 'analytics' && canManageProject) {
      fetchDashboard();
    }
  }, [activeTab, canManageProject, fetchDashboard]);

  // Add Member
  const handleOpenAddMember = async () => {
    try {
      const emps = await userApi.getEligibleEmployees();
      // Filter out those already members
      const existingIds = new Set(members.map((m) => m.userId));
      const available = emps.filter((e) => !existingIds.has(e.id));
      setEligibleEmployees(available);
      if (available.length > 0) {
        setSelectedEmployeeId(available[0].id);
      } else {
        setSelectedEmployeeId('');
      }
      setAddMemberModalOpen(true);
    } catch (err) {
      toastError(err.message || 'Failed to load eligible employees');
    }
  };

  const handleConfirmAddMember = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setAddingMember(true);
    try {
      await projectApi.addProjectMember(projectId, Number(selectedEmployeeId));
      success('Project member added successfully');
      setAddMemberModalOpen(false);
      fetchMembers();
    } catch (err) {
      toastError(err.message || 'Failed to add project member');
    } finally {
      setAddingMember(false);
    }
  };

  // Remove Member
  const handleConfirmRemoveMember = async () => {
    if (!removeMemberTarget) return;
    setRemovingMember(true);
    try {
      await projectApi.removeProjectMember(projectId, removeMemberTarget.userId);
      success(`Removed ${removeMemberTarget.userName} from project. Open issues were unassigned.`);
      setRemoveMemberTarget(null);
      fetchMembers();
    } catch (err) {
      toastError(err.message || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  // Archive Project
  const handleArchiveProject = async () => {
    setArchiving(true);
    try {
      await projectApi.archiveProject(projectId);
      success('Project archived successfully');
      setArchiveDialogOpen(false);
      fetchProject();
    } catch (err) {
      toastError(err.message || 'Failed to archive project');
    } finally {
      setArchiving(false);
    }
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await projectApi.updateProject(projectId, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setProject(updated);
      success('Project updated successfully');
      setEditModalOpen(false);
    } catch (err) {
      toastError(err.message || 'Failed to update project');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loadingProject) {
    return (
      <div>
        <CardSkeleton />
        <div style={{ marginTop: '1.5rem' }}>
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger-solid)', marginBottom: '0.5rem' }}>Project Error</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {projectError || 'Project not found or you do not have permission to access it.'}
        </p>
        <Button variant="secondary" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </Card>
    );
  }

  const issuesList = issuesData?.content || [];

  return (
    <div>
      {/* Project Header */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-100)',
                  color: 'var(--primary-800)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {project.projectKey}
              </span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {project.name}
              </h1>
              <span
                className="badge"
                style={{
                  backgroundColor: project.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--slate-100)',
                  color: project.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--slate-600)',
                  border: `1px solid ${project.status === 'ACTIVE' ? 'var(--success-border)' : 'var(--slate-200)'}`,
                }}
              >
                {project.status}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', maxWidth: '750px', marginTop: '0.5rem' }}>
              {project.description || 'No description provided.'}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <div>
                Manager: <strong>{project.managerName || 'Unassigned'}</strong> {project.managerEmail && `(${project.managerEmail})`}
              </div>
              <div>Created: <strong>{formatDate(project.createdAt)}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <Link to={`/issues/create?projectId=${project.id}`}>
              <Button variant="primary" icon={Plus}>Create Issue</Button>
            </Link>

            <Link to={`/assistant?projectId=${project.id}`}>
              <Button variant="secondary" icon={BotMessageSquare}>Analyze with AI</Button>
            </Link>

            {canManageProject && (
              <Button variant="secondary" icon={Edit} onClick={() => setEditModalOpen(true)}>
                Edit
              </Button>
            )}

            {role === Role.ADMIN && project.status === 'ACTIVE' && (
              <Button variant="ghost" icon={Trash2} onClick={() => setArchiveDialogOpen(true)} style={{ color: 'var(--danger-solid)' }}>
                Archive
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1rem' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'issues' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setActiveTab('issues')}
          >
            <CheckSquare size={16} />
            <span>Issues ({issuesData?.totalElements ?? '...'})</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={16} />
            <span>Project Members</span>
          </button>

          {canManageProject && (
            <button
              type="button"
              className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              <span>Operational Dashboard</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ISSUES */}
      {activeTab === 'issues' && (
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Filter size={16} /> Filters:
                </span>

                <select
                  className="form-control"
                  style={{ width: 'auto', height: '34px', fontSize: '0.8125rem' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setIssuesPage(0); }}
                >
                  <option value="">All Statuses</option>
                  {Object.values(IssueStatus).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="form-control"
                  style={{ width: 'auto', height: '34px', fontSize: '0.8125rem' }}
                  value={priorityFilter}
                  onChange={(e) => { setPriorityFilter(e.target.value); setIssuesPage(0); }}
                >
                  <option value="">All Priorities</option>
                  {Object.values(IssuePriority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  className="form-control"
                  style={{ width: 'auto', height: '34px', fontSize: '0.8125rem' }}
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setIssuesPage(0); }}
                >
                  <option value="">All Types</option>
                  {Object.values(IssueType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {(statusFilter || priorityFilter || typeFilter || assigneeFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('');
                      setPriorityFilter('');
                      setTypeFilter('');
                      setAssigneeFilter('');
                      setIssuesPage(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            }
          />
          <CardBody style={{ padding: 0 }}>
            {loadingIssues ? (
              <TableSkeleton rows={5} cols={5} />
            ) : issuesList.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No issues found"
                description={
                  statusFilter || priorityFilter || typeFilter || assigneeFilter
                    ? 'No issues match the selected filters.'
                    : 'There are currently no issues reported in this project.'
                }
                actionText="Create First Issue"
                onAction={() => navigate(`/issues/create?projectId=${project.id}`)}
              />
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesList.map((issue) => (
                      <tr key={issue.id}>
                        <td style={{ fontWeight: 600 }}>
                          <Link to={`/issues/${issue.id}`} style={{ color: 'var(--primary-600)' }}>
                            {issue.issueKey}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 500, maxWidth: '300px' }}>
                          <Link to={`/issues/${issue.id}`} style={{ color: 'inherit' }}>
                            {issue.title}
                          </Link>
                        </td>
                        <td>
                          <PriorityBadge priority={issue.priority} />
                        </td>
                        <td>
                          <StatusBadge status={issue.status} />
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {issue.assigneeName || (
                            <span style={{ fontStyle: 'italic', color: 'var(--slate-400)' }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          {formatDate(issue.createdAt)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/issues/${issue.id}`}>
                            <Button variant="secondary" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>

          {issuesData && (
            <Pagination
              pageNumber={issuesData.pageNumber}
              totalPages={issuesData.totalPages}
              totalElements={issuesData.totalElements}
              pageSize={issuesData.pageSize}
              onPageChange={(p) => setIssuesPage(p)}
            />
          )}
        </Card>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <Card>
          <CardHeader
            title={`Assigned Members (${members.length})`}
            action={
              canManageProject && (
                <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenAddMember}>
                  Add Member
                </Button>
              )
            }
          />
          <CardBody style={{ padding: 0 }}>
            {loadingMembers ? (
              <TableSkeleton rows={4} cols={4} />
            ) : members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members assigned"
                description="This project does not have any team members assigned yet."
                actionText={canManageProject ? 'Add First Member' : undefined}
                onAction={canManageProject ? handleOpenAddMember : undefined}
              />
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>System Role</th>
                      <th>Joined Date</th>
                      {canManageProject && <th style={{ textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td style={{ fontWeight: 600 }}>{member.userName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{member.userEmail}</td>
                        <td>
                          <RoleBadge role={member.userRole} />
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          {formatDate(member.joinedAt)}
                        </td>
                        {canManageProject && (
                          <td style={{ textAlign: 'right' }}>
                            {member.userRole !== 'PROJECT_MANAGER' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRemoveMemberTarget(member)}
                                style={{ color: 'var(--danger-solid)' }}
                              >
                                Remove
                              </Button>
                            ) : (
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Project Manager
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 3: OPERATIONAL DASHBOARD */}
      {activeTab === 'analytics' && canManageProject && (
        <div>
          {loadingDashboard ? (
            <div className="grid-cols-auto">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : dashboardMetrics ? (
            <>
              <div className="grid-cols-auto" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-card-title">Total Issues</div>
                  <div className="stat-card-value">{dashboardMetrics.totalIssues}</div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                    <CheckSquare size={20} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-title">Pending Work</div>
                  <div className="stat-card-value">{dashboardMetrics.pendingWorkCount}</div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
                    <Clock size={20} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-title">Urgent Active</div>
                  <div className="stat-card-value">
                    {dashboardMetrics.highPriorityActiveCount + dashboardMetrics.criticalPriorityActiveCount}
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-solid)' }}>
                    <AlertTriangle size={20} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-title">Unassigned Active</div>
                  <div className="stat-card-value">{dashboardMetrics.unassignedActiveCount}</div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-solid)' }}>
                    <Users size={20} />
                  </div>
                </div>
              </div>

              {/* Workload Breakdown */}
              <Card>
                <CardHeader title="Current Member Workload" />
                <CardBody style={{ padding: 0 }}>
                  <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Email</th>
                          <th style={{ textAlign: 'center' }}>Open</th>
                          <th style={{ textAlign: 'center' }}>In Progress</th>
                          <th style={{ textAlign: 'center' }}>Resolved</th>
                          <th style={{ textAlign: 'center' }}>Closed</th>
                          <th style={{ textAlign: 'center' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardMetrics.memberWorkloads?.map((mw) => (
                          <tr key={mw.employeeId}>
                            <td style={{ fontWeight: 600 }}>{mw.employeeName}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{mw.employeeEmail}</td>
                            <td style={{ textAlign: 'center', color: 'var(--status-open-text)', fontWeight: 600 }}>{mw.openCount}</td>
                            <td style={{ textAlign: 'center', color: 'var(--status-progress-text)', fontWeight: 600 }}>{mw.inProgressCount}</td>
                            <td style={{ textAlign: 'center' }}>{mw.resolvedCount}</td>
                            <td style={{ textAlign: 'center' }}>{mw.closedCount}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{mw.totalAssignedCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Add Member Modal */}
      {addMemberModalOpen && (
        <Modal
          isOpen={addMemberModalOpen}
          onClose={() => setAddMemberModalOpen(false)}
          title="Add Project Member"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAddMemberModalOpen(false)} disabled={addingMember}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAddMember}
                loading={addingMember}
                disabled={!selectedEmployeeId}
              >
                Add Member
              </Button>
            </>
          }
        >
          <form onSubmit={handleConfirmAddMember}>
            <div className="form-group">
              <label className="form-label" htmlFor="member-select">Select Active Employee</label>
              {eligibleEmployees.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  All active eligible employees are already members of this project.
                </div>
              ) : (
                <select
                  id="member-select"
                  className="form-control"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  disabled={addingMember}
                  required
                >
                  {eligibleEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Remove Member Confirmation */}
      {removeMemberTarget && (
        <ConfirmDialog
          isOpen={!!removeMemberTarget}
          onClose={() => setRemoveMemberTarget(null)}
          onConfirm={handleConfirmRemoveMember}
          title="Remove Project Member"
          message={`Are you sure you want to remove ${removeMemberTarget.userName} from this project? As per system rules, any OPEN and IN_PROGRESS issues assigned to them will be automatically unassigned.`}
          confirmText="Remove Member"
          loading={removingMember}
        />
      )}

      {/* Archive Project Confirmation */}
      {archiveDialogOpen && (
        <ConfirmDialog
          isOpen={archiveDialogOpen}
          onClose={() => setArchiveDialogOpen(false)}
          onConfirm={handleArchiveProject}
          title="Archive Project"
          message={`Are you sure you want to archive project "${project.name}" (${project.projectKey})? Users will no longer be able to create new issues in this project.`}
          confirmText="Archive Project"
          loading={archiving}
        />
      )}

      {/* Edit Project Modal */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Project Details"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit} loading={savingEdit}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">Project Name</label>
              <input
                id="edit-name"
                type="text"
                className="form-control"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={savingEdit}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-desc">Description</label>
              <textarea
                id="edit-desc"
                className="form-control"
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                disabled={savingEdit}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
