import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import PriceChart from './PriceChart.jsx';
import ScrapeLogTable from './ScrapeLogTable.jsx';

export default function ProductTile({ product, apiBaseUrl, onToast }) {
  const [productDetails, setProductDetails] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [priceData, setPriceData] = useState(null);
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('chart');

  // Load product options and details
  useEffect(() => {
    async function loadDetails() {
      setLoadingDetails(true);
      try {
        const res = await fetch(`${apiBaseUrl}/products/${product.id}`);
        const data = await res.json();
        setProductDetails(data);
        if (data.options && data.options.length > 0) {
          setSelectedOptionId(data.options[0].id);
        }
      } catch (err) {
        console.error('Failed to load options for product', product.id, err);
      } finally {
        setLoadingDetails(false);
      }
    }
    loadDetails();
  }, [product.id, apiBaseUrl]);

  // When variant is selected, fetch or compute current price and history
  useEffect(() => {
    if (!selectedOptionId) return;
    loadVariantPriceAndHistory(selectedOptionId);
  }, [selectedOptionId]);

  async function loadVariantPriceAndHistory(optId) {
    try {
      const res = await fetch(`${apiBaseUrl}/tracked`);
      const allTracked = await res.json();
      const match = allTracked.find(
        t => String(t.store_product_id) === String(product.id) && String(t.selected_option_id) === String(optId)
      );

      if (match) {
        setPriceData({
          price: match.current_price,
          stock: match.current_stock,
          outcome: match.latest_outcome
        });
        setHistory(match.history_preview || []);
      } else {
        // Compute deterministic initial preview price
        const base = 499 + ((Number(product.id) * 37) % 4500);
        const optIdx = (productDetails?.options || []).findIndex(o => o.id === optId);
        const idx = optIdx >= 0 ? optIdx : 0;
        const initialPrice = Math.round(base * (1 + idx * 0.35));
        const initialStock = 5 + ((Number(product.id) * 13 + idx * 7) % 80);

        setPriceData({
          price: initialPrice,
          stock: initialStock,
          outcome: 'success'
        });
        setHistory([]);
      }
    } catch (err) {
      console.warn('History load fallback:', err.message);
    }
  }

  async function handleScrapeNow() {
    if (!selectedOptionId) return;
    setScraping(true);
    const selectedOpt = (productDetails?.options || []).find(o => o.id === selectedOptionId);

    try {
      // 1. Ensure tracked in database
      const addRes = await fetch(`${apiBaseUrl}/tracked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_product_id: String(product.id),
          product_name: product.name,
          selected_option_id: selectedOptionId,
          selected_option_label: selectedOpt?.label || 'Default',
          option_axis: productDetails?.optionAxis || 'Option',
          product_url: `https://demo.inelabteamdev.com/item/${product.id}`
        })
      });
      const addData = await addRes.json();

      // 2. Refresh local state
      if (addData.initialScrape) {
        setPriceData({
          price: addData.initialScrape.price,
          stock: addData.initialScrape.stock,
          outcome: addData.initialScrape.outcome
        });
      }

      const histRes = await fetch(`${apiBaseUrl}/tracked/${addData.product.id}/history`);
      const histData = await histRes.json();
      setHistory(histData.history || []);

      if (onToast) onToast(`Scraped ${product.name} (${selectedOpt?.label}): Outcome ${addData.initialScrape?.outcome?.toUpperCase()}`);
    } catch (err) {
      console.error('Scrape error:', err);
      if (onToast) onToast(`Scrape attempt finished`, 'error');
    } finally {
      setScraping(false);
    }
  }

  const options = productDetails?.options || [];
  const selectedOpt = options.find(o => o.id === selectedOptionId);

  return (
    <div className="product-tile">
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(31,31,31,0.6)' }}>
            {product.brand || 'INE Store'} • {product.category || 'Item'}
          </span>
          <a
            href={`https://demo.inelabteamdev.com/item/${product.id}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-main)', opacity: 0.5, display: 'inline-flex', alignItems: 'center' }}
            title="Open on mock store"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        <h3 style={{ fontSize: '1.4rem', lineHeight: 1.25, color: 'var(--text-main)', marginBottom: '6px' }}>
          {product.name}
        </h3>

        <p style={{ fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)', fontFamily: 'monospace' }}>
          SKU: {product.sku || `SK-${product.id}`}
        </p>

        {/* Variant / Option Selector */}
        <div style={{ marginTop: '18px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', color: 'rgba(31,31,31,0.7)' }}>
            {productDetails?.optionAxis || 'Variant'}:
          </div>

          {loadingDetails ? (
            <div style={{ fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>Loading options...</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`variant-chip ${selectedOptionId === opt.id ? 'active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Price & Action Section */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(31,31,31,0.5)', display: 'block' }}>
              Current Price
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1, color: 'var(--text-main)', marginTop: '2px' }}>
              {priceData?.price ? `₹${priceData.price.toLocaleString()}` : '—'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {priceData?.stock !== undefined && priceData?.stock !== null && (
              <span className="badge-minimal badge-success">
                {priceData.stock > 0 ? `${priceData.stock} in stock` : 'Out of stock'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleScrapeNow}
            disabled={scraping}
            className="btn-minimal btn-solid"
            style={{ flex: 1 }}
          >
            <RefreshCw size={13} className={scraping ? 'spin-anim' : ''} />
            <span>{scraping ? 'Scraping...' : 'Scrape Price'}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-minimal btn-outline"
            title="View price history and logs"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* History Drawer */}
        {expanded && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {selectedOpt?.label} History
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
                  Logs
                </button>
              </div>
            </div>

            {viewMode === 'chart' ? (
              <PriceChart
                history={history}
                productName={product.name}
                optionLabel={selectedOpt?.label || 'Option'}
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
