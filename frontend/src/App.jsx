import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import TrackedProductTile from './components/TrackedProductTile.jsx';
import SearchModal from './components/SearchModal.jsx';
import { Search, Plus, Layers, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ine-price-tracker-backend-l2zl.onrender.com/api'
);

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadTrackedProducts();
  }, []);

  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadTrackedProducts() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tracked`);
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load tracked products:', err);
      showToast('Could not load tracked products from backend API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleTrackProduct(productPayload) {
    try {
      const res = await fetch(`${API_BASE_URL}/tracked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      const data = await res.json();
      showToast(`Tracking added: ${productPayload.product_name} (${productPayload.selected_option_label})`);
      await loadTrackedProducts();
    } catch (err) {
      console.error('Track product error:', err);
      showToast('Failed to add product to tracking list');
    }
  }

  async function handleScrapeNow(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/tracked/${productId}/scrape`, {
        method: 'POST'
      });
      const data = await res.json();
      showToast(`Scrape outcome: ${data.log?.outcome?.toUpperCase()}`);
      await loadTrackedProducts();
    } catch (err) {
      console.error('Manual scrape failed:', err);
      showToast('Scrape attempt encountered an issue');
    }
  }

  async function handleRemoveProduct(productId) {
    if (!window.confirm('Remove this product from active tracking?')) return;
    try {
      await fetch(`${API_BASE_URL}/tracked/${productId}`, {
        method: 'DELETE'
      });
      showToast('Product untracked.');
      await loadTrackedProducts();
    } catch (err) {
      console.error('Remove failed:', err);
      showToast('Failed to remove product');
    }
  }

  function handleExportCsv() {
    window.open(`${API_BASE_URL}/export/csv`, '_blank');
    showToast('Downloading complete scrape history CSV');
  }

  // Filter tracked products by search query
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => (
      p.product_name?.toLowerCase().includes(q) ||
      p.selected_option_label?.toLowerCase().includes(q) ||
      p.store_product_id?.toLowerCase().includes(q)
    ));
  }, [products, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 70,
          background: 'var(--border-dark)',
          color: 'var(--bg-main)',
          padding: '10px 18px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          letterSpacing: '0.02em',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <Navbar
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onRefresh={loadTrackedProducts}
        onExport={handleExportCsv}
        isRefreshing={refreshing}
        totalTracked={products.length}
      />

      {/* Main Grid View */}
      <main className="container" style={{ flex: 1 }}>
        {/* Search Bar & Stats */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Filter tracked products by name, variant, store ID..."
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="btn-minimal btn-solid"
            style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} />
            <span>Search & Track Store Product</span>
          </button>
        </div>

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: 'rgba(31,31,31,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tracked Products ({filteredProducts.length})
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>
            Scheduled Scraping Every 2 Hours • Monitored via Supabase
          </span>
        </div>

        {/* 3-Column Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(31,31,31,0.5)' }}>
            <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Loading tracked products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(31,31,31,0.5)' }}>
            <Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '6px' }}>No Tracked Products Yet</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              Search the INE mock store to select a product and option to monitor.
            </p>
            <button onClick={() => setIsSearchModalOpen(true)} className="btn-minimal btn-solid">
              <Plus size={15} />
              <span>Track First Product</span>
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <TrackedProductTile
                key={product.id}
                product={product}
                onScrapeNow={handleScrapeNow}
                onRemove={handleRemoveProduct}
                apiBaseUrl={API_BASE_URL}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </main>

      {/* Catalog Search & Variant Selection Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onTrackProduct={handleTrackProduct}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Minimal Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(31,31,31,0.5)' }}>
        <p>INE Software Engineer Intern Assignment • Product Price Tracker</p>
      </footer>
    </div>
  );
}
