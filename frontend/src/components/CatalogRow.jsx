import React, { useState } from 'react';
import { Plus, Check, Loader2, ExternalLink } from 'lucide-react';

export default function CatalogRow({ product, isTracked, onTrack, apiBaseUrl }) {
  const [productDetails, setProductDetails] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Lazy load product variant options only when user hovers or focuses the selector
  async function ensureDetailsLoaded() {
    if (loaded || loadingDetails) return;
    setLoadingDetails(true);
    try {
      const res = await fetch(`${apiBaseUrl}/products/${product.id}`);
      const data = await res.json();
      setProductDetails(data);
      if (data.options && data.options.length > 0) {
        setSelectedOptionId(data.options[0].id);
      }
      setLoaded(true);
    } catch (err) {
      console.warn('Failed to load item options for', product.id);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleTrack() {
    setTracking(true);
    try {
      let optId = selectedOptionId;
      let optLabel = 'Default';
      let optAxis = 'Option';

      if (!loaded) {
        // Fetch details if not yet fetched
        try {
          const res = await fetch(`${apiBaseUrl}/products/${product.id}`);
          const data = await res.json();
          if (data.options && data.options.length > 0) {
            optId = data.options[0].id;
            optLabel = data.options[0].label;
            optAxis = data.optionAxis || 'Option';
          }
        } catch (e) {}
      } else if (productDetails) {
        const opt = (productDetails.options || []).find(o => o.id === selectedOptionId);
        optLabel = opt ? opt.label : 'Default';
        optAxis = productDetails.optionAxis || 'Option';
      }

      await onTrack({
        store_product_id: String(product.id),
        product_name: product.name,
        selected_option_id: optId || 'o1',
        selected_option_label: optLabel,
        option_axis: optAxis,
        product_url: `https://demo.inelabteamdev.com/item/${product.id}`
      });
    } catch (err) {
      console.error('Track row error:', err);
    } finally {
      setTracking(false);
    }
  }

  const options = productDetails?.options || [];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={() => {
        ensureDetailsLoaded();
      }}
    >
      {/* Product Information */}
      <div style={{ flex: '1 1 340px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(31,31,31,0.6)' }}>
            {product.brand || 'Store'} • {product.category || 'Item'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(31,31,31,0.4)', fontFamily: 'monospace' }}>
            #{product.id} • SKU: {product.sku}
          </span>
        </div>

        <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.2 }}>
          {product.name}
        </h4>

        <div style={{ marginTop: '4px' }}>
          <a
            href={`https://demo.inelabteamdev.com/item/${product.id}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.72rem', color: 'rgba(31,31,31,0.5)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
          >
            <span>View on Mock Store</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Variant Selector Dropdown (Lazy Loaded) */}
      <div style={{ width: '220px', minWidth: '180px' }}>
        <label style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(31,31,31,0.6)', marginBottom: '4px' }}>
          {productDetails?.optionAxis || 'Variant'}:
        </label>
        {loadingDetails ? (
          <div style={{ fontSize: '0.78rem', color: 'rgba(31,31,31,0.4)', padding: '6px 0' }}>Loading options...</div>
        ) : !loaded ? (
          <select
            onFocus={ensureDetailsLoaded}
            onMouseEnter={ensureDetailsLoaded}
            className="variant-select"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <option>Hover / Click to select variant...</option>
          </select>
        ) : (
          <select
            value={selectedOptionId}
            onChange={e => setSelectedOptionId(e.target.value)}
            className="variant-select"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Track Button */}
      <div>
        <button
          onClick={handleTrack}
          disabled={tracking}
          className={`btn-minimal ${isTracked ? 'btn-outline' : 'btn-solid'}`}
          style={{ padding: '9px 18px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          {tracking ? (
            <Loader2 size={13} className="spin-anim" />
          ) : isTracked ? (
            <Check size={13} />
          ) : (
            <Plus size={13} />
          )}
          <span>{tracking ? 'Tracking...' : isTracked ? 'Track Variant Again' : 'Track This Product'}</span>
        </button>
      </div>
    </div>
  );
}
