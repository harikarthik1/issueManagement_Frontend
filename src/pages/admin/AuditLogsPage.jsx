import { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../../api/auditApi';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { ShieldCheck, Filter } from 'lucide-react';

export function AuditLogsPage() {
  const { error: toastError } = useToast();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditApi.getAuditLogs({
        entityType: entityTypeFilter || undefined,
        page,
        size: 20,
      });
      setAuditData(data);
    } catch (err) {
      toastError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [entityTypeFilter, page, toastError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logs = auditData?.content || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Immutable administrative audit trail and security event logs</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Filter size={16} />
              <select
                className="form-control"
                style={{ width: 'auto', height: '36px', fontSize: '0.8125rem' }}
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Project">Project</option>
                <option value="ProjectMember">Project Member</option>
                <option value="Issue">Issue</option>
              </select>
            </div>
          }
          action={
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total events: <strong>{auditData?.totalElements || logs.length}</strong>
            </div>
          }
        />

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No audit events found"
              description="No administrative activity has been logged for the selected filter."
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Entity Type</th>
                    <th>Entity ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--slate-100)',
                            color: 'var(--slate-800)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{log.actorEmail || 'System'}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>{log.entityType}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          #{log.entityId}
                        </span>
                      </td>
                      <td style={{ maxWidth: '360px', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {auditData && (
          <Pagination
            pageNumber={auditData.pageNumber}
            totalPages={auditData.totalPages}
            totalElements={auditData.totalElements}
            pageSize={auditData.pageSize}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </Card>
    </div>
  );
}
