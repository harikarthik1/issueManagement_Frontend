import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { issueApi } from '../../api/issueApi';
import { commentApi } from '../../api/commentApi';
import { projectApi } from '../../api/projectApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Role, IssueStatus, IssuePriority, IssueType, VALID_STATUS_TRANSITIONS } from '../../utils/constants';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StatusBadge, PriorityBadge, TypeBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { formatDate, formatRelativeTime, formatStatus } from '../../utils/formatters';
import {
  FolderGit2,
  History,
  MessageSquare,
  Edit,
  RotateCcw,
  Trash2,
  Send,
  BotMessageSquare,
  ShieldAlert,
} from 'lucide-react';

export function IssueDetailPage() {
  const { issueId } = useParams();
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comments
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Workflow & Assignment
  const [transitioningStatus, setTransitioningStatus] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Reopen Modal
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: '', type: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Archive Modal
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // 1. Fetch Issue Details
  const fetchIssue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await issueApi.getIssueById(issueId);
      setIssue(data);
      setEditForm({
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        type: data.type,
      });
    } catch (err) {
      setError(err.message || 'Failed to load issue details');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  // 2. Fetch Comments
  const fetchComments = useCallback(async () => {
    if (!issueId) return;
    setLoadingComments(true);
    try {
      const data = await commentApi.getCommentsForIssue(issueId);
      setComments(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  }, [issueId]);

  // 3. Fetch History
  const fetchHistory = useCallback(async () => {
    if (!issueId) return;
    setLoadingHistory(true);
    try {
      const data = await issueApi.getIssueHistory(issueId);
      setHistory(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, [issueId]);

  // 4. Fetch Project Members for Assignment
  const fetchMembers = useCallback(async (projId) => {
    if (!projId) return;
    try {
      const data = await projectApi.getProjectMembers(projId);
      setProjectMembers(data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchIssue();
    fetchComments();
    fetchHistory();
  }, [fetchIssue, fetchComments, fetchHistory]);

  useEffect(() => {
    if (issue?.projectId) {
      fetchMembers(issue.projectId);
    }
  }, [issue?.projectId, fetchMembers]);

  // Transition Status
  const handleTransitionStatus = async (nextStatus) => {
    setTransitioningStatus(true);
    try {
      const updated = await issueApi.transitionStatus(issueId, nextStatus);
      setIssue(updated);
      success(`Issue transitioned to ${formatStatus(nextStatus)}`);
      fetchHistory();
    } catch (err) {
      toastError(err.message || 'Status transition failed');
    } finally {
      setTransitioningStatus(false);
    }
  };

  // Reopen Issue
  const handleReopenIssue = async (e) => {
    e.preventDefault();
    setReopening(true);
    try {
      const updated = await issueApi.reopenIssue(issueId, reopenReason.trim() || undefined);
      setIssue(updated);
      success('Issue reopened to OPEN');
      setReopenModalOpen(false);
      setReopenReason('');
      fetchComments();
      fetchHistory();
    } catch (err) {
      toastError(err.message || 'Failed to reopen issue');
    } finally {
      setReopening(false);
    }
  };

  // Assign Issue
  const handleAssignIssue = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const targetId = selectedAssigneeId ? Number(selectedAssigneeId) : null;
      const updated = await issueApi.assignIssue(issueId, targetId);
      setIssue(updated);
      success(targetId ? 'Issue assigned successfully' : 'Issue unassigned');
      setAssigneeModalOpen(false);
      fetchHistory();
    } catch (err) {
      toastError(err.message || 'Failed to update assignee');
    } finally {
      setAssigning(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await commentApi.addComment(issueId, newComment.trim());
      setNewComment('');
      success('Comment added');
      fetchComments();
    } catch (err) {
      toastError(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;
    try {
      await commentApi.deleteComment(deleteCommentId);
      success('Comment deleted');
      setDeleteCommentId(null);
      fetchComments();
    } catch (err) {
      toastError(err.message || 'Failed to delete comment');
    }
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await issueApi.updateIssue(issueId, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        type: editForm.type,
        priority: editForm.priority,
      });
      setIssue(updated);
      success('Issue updated successfully');
      setEditModalOpen(false);
      fetchHistory();
    } catch (err) {
      toastError(err.message || 'Failed to update issue');
    } finally {
      setSavingEdit(false);
    }
  };

  // Archive
  const handleArchiveIssue = async () => {
    setArchiving(true);
    try {
      await issueApi.archiveIssue(issueId);
      success('Issue archived successfully');
      navigate(`/projects/${issue.projectId}`);
    } catch (err) {
      toastError(err.message || 'Failed to archive issue');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <CardSkeleton />
        <div style={{ marginTop: '1.5rem' }}>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
        <ShieldAlert size={36} color="var(--danger-solid)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Issue Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || 'This issue does not exist or you lack permission to view it.'}
        </p>
        <Link to="/issues">
          <Button variant="secondary">Return to Issues List</Button>
        </Link>
      </Card>
    );
  }

  const validNextStatuses = VALID_STATUS_TRANSITIONS[issue.status] || [];
  const canAssign = role === Role.ADMIN || role === Role.PROJECT_MANAGER;
  const canArchive = role === Role.ADMIN || role === Role.PROJECT_MANAGER;
  const canEdit =
    role === Role.ADMIN ||
    role === Role.PROJECT_MANAGER ||
    issue.reporterId === user?.id ||
    issue.assigneeId === user?.id;

  return (
    <div>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <Link
                to={`/projects/${issue.projectId}`}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <FolderGit2 size={15} />
                <span>{issue.projectName || issue.projectKey}</span>
              </Link>
              <span style={{ color: 'var(--slate-300)' }}>/</span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--primary-700)',
                  backgroundColor: 'var(--primary-50)',
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {issue.issueKey}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <TypeBadge type={issue.type} />
            </div>

            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {issue.title}
            </h1>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canEdit && (
              <Button variant="secondary" size="sm" icon={Edit} onClick={() => setEditModalOpen(true)}>
                Edit Details
              </Button>
            )}

            <Link to={`/assistant?q=Explain+issue+${issue.issueKey}`}>
              <Button variant="secondary" size="sm" icon={BotMessageSquare}>
                Investigate with AI
              </Button>
            </Link>

            {/* Status Workflow Actions */}
            {issue.status === IssueStatus.CLOSED ? (
              <Button
                variant="primary"
                size="sm"
                icon={RotateCcw}
                onClick={() => setReopenModalOpen(true)}
              >
                Reopen Issue
              </Button>
            ) : (
              validNextStatuses.map((st) => (
                <Button
                  key={st}
                  variant={st === IssueStatus.RESOLVED ? 'primary' : 'secondary'}
                  size="sm"
                  loading={transitioningStatus}
                  onClick={() => handleTransitionStatus(st)}
                >
                  Mark as {formatStatus(st)}
                </Button>
              ))
            )}

            {canArchive && !issue.archived && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => setArchiveDialogOpen(true)}
                style={{ color: 'var(--danger-solid)' }}
              >
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details / Comments vs Metadata Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Description + Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Description Card */}
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              {issue.description ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {issue.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  No description provided for this issue.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Comments Card */}
          <Card>
            <CardHeader
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} />
                  <span>Discussion & Comments ({comments.length})</span>
                </div>
              }
            />
            <CardBody style={{ padding: '1.25rem' }}>
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add a comment or technical note..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submittingComment}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={Send}
                    loading={submittingComment}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              {loadingComments ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading comments...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No comments yet. Start the conversation!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {comments.map((comment) => {
                    const isAuthor = comment.authorId === user?.id;
                    const canDelete = isAuthor || role === Role.ADMIN || role === Role.PROJECT_MANAGER;

                    return (
                      <div
                        key={comment.id}
                        style={{
                          padding: '1rem',
                          backgroundColor: 'var(--slate-50)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary-600)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {comment.authorName}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                          </div>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteCommentId(comment.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--slate-400)',
                                padding: '2px',
                              }}
                              title="Delete comment"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: '0.9375rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {comment.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Metadata & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Attributes Card */}
          <Card>
            <CardHeader title="Attributes" />
            <CardBody style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Assignee
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>
                      {issue.assigneeName || <span style={{ fontStyle: 'italic', color: 'var(--slate-400)' }}>Unassigned</span>}
                    </span>
                    {canAssign && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssigneeId(issue.assigneeId ? issue.assigneeId.toString() : '');
                          setAssigneeModalOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary-600)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Reporter
                  </div>
                  <div style={{ fontWeight: 600 }}>{issue.reporterName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{issue.reporterEmail}</div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Project
                  </div>
                  <Link to={`/projects/${issue.projectId}`} style={{ fontWeight: 600 }}>
                    {issue.projectName} ({issue.projectKey})
                  </Link>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Created
                  </div>
                  <div>{formatDate(issue.createdAt)}</div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Last Updated
                  </div>
                  <div>{formatDate(issue.updatedAt)}</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* History Timeline Card */}
          <Card>
            <CardHeader
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} />
                  <span>Activity History</span>
                </div>
              }
            />
            <CardBody style={{ padding: '1rem 1.25rem' }}>
              {loadingHistory ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading activity...</div>
              ) : history.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No history recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid var(--slate-100)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{h.actorName}</span>
                        <span>{formatRelativeTime(h.createdAt)}</span>
                      </div>
                      <div>
                        {h.changeType === 'CREATED' && <span>Created this issue</span>}
                        {h.changeType === 'STATUS_CHANGED' && (
                          <span>
                            Changed status from <strong>{h.oldValue || '—'}</strong> to <strong>{h.newValue}</strong>
                          </span>
                        )}
                        {h.changeType === 'PRIORITY_CHANGED' && (
                          <span>
                            Changed priority from <strong>{h.oldValue || '—'}</strong> to <strong>{h.newValue}</strong>
                          </span>
                        )}
                        {h.changeType === 'ASSIGNEE_CHANGED' && (
                          <span>
                            Changed assignee to <strong>{h.newValue || 'Unassigned'}</strong>
                          </span>
                        )}
                        {h.changeType === 'UPDATED' && (
                          <span>
                            Updated {h.fieldName || 'issue details'}
                          </span>
                        )}
                        {h.changeType === 'ARCHIVED' && <span>Archived this issue</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Assignee Modal */}
      {assigneeModalOpen && (
        <Modal
          isOpen={assigneeModalOpen}
          onClose={() => setAssigneeModalOpen(false)}
          title="Assign Issue"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAssigneeModalOpen(false)} disabled={assigning}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAssignIssue} loading={assigning}>
                Save Assignment
              </Button>
            </>
          }
        >
          <form onSubmit={handleAssignIssue}>
            <div className="form-group">
              <label className="form-label" htmlFor="assignee-select">Assign to Project Member</label>
              <select
                id="assignee-select"
                className="form-control"
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                disabled={assigning}
              >
                <option value="">Unassigned (None)</option>
                {projectMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName} ({m.userEmail}) {m.userRole === 'PROJECT_MANAGER' ? '- Project Manager' : ''}
                  </option>
                ))}
              </select>
              <div className="form-hint">Assigned project manager and active project members can be assigned issues.</div>
            </div>
          </form>
        </Modal>
      )}

      {/* Reopen Modal */}
      {reopenModalOpen && (
        <Modal
          isOpen={reopenModalOpen}
          onClose={() => setReopenModalOpen(false)}
          title="Reopen Issue"
          footer={
            <>
              <Button variant="secondary" onClick={() => setReopenModalOpen(false)} disabled={reopening}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleReopenIssue} loading={reopening}>
                Reopen to OPEN
              </Button>
            </>
          }
        >
          <form onSubmit={handleReopenIssue}>
            <div className="form-group">
              <label className="form-label" htmlFor="reopen-reason">Reason for Reopening (Optional)</label>
              <textarea
                id="reopen-reason"
                className="form-control"
                rows={3}
                placeholder="Explain why this issue is being reopened (e.g. verified still reproducible)..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                disabled={reopening}
              />
              <div className="form-hint">This note will be automatically added as a comment and history record.</div>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Details Modal */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Issue Details"
          size="lg"
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
              <label className="form-label" htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                type="text"
                className="form-control"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                disabled={savingEdit}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-type">Type</label>
                <select
                  id="edit-type"
                  className="form-control"
                  value={editForm.type}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                  disabled={savingEdit}
                >
                  {Object.values(IssueType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-priority">Priority</label>
                <select
                  id="edit-priority"
                  className="form-control"
                  value={editForm.priority}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}
                  disabled={savingEdit}
                >
                  {Object.values(IssuePriority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-description">Description (Markdown supported)</label>
              <textarea
                id="edit-description"
                className="form-control"
                rows={6}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                disabled={savingEdit}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Comment Confirm Dialog */}
      {deleteCommentId && (
        <ConfirmDialog
          isOpen={!!deleteCommentId}
          onClose={() => setDeleteCommentId(null)}
          onConfirm={handleDeleteComment}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirmText="Delete"
        />
      )}

      {/* Archive Issue Confirm Dialog */}
      {archiveDialogOpen && (
        <ConfirmDialog
          isOpen={archiveDialogOpen}
          onClose={() => setArchiveDialogOpen(false)}
          onConfirm={handleArchiveIssue}
          title="Archive Issue"
          message={`Are you sure you want to archive issue ${issue.issueKey}? It will be removed from active lists.`}
          confirmText="Archive"
          loading={archiving}
        />
      )}
    </div>
  );
}
