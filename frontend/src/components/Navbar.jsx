import React from 'react';
import { Download, RefreshCw, Plus, ExternalLink } from 'lucide-react';

export default function Navbar({ onOpenSearch, onRefresh, onExport, isRefreshing, totalTracked }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-main)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      padding: '20px 0'
    }}>
      <div className="container" style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand */}
        <div>
          <h1 style={{ fontSize: '2.1rem', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text-main)' }}>
            PRICE PULSE
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'rgba(31,31,31,0.6)', marginTop: '4px', letterSpacing: '0.02em' }}>
            Resilient Web Scraper • Monitoring Every 2 Hours
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenSearch}
            className="btn-minimal btn-solid"
            title="Search store catalog and add product to tracking"
          >
            <Plus size={14} />
            <span>Track Product</span>
          </button>

          <a
            href="https://demo.inelabteamdev.com"
            target="_blank"
            rel="noreferrer"
            className="btn-minimal btn-outline"
          >
            <span>Mock Store</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-minimal btn-outline"
            title="Refresh tracked products list"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onExport}
            className="btn-minimal btn-outline"
            title="Download full scrape history CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
