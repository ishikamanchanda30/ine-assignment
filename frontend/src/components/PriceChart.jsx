import React, { useState } from 'react';

export default function PriceChart({ history = [], productName, optionLabel }) {
  const [activeTab, setActiveTab] = useState('price'); // 'price' or 'stock'

  const chronological = [...history].reverse();
  const validData = chronological.filter(h => h.outcome !== 'failed' && (activeTab === 'price' ? h.price !== null : h.stock !== null));

  if (validData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 8px', fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>
        No scrape history yet for this variant. Click "Scrape Price" to record the first point.
      </div>
    );
  }

  const values = validData.map(d => activeTab === 'price' ? d.price : d.stock);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const width = 280;
  const height = 90;
  const padding = 12;

  const points = validData.map((d, i) => {
    const x = padding + (i / Math.max(1, validData.length - 1)) * (width - padding * 2);
    const val = activeTab === 'price' ? d.price : d.stock;
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x, y, data: d };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(31,31,31,0.6)', textTransform: 'uppercase' }}>
          {activeTab === 'price' ? 'Price Trend' : 'Stock Trend'}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('price')}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.68rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'price' ? 700 : 400,
              textDecoration: activeTab === 'price' ? 'underline' : 'none',
              color: 'var(--text-main)'
            }}
          >
            Price
          </button>
          <span style={{ fontSize: '0.68rem', color: 'rgba(31,31,31,0.3)' }}>/</span>
          <button
            onClick={() => setActiveTab('stock')}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.68rem',
              cursor: 'pointer',
              fontWeight: activeTab === 'stock' ? 700 : 400,
              textDecoration: activeTab === 'stock' ? 'underline' : 'none',
              color: 'var(--text-main)'
            }}
          >
            Stock
          </button>
        </div>
      </div>

      {/* SVG Minimal Line Chart */}
      <div style={{ background: 'rgba(31,31,31,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(31,31,31,0.15)" />
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#1f1f1f"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#ffffff"
              stroke="#1f1f1f"
              strokeWidth="1.5"
            />
          ))}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(31,31,31,0.5)', marginTop: '4px' }}>
          <span>Low: {activeTab === 'price' ? `₹${minVal}` : `${minVal}u`}</span>
          <span>{validData.length} pts</span>
          <span>High: {activeTab === 'price' ? `₹${maxVal}` : `${maxVal}u`}</span>
        </div>
      </div>
    </div>
  );
}
