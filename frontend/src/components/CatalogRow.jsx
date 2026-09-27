import React, { useState, useEffect } from 'react';
import { Plus, Check, Loader2, ExternalLink } from 'lucide-react';

export default function CatalogRow({ product, isTracked, onTrack, apiBaseUrl }) {
  const [productDetails, setProductDetails] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [tracking, setTracking] = useState(false);

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
        console.warn('Failed to fetch details for row', product.id);
      } finally {
        setLoadingDetails(false);
      }
    }
    loadDetails();
  }, [product.id, apiBaseUrl]);

  async function handleTrack() {
    if (!selectedOptionId) return;
    const opt = (productDetails?.options || []).find(o => o.id === selectedOptionId);
    setTracking(true);
    try {
      await onTrack({
        store_product_id: String(product.id),
        product_name: product.name,
        selected_option_id: selectedOptionId,
        selected_option_label: opt ? opt.label : 'Default',
        option_axis: productDetails?.optionAxis || 'Option',
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
    <div style={{
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
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-dark)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
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

      {/* Variant Selector Dropdown */}
      <div style={{ width: '220px', minWidth: '180px' }}>
        <label style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(31,31,31,0.6)', marginBottom: '4px' }}>
          {productDetails?.optionAxis || 'Variant'}:
        </label>
        {loadingDetails ? (
          <div style={{ fontSize: '0.78rem', color: 'rgba(31,31,31,0.4)' }}>Loading options...</div>
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
