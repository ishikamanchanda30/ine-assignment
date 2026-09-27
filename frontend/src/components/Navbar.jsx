import React from 'react';
import { Activity, Search, Download, RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenSearch, onRefresh, onExport, isRefreshing }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(10, 13, 20, 0.8)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '16px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Logo & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>PricePulse</h1>
              <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                <span className="pulse-dot" style={{ background: '#10b981' }}></span> Live Scraper
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              INE Mock Storefront • 2-Hour Resilient Polling Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenSearch}
            className="btn btn-primary"
            id="open-search-btn"
          >
            <Search size={16} />
            <span>Track New Product</span>
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            disabled={isRefreshing}
            title="Refresh dashboard data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onExport}
            className="btn btn-secondary"
            id="export-csv-btn"
            title="Download full scrape history as CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
