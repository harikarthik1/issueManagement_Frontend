import { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to error monitoring service (e.g. Sentry, Datadog)
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--slate-50, #f8fafc)',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--slate-200, #e2e8f0)',
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-bg, #fef2f2)',
                color: 'var(--danger-solid, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--slate-900, #0f172a)',
                marginBottom: '0.75rem',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: 'var(--slate-600, #475569)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
              }}
            >
              An unexpected error occurred while rendering this view. Your session data is intact.
              You can try recovering the view or navigate back to the dashboard.
            </p>

            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  backgroundColor: 'var(--slate-100, #f1f5f9)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1.75rem',
                  fontSize: '0.825rem',
                  color: 'var(--slate-700, #334155)',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: '600' }}>Error details</summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--danger-text, #991b1b)',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                icon={Home}
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.node,
};
