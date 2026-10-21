import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../utils/constants';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { CreateProjectModal } from './CreateProjectModal';
import { formatDate } from '../../utils/formatters';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
} from 'lucide-react';

export function ProjectListPage() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projectsData, setProjectsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.getProjects({ page, size: 15 });
      setProjectsData(response);
    } catch (err) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && role === Role.ADMIN) {
      setCreateModalOpen(true);
      // clean query param
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, role]);

  const projects = projectsData?.content || [];
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.projectKey?.toLowerCase().includes(q) ||
      p.managerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {role === Role.ADMIN
              ? 'All organizational projects and management scopes'
              : role === Role.PROJECT_MANAGER
              ? 'Projects you currently manage'
              : 'Projects you are an active member of'}
          </p>
        </div>

        {role === Role.ADMIN && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Project
          </Button>
        )}
      </div>

      <Card>
        <CardHeader
          title={
            <div style={{ position: 'relative', width: '280px' }}>
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
                placeholder="Search by name, key, or PM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          }
          action={
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total: <strong>{projectsData?.totalElements || projects.length}</strong>
            </div>
          }
        />

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-solid)' }}>
              {error}
              <div style={{ marginTop: '0.75rem' }}>
                <Button variant="secondary" size="sm" onClick={fetchProjects}>Retry</Button>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title={searchQuery ? 'No matching projects' : 'No projects available'}
              description={
                searchQuery
                  ? `No projects matched "${searchQuery}".`
                  : 'You do not have access to any projects at this time.'
              }
              actionText={role === Role.ADMIN && !searchQuery ? 'Create First Project' : undefined}
              onAction={role === Role.ADMIN ? () => setCreateModalOpen(true) : undefined}
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Project Name</th>
                    <th>Project Manager</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <Link
                          to={`/projects/${project.id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--primary-600)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {project.projectKey}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <Link to={`/projects/${project.id}`} style={{ color: 'inherit' }}>
                          {project.name}
                        </Link>
                        {project.description && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              fontWeight: 400,
                              maxWidth: '360px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                            }}
                          >
                            {project.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
                          {project.managerName || 'Unassigned'}
                        </span>
                        {project.managerEmail && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {project.managerEmail}
                          </div>
                        )}
                      </td>
                      <td>
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
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {formatDate(project.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/projects/${project.id}`}>
                          <Button variant="secondary" size="sm" icon={ExternalLink}>
                            Open
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {projectsData && (
          <Pagination
            pageNumber={projectsData.pageNumber}
            totalPages={projectsData.totalPages}
            totalElements={projectsData.totalElements}
            pageSize={projectsData.pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </Card>

      {createModalOpen && (
        <CreateProjectModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onProjectCreated={() => {
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
