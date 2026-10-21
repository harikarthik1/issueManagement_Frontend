import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AssistantPage } from '../pages/assistant/AssistantPage';
import { assistantApi } from '../api/assistantApi';

vi.mock('../api/assistantApi', () => ({
  assistantApi: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    deleteConversation: vi.fn(),
    clearSession: vi.fn(),
    getCacheMetrics: vi.fn(),
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast,
}));

describe('Centralized AI Assistant Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup: scrollIntoView is not implemented in jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders conversations list and sends messages displaying structured issue references and cache indicator', async () => {
    assistantApi.listConversations.mockResolvedValue([
      {
        id: 'conv-abc-123',
        title: 'Authentication investigation',
        updatedAt: new Date().toISOString(),
        messageCount: 2,
      },
    ]);

    assistantApi.getMessages.mockResolvedValue([
      {
        role: 'user',
        content: 'Why did PROJ-101 fail?',
        timestamp: new Date().toISOString(),
        referencedIssueKeys: [],
      },
      {
        role: 'assistant',
        content: 'PROJ-101 failed because the payment webhook timed out after 3 retries.',
        referencedIssueKeys: ['PROJ-101'],
        cached: true,
        timestamp: new Date().toISOString(),
      },
    ]);

    render(
      <BrowserRouter>
        <AssistantPage />
      </BrowserRouter>
    );

    // Verify conversation listed
    await waitFor(() => {
      expect(screen.getAllByText('Authentication investigation').length).toBeGreaterThanOrEqual(1);
    });

    // Verify messages loaded
    await waitFor(() => {
      expect(screen.getByText('Why did PROJ-101 fail?')).toBeInTheDocument();
      expect(screen.getByText(/timed out after 3 retries/i)).toBeInTheDocument();
      expect(screen.getByText('PROJ-101')).toBeInTheDocument();
      expect(screen.getByText('Cached')).toBeInTheDocument();
    });

    // Send a new follow-up message
    assistantApi.sendMessage.mockResolvedValueOnce({
      conversationId: 'conv-abc-123',
      answer: 'The resolution was adding an exponential backoff retry in PROJ-105.',
      referencedIssueKeys: ['PROJ-105'],
      cached: false,
      timestamp: new Date().toISOString(),
    });

    const input = screen.getByPlaceholderText(/Ask about project issues/i);
    fireEvent.change(input, { target: { value: 'What was the fix?' } });

    const form = screen.getByRole('button', { name: /Send message/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(assistantApi.sendMessage).toHaveBeenCalled();
    });
    expect(assistantApi.sendMessage).toHaveBeenCalledWith('conv-abc-123', 'What was the fix?');

    await waitFor(() => {
      expect(screen.getByText(/exponential backoff retry/i)).toBeInTheDocument();
      expect(screen.getByText('PROJ-105')).toBeInTheDocument();
    });
  });
});
