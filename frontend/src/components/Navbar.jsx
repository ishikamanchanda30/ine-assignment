import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Clock } from 'lucide-react';

export default function Navbar({ onRefresh, onExport, isRefreshing, totalTracked }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function updateCountdown() {
      const now = Date.now();
      const intervalMs = 2 * 60 * 60 * 1000; // 2 hours in ms
      const msUntilNext = intervalMs - (now % intervalMs);

      const totalSecs = Math.floor(msUntilNext / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      setTimeLeft(`${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-main)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      padding: '16px 0'
    }}>
      <div className="container" style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text-main)' }}>
            PRICE PULSE
          </h1>
          <span style={{ fontSize: '0.72rem', color: 'rgba(31,31,31,0.5)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Product Price Tracker
          </span>
        </div>

        {/* Right Section: Next Scrape Countdown & Borderless Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          {/* Next Scrape Timer Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-main)',
            background: '#ffffff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            letterSpacing: '0.02em'
          }}>
            <Clock size={12} style={{ opacity: 0.6 }} />
            <span style={{ color: 'rgba(31,31,31,0.6)' }}>Next scrape in:</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-main)' }}>
              {timeLeft || '2h 00m 00s'}
            </span>
          </div>

          {/* Refresh Button (Borderless & Clean) */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isRefreshing ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              color: 'var(--text-main)',
              opacity: isRefreshing ? 0.5 : 0.8,
              padding: '4px 6px',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={e => !isRefreshing && (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => !isRefreshing && (e.currentTarget.style.opacity = '0.8')}
            title="Refresh active products list"
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export CSV Button (Borderless & Clean) */}
          <button
            onClick={onExport}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              color: 'var(--text-main)',
              opacity: 0.8,
              padding: '4px 6px',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
            title="Download full scrape audit CSV"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
