import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { assistantApi } from '../../api/assistantApi';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Cpu, Zap, Activity, Clock } from 'lucide-react';

export function CacheMetricsModal({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      assistantApi.getCacheMetrics()
        .then((data) => setMetrics(data))
        .catch((err) => setError(err.message || 'Failed to load cache metrics'))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={20} color="var(--primary-600)" />
          <span>Semantic Caching & Operational Diagnostics</span>
        </div>
      }
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
      size="lg"
    >
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving real-time semantic cache metrics...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--danger-solid)', padding: '1rem' }}>{error}</div>
      ) : metrics ? (
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Operational metrics for backend Redis semantic caching and Gemini API call bypasses.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card-title">Cache Hits</div>
              <div className="stat-card-value" style={{ color: 'var(--success-solid)' }}>
                {metrics.cacheHits ?? metrics.hits ?? 0}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-solid)' }}>
                <Zap size={18} />
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card-title">Cache Misses</div>
              <div className="stat-card-value">
                {metrics.cacheMisses ?? metrics.misses ?? 0}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
                <Activity size={18} />
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card-title">Gemini Calls Avoided</div>
              <div className="stat-card-value" style={{ color: 'var(--primary-600)' }}>
                {metrics.callsAvoided ?? metrics.geminiCallsAvoided ?? metrics.cacheHits ?? 0}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                <Cpu size={18} />
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card-title">Avg Lookup Latency</div>
              <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>
                {metrics.averageLookupLatencyMs ? `${metrics.averageLookupLatencyMs}ms` : '—'}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-600)' }}>
                <Clock size={18} />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--slate-900)', color: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ color: 'var(--slate-400)', marginBottom: '0.5rem', fontWeight: 600 }}>Raw Metrics Snapshot:</div>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

CacheMetricsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
