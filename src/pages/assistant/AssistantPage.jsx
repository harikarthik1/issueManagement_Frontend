import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { assistantApi } from '../../api/assistantApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CacheMetricsModal } from './CacheMetricsModal';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import {
  BotMessageSquare,
  Plus,
  Trash2,
  Send,
  Zap,
  Sparkles,
  ExternalLink,
  Cpu,
  Loader2,
  Menu,
  X,
} from 'lucide-react';

export function AssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState(searchParams.get('c') || null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [clearSessionConfirm, setClearSessionConfirm] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const skipFetchForIdRef = useRef(null);

  const toastErrorRef = useRef(toastError);
  useEffect(() => {
    toastErrorRef.current = toastError;
  });

  const setSearchParamsRef = useRef(setSearchParams);
  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Conversations List on mount
  const fetchConversations = useCallback(async (autoSelectFirst = false) => {
    setLoadingConversations(true);
    try {
      const data = await assistantApi.listConversations();
      const list = data || [];
      setConversations(list);

      if (autoSelectFirst && list.length > 0) {
        const initialId = list[0].id;
        setSelectedConversationId((prev) => prev || initialId);
        if (!searchParams.get('c')) {
          setSearchParamsRef.current({ c: initialId }, { replace: true });
        }
      } else if (list.length === 0) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      toastErrorRef.current?.(err.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // 2. Fetch Messages when selectedConversationId changes
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const data = await assistantApi.getMessages(convId);
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      toastErrorRef.current?.(err.message || 'Failed to load conversation messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      if (skipFetchForIdRef.current === selectedConversationId) {
        skipFetchForIdRef.current = null;
        return;
      }
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId, fetchMessages]);

  // Handle URL prefilled query (e.g. ?q=Explain+issue+PROJ-1)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setInputMessage(q);
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next, { replace: true });
      inputRef.current?.focus();
    }
  }, [searchParams, setSearchParams]);

  // Create New Conversation
  const handleCreateConversation = async (initialTitle) => {
    try {
      const created = await assistantApi.createConversation(initialTitle || 'New Conversation');
      await fetchConversations(false);
      setSelectedConversationId(created.id);
      setSearchParams({ c: created.id }, { replace: true });
      setMessages([]);
      setMobileSidebarOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      toastError(err.message || 'Failed to create conversation');
    }
  };

  // Select Conversation
  const handleSelectConversation = (convId) => {
    setSelectedConversationId(convId);
    setSearchParams({ c: convId });
    setMobileSidebarOpen(false);
  };

  // Delete Conversation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await assistantApi.deleteConversation(deleteConfirmId);
      success('Conversation deleted');
      setDeleteConfirmId(null);
      if (selectedConversationId === deleteConfirmId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
      fetchConversations(true);
    } catch (err) {
      toastError(err.message || 'Failed to delete conversation');
    }
  };

  // Clear Entire Session Conversations
  const handleConfirmClearSession = async () => {
    try {
      await assistantApi.clearSession();
      success('All session conversations cleared');
      setClearSessionConfirm(false);
      setSelectedConversationId(null);
      setMessages([]);
      setConversations([]);
    } catch (err) {
      toastError(err.message || 'Failed to clear session conversations');
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const msg = (typeof textToSend === 'string' ? textToSend : inputMessage).trim();
    if (!msg || sending) return;

    let activeConvId = selectedConversationId;

    // If no active conversation, create one first
    if (!activeConvId) {
      try {
        const titleSnippet = msg.length > 35 ? msg.slice(0, 32) + '...' : msg;
        const newConv = await assistantApi.createConversation(titleSnippet);
        activeConvId = newConv.id;
        skipFetchForIdRef.current = activeConvId;
        setSelectedConversationId(activeConvId);
        setSearchParams({ c: activeConvId }, { replace: true });
        setConversations((prev) => [newConv, ...prev]);
      } catch (err) {
        toastError(err.message || 'Could not initialize conversation');
        return;
      }
    }

    // Optimistic UI user message
    const tempUserMsg = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
      referencedIssueKeys: [],
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const response = await assistantApi.sendMessage(activeConvId, msg);
      // Assistant reply from server
      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        referencedIssueKeys: response.referencedIssueKeys || [],
        cached: !!response.cached,
        timestamp: response.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(scrollToBottom, 50);

      // Refresh conversations list to update title / message count
      assistantApi.listConversations()
        .then((data) => setConversations(data || []))
        .catch(() => {});
    } catch (err) {
      toastError(err.message || 'Failed to receive assistant reply');
      // Append error message into the chat thread so user has clear contextual feedback
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `**Error:** ${err.message || 'The AI assistant encountered an issue processing your request.'}`,
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const examplePrompts = [
    'Show me unresolved issues I can access.',
    'Summarize the current issues in my project.',
    'What resolution worked for similar recent bugs?',
    'Find issues related to authentication or token timeout.',
  ];

  const activeConv = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Centralized AI Assistant</h1>
          <p className="page-subtitle">
            Investigate accessible issues, analyze historical resolutions, and query system knowledge
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={Cpu}
            onClick={() => setMetricsModalOpen(true)}
            title="View Semantic Cache Diagnostics"
          >
            Cache Metrics
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearSessionConfirm(true)}
            style={{ color: 'var(--danger-solid)' }}
            title="Clear all session conversations"
          >
            Clear Session
          </Button>
        </div>
      </div>

      {/* Main Two-Panel Chat Layout */}
      <div className="assistant-layout">
        {/* Left Panel: Conversation List Sidebar */}
        <div
          className={`assistant-sidebar ${mobileSidebarOpen ? 'open-mobile' : ''}`}
          style={{
            borderRight: '1px solid var(--border-color)',
            backgroundColor: 'var(--slate-50)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              style={{ width: '100%' }}
              onClick={() => handleCreateConversation()}
            >
              New Conversation
            </Button>

            {mobileSidebarOpen && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {loadingConversations ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No active conversations for this session.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {conversations.map((conv) => {
                  const isSelected = conv.id === selectedConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--primary-100)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary-200)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--slate-200)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? 'var(--primary-900)' : 'var(--text-main)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.title || 'Untitled Conversation'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {conv.updatedAt ? formatRelativeTime(conv.updatedAt) : 'Recently'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--slate-400)',
                          padding: '4px',
                          display: 'flex',
                        }}
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread & Composer */}
        <div className="assistant-chat-panel">
          {/* Chat Header */}
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                style={{ display: 'inline-flex' }}
                aria-label="Toggle conversations list"
              >
                <Menu size={18} />
              </button>

              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeConv?.title || 'AI Assistant'}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Grounded in PostgreSQL issues, comments, history & Qdrant vectors
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success-text)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} />
                Spring AI Ready
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="assistant-messages-container">
            {loadingMessages ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite' }} />
                <div>Retrieving conversation messages...</div>
              </div>
            ) : messages.length === 0 ? (
              /* Welcoming Empty State with Suggested Prompts */
              <div style={{ maxWidth: '640px', margin: 'auto', textAlign: 'center', padding: '2rem 1rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <BotMessageSquare size={32} />
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                  How can I help with your issues?
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '2rem' }}>
                  Ask questions across your accessible projects. I can investigate issue histories, explain changes, summarize comments, and discover related resolutions.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', textAlign: 'left' }}>
                  {examplePrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      style={{
                        padding: '0.875rem 1rem',
                        backgroundColor: 'var(--slate-50)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                        e.currentTarget.style.borderColor = 'var(--primary-300)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      &quot;{prompt}&quot;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Render Messages */
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '100%',
                    }}
                  >
                    <div className={isUser ? 'message-bubble-user' : 'message-bubble-assistant'}>
                      {/* Message Content */}
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Structured Issue Reference Badges */}
                      {msg.referencedIssueKeys && msg.referencedIssueKeys.length > 0 && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.5rem',
                            borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.85 }}>
                            Referenced Tickets:
                          </span>
                          {msg.referencedIssueKeys.map((key) => (
                            <Link
                              key={key}
                              to={`/issues?q=${key}`}
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: isUser ? 'rgba(255,255,255,0.25)' : 'var(--primary-100)',
                                color: isUser ? '#ffffff' : 'var(--primary-700)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <span>{key}</span>
                              <ExternalLink size={10} />
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Timestamp & Semantic Cache Indicator */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '0.5rem',
                          marginTop: '0.35rem',
                          fontSize: '0.6875rem',
                          opacity: 0.75,
                        }}
                      >
                        {msg.cached && (
                          <span
                            title="Returned from semantic cache"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: isUser ? '#ffffff' : 'var(--success-solid)',
                              fontWeight: 600,
                            }}
                          >
                            <Zap size={11} />
                            Cached
                          </span>
                        )}
                        <span>{formatDate(msg.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Waiting for response indicator */}
            {sending && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  maxWidth: '100%',
                }}
              >
                <div
                  className="message-bubble-assistant"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.875rem 1.125rem',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BotMessageSquare size={14} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2
                      className="animate-spin"
                      size={15}
                      style={{ color: 'var(--primary-600)', animation: 'spin 1s linear infinite' }}
                    />
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Assistant is analyzing accessible issues...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Multiline Message Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
              <textarea
                ref={inputRef}
                className="form-control"
                rows={2}
                placeholder="Ask about project issues, search duplicates, or investigate history..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                style={{ resize: 'none', paddingRight: '3rem' }}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!inputMessage.trim() || sending}
                loading={sending}
                icon={Send}
                style={{ height: '42px', minWidth: '42px', padding: '0 0.875rem' }}
                aria-label="Send message"
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline
            </div>
          </form>
        </div>
      </div>

      {/* Delete Single Conversation Dialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Conversation"
          message="Are you sure you want to delete this conversation? Its temporary memory in Redis will be purged."
          confirmText="Delete"
        />
      )}

      {/* Clear Session Dialog */}
      {clearSessionConfirm && (
        <ConfirmDialog
          isOpen={clearSessionConfirm}
          onClose={() => setClearSessionConfirm(false)}
          onConfirm={handleConfirmClearSession}
          title="Clear Session Conversations"
          message="Are you sure you want to delete all assistant conversations for your current login session?"
          confirmText="Clear All"
        />
      )}

      {/* Cache Metrics Diagnostics Modal */}
      {metricsModalOpen && (
        <CacheMetricsModal
          isOpen={metricsModalOpen}
          onClose={() => setMetricsModalOpen(false)}
        />
      )}
    </div>
  );
}
