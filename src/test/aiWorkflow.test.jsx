import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreateIssuePage } from '../pages/issues/CreateIssuePage';
import { projectApi } from '../api/projectApi';
import { aiIssueApi } from '../api/aiIssueApi';
import { issueApi } from '../api/issueApi';
import { IssuePriority, IssueType } from '../utils/constants';

vi.mock('../api/projectApi', () => ({
  projectApi: {
    getProjects: vi.fn(),
    getProjectMembers: vi.fn(),
  },
}));

vi.mock('../api/aiIssueApi', () => ({
  aiIssueApi: {
    searchSimilarIssues: vi.fn(),
    draftIssue: vi.fn(),
  },
}));

vi.mock('../api/issueApi', () => ({
  issueApi: {
    createIssue: vi.fn(),
  },
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('AI-Assisted Issue Creation Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectApi.getProjects.mockResolvedValue({
      content: [
        { id: 10, name: 'Core Billing', projectKey: 'BILL' },
      ],
      totalElements: 1,
    });
    projectApi.getProjectMembers.mockResolvedValue([]);
  });

  it('progresses through describe -> deduplication -> AI draft -> user edit -> confirmed creation', async () => {
    // 1. Mock similar search results
    aiIssueApi.searchSimilarIssues.mockResolvedValueOnce([
      {
        issueId: 101,
        issueKey: 'BILL-101',
        title: 'Payment gateway timeout on checkout',
        status: 'RESOLVED',
        priority: 'CRITICAL',
        similarityScore: 0.88,
      },
    ]);

    // 2. Mock AI draft response
    aiIssueApi.draftIssue.mockResolvedValueOnce({
      title: 'Stripe webhook timeout during checkout callback',
      description: '**Problem Summary**\nWebhook retries exhausted\n\n**Expected Behavior**\nCallback processed within 2s',
      type: IssueType.BUG,
      priority: IssuePriority.CRITICAL,
    });

    // 3. Mock final create issue
    issueApi.createIssue.mockResolvedValueOnce({
      id: 205,
      issueKey: 'BILL-205',
      title: 'Stripe webhook timeout during checkout callback (User Edited)',
      projectName: 'Core Billing',
      projectId: 10,
    });

    render(
      <BrowserRouter>
        <CreateIssuePage />
      </BrowserRouter>
    );

    // Wait for project select to load
    await waitFor(() => {
      expect(screen.getByText('Core Billing (BILL)')).toBeInTheDocument();
    });

    // Step 1: Input description and submit
    const textarea = screen.getByLabelText(/Natural Language Problem Statement/i);
    fireEvent.change(textarea, {
      target: { value: 'Customer payments are failing intermittently with gateway timeout error' },
    });

    const searchBtn = screen.getByRole('button', { name: /Search for Similar Issues/i });
    fireEvent.click(searchBtn);

    // Step 2: Review matches
    await waitFor(() => {
      expect(aiIssueApi.searchSimilarIssues).toHaveBeenCalledWith(
        10,
        'Customer payments are failing intermittently with gateway timeout error'
      );
      expect(screen.getByText('BILL-101')).toBeInTheDocument();
      expect(screen.getByText('Similarity: 0.88')).toBeInTheDocument();
      expect(screen.getByText(/Potential duplicates found/i)).toBeInTheDocument();
    });

    // User chooses to draft with AI
    const draftBtn = screen.getByRole('button', { name: /Draft with AI/i });
    fireEvent.click(draftBtn);

    // Step 3: Review & Edit AI Suggestions
    await waitFor(() => {
      expect(aiIssueApi.draftIssue).toHaveBeenCalledWith(
        10,
        'Customer payments are failing intermittently with gateway timeout error'
      );
      expect(screen.getByDisplayValue('Stripe webhook timeout during checkout callback')).toBeInTheDocument();
    });

    // Verify user can edit the proposed title
    const titleInput = screen.getByLabelText(/Issue Title/i);
    fireEvent.change(titleInput, {
      target: { value: 'Stripe webhook timeout during checkout callback (User Edited)' },
    });

    // Step 4: Confirm and Create
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Create Issue/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(issueApi.createIssue).toHaveBeenCalledWith(10, {
        title: 'Stripe webhook timeout during checkout callback (User Edited)',
        description: '**Problem Summary**\nWebhook retries exhausted\n\n**Expected Behavior**\nCallback processed within 2s',
        type: IssueType.BUG,
        priority: IssuePriority.CRITICAL,
        assigneeId: undefined,
      });

      expect(screen.getByText(/Issue Created Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText('BILL-205')).toBeInTheDocument();
    });
  });
});
