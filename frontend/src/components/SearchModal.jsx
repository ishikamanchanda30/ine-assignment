import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Loader2, Package } from 'lucide-react';

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
      const res = await fetch(`${apiBaseUrl}/products/search?q=${encodeURIComponent(query)}&limit=24`);
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(15, 20, 32, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Search & Track Store Item</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Select a product and choose the specific option to monitor
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, brand, SKU (e.g. Junova, Camera, Fitness)..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                fetchCatalog(e.target.value);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                width: '100%',
                outline: 'none',
                fontSize: '0.9rem'
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
                className="btn btn-ghost"
                style={{ padding: '4px 8px', fontSize: '0.8rem', marginBottom: '16px' }}
              >
                ← Back to search results
              </button>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-success">{productDetails.category || 'Store Item'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {productDetails.sku}</span>
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{productDetails.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {productDetails.description || 'INE Store catalog item'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Select {productDetails.optionAxis || 'Option'} to Track:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {(productDetails.options || []).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`btn ${selectedOptionId === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      {selectedOptionId === opt.id && <Check size={14} />}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirmTrack}
                disabled={tracking}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {tracking ? <Loader2 size={18} className="spin-anim" /> : <Plus size={18} />}
                <span>{tracking ? 'Adding & Running Initial Scrape...' : 'Start Tracking This Option'}</span>
              </button>
            </div>
          ) : (
            /* Search Results Grid */
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} className="spin-anim" style={{ margin: '0 auto 12px' }} />
                  <p>Searching store catalog...</p>
                </div>
              ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No products found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {results.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectProduct(item)}
                      className="glass-panel"
                      style={{
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {item.brand || 'Brand'} • {item.category}
                        </span>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                          {item.name}
                        </h5>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                        <span className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                          Select →
                        </span>
                      </div>
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
