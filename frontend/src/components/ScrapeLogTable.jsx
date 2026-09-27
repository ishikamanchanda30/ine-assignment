import React from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function ScrapeLogTable({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
        <p>No scrape attempts recorded yet.</p>
      </div>
    );
  }

  function getBadge(outcome) {
    if (outcome === 'success') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> Success
        </span>
      );
    }
    if (outcome === 'retried') {
      return (
        <span className="badge badge-amber" style={{
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <RefreshCw size={12} /> Retried
        </span>
      );
    }
    return (
      <span className="badge badge-failed">
        <XCircle size={12} /> Failed
      </span>
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '12px' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp (UTC)</th>
            <th>Outcome</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Retries</th>
            <th>Duration</th>
            <th>Status / Error Note</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={log.id || idx}>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
              </td>
              <td>{getBadge(log.outcome)}</td>
              <td style={{ fontWeight: 600, color: log.outcome === 'failed' ? 'var(--text-muted)' : '#fff' }}>
                {log.outcome === 'failed' || log.price === null || log.price === undefined ? '—' : `₹${log.price.toLocaleString()}`}
              </td>
              <td style={{ color: log.outcome === 'failed' ? 'var(--text-muted)' : '#38bdf8' }}>
                {log.outcome === 'failed' || log.stock === null || log.stock === undefined ? '—' : `${log.stock} units`}
              </td>
              <td style={{ color: 'var(--text-muted)' }}>{log.retry_count || 0}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {log.duration_ms ? `${log.duration_ms}ms` : '—'}
              </td>
              <td style={{ fontSize: '0.8rem', color: log.outcome === 'failed' ? '#fb7185' : 'var(--text-secondary)' }}>
                {log.error_message || (log.outcome === 'retried' ? 'Recovered after transient error' : 'Clean single pass')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
