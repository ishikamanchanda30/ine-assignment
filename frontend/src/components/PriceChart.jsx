import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

export default function PriceChart({ history = [], productName, optionLabel }) {
  const [activeTab, setActiveTab] = useState('price'); // 'price' or 'stock'

  // Reverse to show chronologically left-to-right
  const chronological = [...history].reverse();
  const validData = chronological.filter(h => h.outcome !== 'failed' && (activeTab === 'price' ? h.price !== null : h.stock !== null));

  if (chronological.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
        <p>No historical scrape points recorded yet.</p>
      </div>
    );
  }

  const values = validData.map(d => activeTab === 'price' ? d.price : d.stock);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  const range = maxVal - minVal || 1;

  const width = 600;
  const height = 200;
  const padding = 30;

  // Build SVG Path
  const points = validData.map((d, i) => {
    const x = padding + (i / Math.max(1, validData.length - 1)) * (width - padding * 2);
    const val = activeTab === 'price' ? d.price : d.stock;
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x, y, data: d };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  const latestVal = values[values.length - 1];
  const initialVal = values[0];
  const diff = latestVal && initialVal ? latestVal - initialVal : 0;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Chart Controls & Stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeTab === 'price' ? 'Current Price' : 'Current Stock'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                {activeTab === 'price' ? `₹${latestVal?.toLocaleString() || '—'}` : `${latestVal || 0} units`}
              </h4>
              {diff !== 0 && activeTab === 'price' && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: diff < 0 ? '#34d399' : '#fb7185',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {diff < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  ₹{Math.abs(diff)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <button
            onClick={() => setActiveTab('price')}
            className={`btn ${activeTab === 'price' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            Price Trend
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            Stock Level
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div style={{
        background: 'rgba(5, 8, 15, 0.5)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        border: '1px solid var(--border-glass)'
      }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

          {/* Gradient Fill */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Stroke Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={activeTab === 'price' ? 'var(--accent-primary)' : 'var(--accent-cyan)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="var(--bg-primary)"
                stroke={activeTab === 'price' ? 'var(--accent-primary)' : 'var(--accent-cyan)'}
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>

        {/* X-Axis Time Bounds */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: '6px',
          padding: '0 8px'
        }}>
          <span>{new Date(chronological[0]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{chronological.length} recorded run(s)</span>
          <span>{new Date(chronological[chronological.length - 1]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
