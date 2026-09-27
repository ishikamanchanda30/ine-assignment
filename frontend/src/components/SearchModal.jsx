import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Loader2, Package } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, onTrackProduct, apiBaseUrl }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setSelectedProduct(null);
      setProductDetails(null);
      return;
    }
    fetchCatalog('');
  }, [isOpen]);

  async function fetchCatalog(query) {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/products/search?q=${encodeURIComponent(query)}&limit=30`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Catalog fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProduct(item) {
    setSelectedProduct(item);
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/products/${item.id}`);
      const data = await res.json();
      setProductDetails(data);
      if (data.options && data.options.length > 0) {
        setSelectedOptionId(data.options[0].id);
      }
    } catch (err) {
      console.error('Item detail error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTrack() {
    if (!selectedProduct || !selectedOptionId || !productDetails) return;
    const opt = (productDetails.options || []).find(o => o.id === selectedOptionId);

    setTracking(true);
    try {
      await onTrackProduct({
        store_product_id: String(selectedProduct.id),
        product_name: selectedProduct.name,
        selected_option_id: selectedOptionId,
        selected_option_label: opt ? opt.label : 'Default',
        option_axis: productDetails.optionAxis || 'Option',
        product_url: `https://demo.inelabteamdev.com/item/${selectedProduct.id}`
      });
      onClose();
    } catch (err) {
      console.error('Track product error:', err);
    } finally {
      setTracking(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(31, 31, 31, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '20px'
    }} onClick={onClose}>
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          background: '#ffffff',
          border: '1px solid var(--border-dark)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Track New Store Product</h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(31,31,31,0.6)' }}>
              Search INE Mock Store and choose variant option to monitor
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search by product name, brand, SKU..."
              className="search-input"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                fetchCatalog(e.target.value);
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {selectedProduct && productDetails ? (
            /* Option Selection View */
            <div>
              <button
                onClick={() => { setSelectedProduct(null); setProductDetails(null); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginBottom: '16px',
                  color: 'var(--text-main)'
                }}
              >
                ← Back to search results
              </button>

              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(31,31,31,0.6)', marginBottom: '4px' }}>
                  {productDetails.brand} • {productDetails.category} • SKU: {productDetails.sku}
                </div>
                <h4 style={{ fontSize: '1.35rem', color: 'var(--text-main)' }}>{productDetails.name}</h4>
              </div>

              {/* Variant Dropdown */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Select {productDetails.optionAxis || 'Variant'} to Track:
                </label>
                <select
                  value={selectedOptionId}
                  onChange={e => setSelectedOptionId(e.target.value)}
                  className="variant-select"
                >
                  {(productDetails.options || []).map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleConfirmTrack}
                disabled={tracking}
                className="btn-minimal btn-solid"
                style={{ width: '100%', padding: '12px' }}
              >
                {tracking ? <Loader2 size={15} className="spin-anim" /> : <Plus size={15} />}
                <span>{tracking ? 'Adding & Running Initial Scrape...' : 'Add to Tracked Products'}</span>
              </button>
            </div>
          ) : (
            /* Results List */
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(31,31,31,0.5)' }}>
                  <Loader2 size={22} className="spin-anim" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Searching catalog...</p>
                </div>
              ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(31,31,31,0.5)' }}>
                  <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem' }}>No products matching "{searchTerm}"</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {results.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProduct(item)}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'border-color 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-dark)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(31,31,31,0.6)', textTransform: 'uppercase' }}>
                          {item.brand} • {item.category}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                          {item.name}
                        </div>
                      </div>
                      <span className="btn-minimal btn-outline" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                        Select →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
