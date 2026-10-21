import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';
import { aiIssueApi } from '../../api/aiIssueApi';
import { issueApi } from '../../api/issueApi';
import { useToast } from '../../context/ToastContext';
import { IssuePriority, IssueType } from '../../utils/constants';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ExternalLink,
  Sliders,
  ChevronRight,
  ArrowLeft,
  FileText,
  Check,
} from 'lucide-react';

export function CreateIssuePage() {
  const [searchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Workflow Steps:
  // 1: DESCRIBE (select project & describe problem)
  // 2: SIMILAR_SEARCH (searching / reviewing matches)
  // 3: REVIEW_DRAFT (editing AI suggested title, desc, type, priority)
  // 4: CONFIRMED (successfully created)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State: Project & Problem Description
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || '');
  const [problemDescription, setProblemDescription] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);

  // Step 2 State: Similar Issues
  const [searchingSimilar, setSearchingSimilar] = useState(false);
  const [similarIssues, setSimilarIssues] = useState([]);

  // Step 3 State: Draft & Review
  const [draftingAi, setDraftingAi] = useState(false);
  const [draftForm, setDraftForm] = useState({
    title: '',
    description: '',
    type: IssueType.BUG,
    priority: IssuePriority.MEDIUM,
    assigneeId: '',
  });
  const [projectMembers, setProjectMembers] = useState([]);

  // Step 4 State: Final Created Issue
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [createdIssue, setCreatedIssue] = useState(null);

  // Load Projects on mount
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
        toastError(err.message || 'Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [selectedProjectId, toastError]);

  // Load Project Members when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      projectApi.getProjectMembers(selectedProjectId)
        .then((members) => setProjectMembers(members || []))
        .catch(() => setProjectMembers([]));
    }
  }, [selectedProjectId]);

  // Handle Search for Similar Issues
  const handleSearchSimilar = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProjectId) {
      toastError('Please select a project');
      return;
    }
    if (!problemDescription.trim() || problemDescription.trim().length < 10) {
      toastError('Please provide a detailed description (at least 10 characters)');
      return;
    }

    setSearchingSimilar(true);
    try {
      const results = await aiIssueApi.searchSimilarIssues(Number(selectedProjectId), problemDescription.trim());
      setSimilarIssues(results || []);
      setCurrentStep(2);
    } catch (err) {
      toastError(err.message || 'Similar issue search failed');
      // If vector search fails, still allow proceeding to draft
      setCurrentStep(2);
    } finally {
      setSearchingSimilar(false);
    }
  };

  // Handle AI Drafting
  const handleGenerateDraft = async () => {
    setDraftingAi(true);
    try {
      const draft = await aiIssueApi.draftIssue(Number(selectedProjectId), problemDescription.trim());
      setDraftForm({
        title: draft.title || '',
        description: draft.description || problemDescription,
        type: draft.type || IssueType.BUG,
        priority: draft.priority || IssuePriority.MEDIUM,
        assigneeId: '',
      });
      setCurrentStep(3);
    } catch (err) {
      toastError(err.message || 'AI drafting failed. You can fill the fields manually.');
      // Fallback manual draft
      setDraftForm({
        title: problemDescription.slice(0, 60),
        description: problemDescription,
        type: IssueType.BUG,
        priority: IssuePriority.MEDIUM,
        assigneeId: '',
      });
      setCurrentStep(3);
    } finally {
      setDraftingAi(false);
    }
  };

  // Handle Final Confirmed Creation
  const handleConfirmCreate = async (e) => {
    e.preventDefault();
    if (!draftForm.title.trim()) {
      toastError('Issue title is required');
      return;
    }

    setSubmittingIssue(true);
    try {
      const payload = {
        title: draftForm.title.trim(),
        description: draftForm.description.trim() || undefined,
        type: draftForm.type,
        priority: draftForm.priority,
        assigneeId: draftForm.assigneeId ? Number(draftForm.assigneeId) : undefined,
      };

      const result = await issueApi.createIssue(Number(selectedProjectId), payload);
      setCreatedIssue(result);
      success(`Issue ${result.issueKey} created successfully!`);
      setCurrentStep(4);
    } catch (err) {
      toastError(err.message || 'Failed to create issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Filter similar issues by user slider threshold locally if desired
  const displaySimilarIssues = similarIssues.filter((item) => {
    if (similarityThreshold > 0) {
      return item.similarityScore >= similarityThreshold;
    }
    return true;
  });

  const selectedProjectObj = projects.find((p) => p.id === Number(selectedProjectId));

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Issue</h1>
          <p className="page-subtitle">
            AI-Assisted Issue Creation: Deduplication, Smart Drafting, and Human Confirmation
          </p>
        </div>
      </div>

      {/* Stepper Header */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep >= 1 ? 1 : 0.5 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentStep > 1 ? 'var(--success-solid)' : 'var(--primary-600)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            >
              {currentStep > 1 ? <Check size={16} /> : '1'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Describe Issue</span>
          </div>

          <ChevronRight size={16} color="var(--slate-400)" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep >= 2 ? 1 : 0.5 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentStep > 2 ? 'var(--success-solid)' : currentStep === 2 ? 'var(--primary-600)' : 'var(--slate-300)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            >
              {currentStep > 2 ? <Check size={16} /> : '2'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Check Duplicates</span>
          </div>

          <ChevronRight size={16} color="var(--slate-400)" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep >= 3 ? 1 : 0.5 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentStep > 3 ? 'var(--success-solid)' : currentStep === 3 ? 'var(--primary-600)' : 'var(--slate-300)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            >
              {currentStep > 3 ? <Check size={16} /> : '3'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>AI Draft & Edit</span>
          </div>

          <ChevronRight size={16} color="var(--slate-400)" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentStep >= 4 ? 1 : 0.5 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentStep === 4 ? 'var(--success-solid)' : 'var(--slate-300)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
              }}
            >
              4
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Confirmed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: DESCRIBE THE PROBLEM                                              */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <Card>
          <CardHeader title="Step 1: Select Project & Describe Issue" />
          <CardBody>
            <form onSubmit={handleSearchSimilar}>
              <div className="form-group">
                <label className="form-label" htmlFor="project-selector">Target Project</label>
                <select
                  id="project-selector"
                  className="form-control"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={loadingProjects}
                  required
                >
                  <option value="">Select an accessible project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectKey})
                    </option>
                  ))}
                </select>
                <div className="form-hint">
                  Similar issue search will be scoped to this project.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="problem-desc">
                  <span>Natural Language Problem Statement</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required</span>
                </label>
                <textarea
                  id="problem-desc"
                  className="form-control"
                  rows={6}
                  placeholder="Describe what happened, error messages observed, steps that led to the issue, and expected behavior..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  disabled={searchingSimilar}
                  required
                />
                <div className="form-hint">
                  Explain the problem naturally. The system will search Qdrant for semantic duplicates and draft structured ticket fields.
                </div>
              </div>

              {/* Similarity Threshold Controller */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Sliders size={16} />
                    <span>Semantic Similarity Filter Threshold</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    {similarityThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.95"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary-600)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>0.10 (Broad Matches)</span>
                  <span>0.50 (Default Backend Cutoff)</span>
                  <span>0.95 (Strict Match)</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={Search}
                  loading={searchingSimilar}
                  disabled={!problemDescription.trim() || !selectedProjectId}
                >
                  Search for Similar Issues
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REVIEW MATCHES & DEDUPLICATION                                    */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={18} />
                  <span>Step 2: Semantic Duplicate Check</span>
                </div>
              }
              action={
                <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setCurrentStep(1)}>
                  Back to Description
                </Button>
              }
            />
            <CardBody>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Project: <strong>{selectedProjectObj?.name}</strong> | Query: &quot;{problemDescription.slice(0, 100)}...&quot;
                </p>
              </div>

              {displaySimilarIssues.length > 0 ? (
                <>
                  <div
                    style={{
                      padding: '0.875rem 1.25rem',
                      backgroundColor: 'var(--warning-bg)',
                      border: '1px solid var(--warning-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--warning-text)',
                      fontSize: '0.875rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Potential duplicates found:</strong> These existing issues may be related to your problem. Please review them to avoid duplicate reporting.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {displaySimilarIssues.map((item) => (
                      <div
                        key={item.issueId || item.issueKey}
                        style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                              {item.issueKey}
                            </span>
                            <StatusBadge status={item.status} />
                            <PriorityBadge priority={item.priority} />
                            <span
                              className="badge"
                              style={{
                                backgroundColor: 'var(--slate-100)',
                                color: 'var(--slate-700)',
                                fontWeight: 600,
                              }}
                            >
                              Similarity: {item.similarityScore ? (item.similarityScore).toFixed(2) : '—'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.title}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Link to={`/issues/${item.issueId}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary" size="sm" icon={ExternalLink}>
                              Open in New Tab
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--success-text)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem', color: 'var(--success-solid)' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    No Similar Issues Found
                  </h3>
                  <p style={{ fontSize: '0.875rem' }}>
                    No duplicate tickets exceeded the similarity threshold in <strong>{selectedProjectObj?.name}</strong>. You are good to proceed with drafting!
                  </p>
                </div>
              )}

              {/* Navigation CTAs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                  Modify Problem Description
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  icon={Sparkles}
                  loading={draftingAi}
                  onClick={handleGenerateDraft}
                >
                  {displaySimilarIssues.length > 0 ? 'None of These Match — Draft with AI' : 'Draft Issue with AI'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW AND EDIT AI SUGGESTIONS                                   */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--primary-600)" />
                <span>Step 3: Review & Edit AI Suggestions</span>
              </div>
            }
            action={
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setCurrentStep(2)}>
                Back to Matches
              </Button>
            }
          />
          <CardBody>
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-800)',
                border: '1px solid var(--primary-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              The AI has proposed structured issue fields below. <strong>You have full control to edit</strong> the title, markdown description, type, priority, and assignment before final confirmation.
            </div>

            <form onSubmit={handleConfirmCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="draft-title">Issue Title</label>
                <input
                  id="draft-title"
                  type="text"
                  className="form-control"
                  value={draftForm.title}
                  onChange={(e) => setDraftForm((prev) => ({ ...prev, title: e.target.value }))}
                  disabled={submittingIssue}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="draft-type">Issue Type</label>
                  <select
                    id="draft-type"
                    className="form-control"
                    value={draftForm.type}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, type: e.target.value }))}
                    disabled={submittingIssue}
                  >
                    {Object.values(IssueType).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="draft-priority">Priority</label>
                  <select
                    id="draft-priority"
                    className="form-control"
                    value={draftForm.priority}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, priority: e.target.value }))}
                    disabled={submittingIssue}
                  >
                    {Object.values(IssuePriority).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="draft-assignee">Assignee (Optional)</label>
                  <select
                    id="draft-assignee"
                    className="form-control"
                    value={draftForm.assigneeId}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, assigneeId: e.target.value }))}
                    disabled={submittingIssue}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.userName} {m.userRole === 'PROJECT_MANAGER' ? '(Project Manager)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="draft-description">
                  <span>Structured Description (Markdown)</span>
                </label>
                <textarea
                  id="draft-description"
                  className="form-control"
                  rows={10}
                  value={draftForm.description}
                  onChange={(e) => setDraftForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={submittingIssue}
                />
                <div className="form-hint">Review Problem Summary, Steps to Reproduce, Expected vs Observed Behavior.</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={CheckCircle2}
                  loading={submittingIssue}
                >
                  Confirm & Create Issue
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SUCCESS CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {currentStep === 4 && createdIssue && (
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-solid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Issue Created Successfully!
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Ticket <strong style={{ color: 'var(--primary-600)' }}>{createdIssue.issueKey}</strong> has been registered in{' '}
            <strong>{createdIssue.projectName || selectedProjectObj?.name}</strong>.
          </p>

          <div style={{ display: 'inline-flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={`/issues/${createdIssue.id}`}>
              <Button variant="primary" size="lg" icon={FileText}>
                Open Issue {createdIssue.issueKey}
              </Button>
            </Link>

            <Link to={`/projects/${createdIssue.projectId}`}>
              <Button variant="secondary" size="lg" icon={FolderGit2}>
                View Project Board
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
