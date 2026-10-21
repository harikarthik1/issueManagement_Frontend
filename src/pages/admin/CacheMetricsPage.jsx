import { useState, useEffect } from 'react';
import { assistantApi } from '../../api/assistantApi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { Cpu, Zap, Activity, Clock, RefreshCw } from 'lucide-react';

export function CacheMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assistantApi.getCacheMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed to load cache metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Semantic Cache Diagnostics</h1>
          <p className="page-subtitle">
            Real-time operational metrics for Redis vector caching and Gemini LLM call savings
          </p>
        </div>

        <Button variant="secondary" icon={RefreshCw} onClick={fetchMetrics} loading={loading}>
          Refresh Metrics
        </Button>
      </div>

      {loading ? (
        <div className="grid-cols-auto">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-solid)' }}>
          {error}
        </div>
      ) : metrics ? (
        <>
          <div className="grid-cols-auto" style={{ marginBottom: '1.75rem' }}>
            <div className="stat-card">
              <div className="stat-card-title">Cache Hits</div>
              <div className="stat-card-value" style={{ color: 'var(--success-solid)' }}>
                {metrics.cacheHits ?? metrics.hits ?? 0}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-solid)' }}>
                <Zap size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Cache Misses</div>
              <div className="stat-card-value">
                {metrics.cacheMisses ?? metrics.misses ?? 0}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
                <Activity size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Gemini Calls Avoided</div>
              <div className="stat-card-value" style={{ color: 'var(--primary-600)' }}>
                {metrics.callsAvoided ?? metrics.geminiCallsAvoided ?? metrics.cacheHits ?? 0}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                <Cpu size={20} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Average Latency</div>
              <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>
                {metrics.averageLookupLatencyMs ? `${metrics.averageLookupLatencyMs} ms` : '—'}
              </div>
              <div className="stat-card-icon" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-600)' }}>
                <Clock size={20} />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader title="Operational Metrics Payload" />
            <CardBody>
              <pre
                style={{
                  margin: 0,
                  padding: '1.25rem',
                  backgroundColor: 'var(--slate-900)',
                  color: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
