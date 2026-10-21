import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';
import { issueApi } from '../../api/issueApi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge, PriorityBadge, TypeBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { IssueStatus, IssuePriority, IssueType } from '../../utils/constants';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';

export function IssueListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [searchQuery, setSearchQuery] = useState('');

  const [issuesData, setIssuesData] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  // 1. Fetch Projects List
  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);
      try {
        const response = await projectApi.getProjects({ size: 100 });
        const list = response?.content || [];
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id.toString());
        }
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  // 2. Fetch Issues for Selected Project
  const fetchIssues = useCallback(async () => {
    if (!selectedProjectId) {
      setIssuesData(null);
      return;
    }
    setLoadingIssues(true);
    setError(null);
    try {
      const response = await issueApi.getProjectIssues(selectedProjectId, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        type: typeFilter || undefined,
        page,
        size: 15,
      });
      setIssuesData(response);
    } catch (err) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoadingIssues(false);
    }
  }, [selectedProjectId, statusFilter, priorityFilter, typeFilter, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setTypeFilter('');
    setSearchQuery('');
    setPage(0);
    setSearchParams(selectedProjectId ? { projectId: selectedProjectId } : {});
  };

  const issues = issuesData?.content || [];
  const filteredIssues = issues.filter((issue) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      issue.issueKey?.toLowerCase().includes(q) ||
      issue.title?.toLowerCase().includes(q) ||
      issue.assigneeName?.toLowerCase().includes(q) ||
      issue.reporterName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Issues</h1>
          <p className="page-subtitle">Track, filter, and triage project tickets</p>
        </div>

        <Link to={`/issues/create${selectedProjectId ? `?projectId=${selectedProjectId}` : ''}`}>
          <Button variant="primary" icon={Plus}>Create Issue</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Project Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
              <label htmlFor="issue-project-select" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Project:
              </label>
              <select
                id="issue-project-select"
                className="form-control"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setPage(0);
                  setSearchParams({ projectId: e.target.value });
                }}
                disabled={loadingProjects}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectKey})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
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
                placeholder="Search key, title, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                style={{ width: 'auto', height: '36px', fontSize: '0.8125rem' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              >
                <option value="">Status: All</option>
                {Object.values(IssueStatus).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: 'auto', height: '36px', fontSize: '0.8125rem' }}
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
              >
                <option value="">Priority: All</option>
                {Object.values(IssuePriority).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: 'auto', height: '36px', fontSize: '0.8125rem' }}
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              >
                <option value="">Type: All</option>
                {Object.values(IssueType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {(statusFilter || priorityFilter || typeFilter || searchQuery) && (
                <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} />
              <span>Issue List</span>
              <span className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)' }}>
                {issuesData?.totalElements || filteredIssues.length}
              </span>
            </div>
          }
        />
        <CardBody style={{ padding: 0 }}>
          {loadingIssues ? (
            <TableSkeleton rows={6} cols={7} />
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-solid)' }}>
              {error}
              <div style={{ marginTop: '0.75rem' }}>
                <Button variant="secondary" size="sm" onClick={fetchIssues}>Retry</Button>
              </div>
            </div>
          ) : filteredIssues.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title={searchQuery || statusFilter || priorityFilter || typeFilter ? 'No issues match criteria' : 'No issues found'}
              description={
                searchQuery || statusFilter || priorityFilter || typeFilter
                  ? 'Try adjusting your search query or filters to find issues.'
                  : 'There are no active issues in this project yet.'
              }
              actionText="Create Issue"
              onAction={() => {}}
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Reporter</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/issues/${issue.id}`} style={{ color: 'var(--primary-600)' }}>
                          {issue.issueKey}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: '280px' }}>
                        <Link to={`/issues/${issue.id}`} style={{ color: 'inherit' }}>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {issue.title}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <TypeBadge type={issue.type} />
                      </td>
                      <td>
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td>
                        <StatusBadge status={issue.status} />
                      </td>
                      <td>
                        {issue.assigneeName ? (
                          <span style={{ fontSize: '0.8125rem' }}>{issue.assigneeName}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {issue.reporterName || '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {formatDate(issue.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/issues/${issue.id}`}>
                          <Button variant="secondary" size="sm" icon={ExternalLink}>View</Button>
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
            onPageChange={(p) => setPage(p)}
          />
        )}
      </Card>
    </div>
  );
}
