import React from 'react';

export default function ScrapeLogTable({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>
        No scrape log entries recorded yet.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', maxHeight: '180px', overflowY: 'auto' }}>
      <table className="minimal-table">
        <thead>
          <tr>
            <th>Time (UTC)</th>
            <th>Outcome</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={log.id || idx}>
              <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(31,31,31,0.6)' }}>
                {new Date(log.timestamp).toISOString().replace('T', ' ').slice(11, 19)}
              </td>
              <td>
                <span className={`badge-minimal ${log.outcome === 'failed' ? 'badge-failed' : 'badge-success'}`}>
                  {log.outcome}
                </span>
              </td>
              <td style={{ fontWeight: 600 }}>
                {log.outcome === 'failed' || log.price === null || log.price === undefined ? '—' : `₹${log.price.toLocaleString()}`}
              </td>
              <td style={{ color: 'rgba(31,31,31,0.7)' }}>
                {log.outcome === 'failed' || log.stock === null || log.stock === undefined ? '—' : `${log.stock}u`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
