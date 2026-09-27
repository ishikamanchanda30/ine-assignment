import React, { useState } from 'react';
import { RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, Layers, TrendingDown, Clock } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import ScrapeLogTable from './ScrapeLogTable.jsx';

export default function ProductCard({ product, onScrapeNow, onRemove, apiBaseUrl }) {
  const [expanded, setExpanded] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [history, setHistory] = useState(product.history_preview || []);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'logs'

  async function handleToggleExpand() {
    const nextState = !expanded;
    setExpanded(nextState);
    if (nextState) {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${apiBaseUrl}/tracked/${product.id}/history`);
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error('Fetch history error:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
  }

  async function handleManualScrape() {
    setScraping(true);
    try {
      await onScrapeNow(product.id);
      // Refresh local history
      const res = await fetch(`${apiBaseUrl}/tracked/${product.id}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Manual scrape error:', err);
    } finally {
      setScraping(false);
    }
  }

  const latestSuccess = history.find(h => h.outcome !== 'failed' && h.price !== null);
  const currentPrice = product.current_price || latestSuccess?.price;
  const currentStock = product.current_stock || latestSuccess?.stock;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
      {/* Top Row: Info + Price */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left Info */}
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
              <Layers size={11} /> {product.option_axis || 'Option'}: {product.selected_option_label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Store ID: #{product.store_product_id}
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {product.product_name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <a
              href={product.product_url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none'
              }}
            >
              <span>View in Mock Store</span>
              <ExternalLink size={12} />
            </a>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Last Scraped: {product.last_scraped_at ? new Date(product.last_scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
            </span>
          </div>
        </div>

        {/* Right Metric: Price & Stock */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {currentPrice ? `₹${currentPrice.toLocaleString()}` : <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Awaiting Scrape</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStock !== undefined && currentStock !== null ? (
              <span className="badge" style={{
                background: currentStock > 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: currentStock > 0 ? '#38bdf8' : '#fb7185',
                border: currentStock > 0 ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
              }}>
                {currentStock > 0 ? `${currentStock} units in stock` : 'Out of Stock'}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-glass)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleManualScrape}
            disabled={scraping}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <RefreshCw size={14} className={scraping ? 'spin-anim' : ''} />
            <span>{scraping ? 'Scraping Store...' : 'Scrape Now'}</span>
          </button>

          <button
            onClick={() => onRemove(product.id)}
            className="btn btn-danger"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            title="Untrack product"
          >
            <Trash2 size={14} />
            <span>Untrack</span>
          </button>
        </div>

        <button
          onClick={handleToggleExpand}
          className="btn btn-ghost"
          style={{ fontSize: '0.8rem', color: 'var(--text-primary)', padding: '6px 12px' }}
        >
          <span>{expanded ? 'Hide History & Logs' : 'View Price History & Scrape Logs'}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded History Drawer */}
      {expanded && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-glass)'
        }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Historical Analytics & Audit Trail
            </span>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)'
            }}>
              <button
                onClick={() => setViewMode('chart')}
                className={`btn ${viewMode === 'chart' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Chart View
              </button>
              <button
                onClick={() => setViewMode('logs')}
                className={`btn ${viewMode === 'logs' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Scrape Logs ({history.length})
              </button>
            </div>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="spin-anim" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.8rem' }}>Loading scrape history records...</p>
            </div>
          ) : viewMode === 'chart' ? (
            <PriceChart
              history={history}
              productName={product.product_name}
              optionLabel={product.selected_option_label}
            />
          ) : (
            <ScrapeLogTable logs={history} />
          )}
        </div>
      )}
    </div>
  );
}
