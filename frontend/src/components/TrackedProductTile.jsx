import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import ScrapeLogTable from './ScrapeLogTable.jsx';

export default function TrackedProductTile({ product, onScrapeNow, onRemove, apiBaseUrl, onToast }) {
  const [productDetails, setProductDetails] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(product.selected_option_id);
  const [scraping, setScraping] = useState(false);
  const [history, setHistory] = useState(product.history_preview || []);
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('chart');

  // Load product options for dropdown
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch(`${apiBaseUrl}/products/${product.store_product_id}`);
        const data = await res.json();
        setProductDetails(data);
      } catch (err) {
        console.warn('Could not load options for', product.store_product_id);
      }
    }
    loadOptions();
  }, [product.store_product_id, apiBaseUrl]);

  // When dropdown variant changes, fetch that variant's history or switch
  async function handleOptionChange(newOptId) {
    setSelectedOptionId(newOptId);
    const newOpt = (productDetails?.options || []).find(o => o.id === newOptId);

    // Track or update this variant in database
    try {
      const res = await fetch(`${apiBaseUrl}/tracked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_product_id: String(product.store_product_id),
          product_name: product.product_name,
          selected_option_id: newOptId,
          selected_option_label: newOpt?.label || 'Default',
          option_axis: product.option_axis || 'Option',
          product_url: product.product_url
        })
      });
      const data = await res.json();
      if (data.product) {
        const histRes = await fetch(`${apiBaseUrl}/tracked/${data.product.id}/history`);
        const histData = await histRes.json();
        setHistory(histData.history || []);
      }
    } catch (err) {
      console.error('Option switch error:', err);
    }
  }

  async function handleManualScrape() {
    setScraping(true);
    try {
      await onScrapeNow(product.id);
      const res = await fetch(`${apiBaseUrl}/tracked/${product.id}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Scrape error:', err);
    } finally {
      setScraping(false);
    }
  }

  const latestSuccess = history.find(h => h.outcome !== 'failed' && h.price !== null);
  const currentPrice = product.current_price || latestSuccess?.price;
  const currentStock = product.current_stock || latestSuccess?.stock;
  const options = productDetails?.options || [{ id: product.selected_option_id, label: product.selected_option_label }];

  return (
    <div className="product-tile">
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(31,31,31,0.6)' }}>
            Tracked Item • Store ID: #{product.store_product_id}
          </span>
          <a
            href={product.product_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-main)', opacity: 0.5, display: 'inline-flex', alignItems: 'center' }}
            title="Open on mock store"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        <h3 style={{ fontSize: '1.45rem', lineHeight: 1.25, color: 'var(--text-main)', marginBottom: '4px' }}>
          {product.product_name}
        </h3>

        {/* Variant Dropdown Menu */}
        <div style={{ marginTop: '14px', marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', color: 'rgba(31,31,31,0.7)' }}>
            {product.option_axis || 'Variant'}:
          </label>
          <select
            value={selectedOptionId || product.selected_option_id}
            onChange={e => handleOptionChange(e.target.value)}
            className="variant-select"
          >
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price & Actions Bottom Section */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(31,31,31,0.5)', display: 'block' }}>
              Current Price
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', lineHeight: 1, color: 'var(--text-main)', marginTop: '2px' }}>
              {currentPrice ? `₹${currentPrice.toLocaleString()}` : <span style={{ fontSize: '1.2rem', color: 'rgba(31,31,31,0.4)' }}>Pending Scrape</span>}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {currentStock !== undefined && currentStock !== null && (
              <span className="badge-minimal badge-success">
                {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleManualScrape}
            disabled={scraping}
            className="btn-minimal btn-solid"
            style={{ flex: 1 }}
          >
            <RefreshCw size={13} className={scraping ? 'spin-anim' : ''} />
            <span>{scraping ? 'Scraping...' : 'Scrape Price'}</span>
          </button>

          <button
            onClick={() => onRemove(product.id)}
            className="btn-minimal btn-outline"
            style={{ padding: '8px 12px' }}
            title="Untrack product"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-minimal btn-outline"
            style={{ padding: '8px 12px' }}
            title="View price history and logs"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Expandable History Drawer */}
        {expanded && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                History & Logs
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`variant-chip ${viewMode === 'chart' ? 'active' : ''}`}
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  Chart
                </button>
                <button
                  onClick={() => setViewMode('logs')}
                  className={`variant-chip ${viewMode === 'logs' ? 'active' : ''}`}
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  Logs ({history.length})
                </button>
              </div>
            </div>

            {viewMode === 'chart' ? (
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
    </div>
  );
}
