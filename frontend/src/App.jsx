import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import TrackedProductTile from './components/TrackedProductTile.jsx';
import CatalogRow from './components/CatalogRow.jsx';
import SearchModal from './components/SearchModal.jsx';
import { Search, Plus, Layers, RefreshCw, PackageCheck, ShoppingBag } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ine-price-tracker-backend-l2zl.onrender.com/api'
);

export default function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingTracked, setLoadingTracked] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadAllData() {
    setRefreshing(true);
    await Promise.all([loadTrackedProducts(), loadCatalog()]);
    setRefreshing(false);
  }

  async function loadTrackedProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/tracked`);
      const data = await res.json();
      setTrackedProducts(data || []);
    } catch (err) {
      console.error('Failed to load tracked products:', err);
      showToast('Could not load tracked products from backend API.');
    } finally {
      setLoadingTracked(false);
    }
  }

  async function loadCatalog() {
    try {
      const res = await fetch(`${API_BASE_URL}/products/search?limit=100`);
      const data = await res.json();
      setCatalogProducts(data.results || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoadingCatalog(false);
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

  // Extract catalog categories
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    catalogProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [catalogProducts]);

  // Filter catalog products by search query and category
  const filteredCatalog = useMemo(() => {
    return catalogProducts.filter(p => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
      return matchCategory && matchQuery;
    });
  }, [catalogProducts, searchQuery, selectedCategory]);

  const trackedIds = new Set(trackedProducts.map(p => String(p.store_product_id)));

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
        onRefresh={loadAllData}
        onExport={handleExportCsv}
        isRefreshing={refreshing}
        totalTracked={trackedProducts.length}
      />

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1 }}>
        {/* ========================================================= */}
        {/* SECTION 1: TRACKED PRODUCTS (3 PER ROW GRID) */}
        {/* ========================================================= */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageCheck size={20} />
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>
                Tracked Products ({trackedProducts.length})
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>
              Scheduled Scrapes Every 2h • Supabase Storage
            </span>
          </div>

          {loadingTracked ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(31,31,31,0.5)' }}>
              <RefreshCw size={22} className="spin-anim" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Loading tracked products...</p>
            </div>
          ) : trackedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <Layers size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h4 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '4px' }}>No Tracked Products Yet</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(31,31,31,0.6)', marginBottom: '16px' }}>
                Browse the catalog below and click "Track This Product" to begin automated monitoring.
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {trackedProducts.map(product => (
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
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: ALL PRODUCTS CATALOG (ROW-WISE LIST) */}
        {/* ========================================================= */}
        <section style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} />
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>
                All Store Products ({filteredCatalog.length})
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>
              INE Mock Storefront Catalog
            </span>
          </div>

          {/* Search Bar & Category Filters for Catalog */}
          <div style={{ marginBottom: '20px' }}>
            <div className="search-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search catalog by name, brand, SKU or category..."
                className="search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`variant-chip ${selectedCategory === cat ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Row-wise Catalog List */}
          {loadingCatalog ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(31,31,31,0.5)' }}>
              <RefreshCw size={22} className="spin-anim" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Loading store catalog...</p>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(31,31,31,0.6)' }}>
                No products found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div>
              {filteredCatalog.map(product => (
                <CatalogRow
                  key={product.id}
                  product={product}
                  isTracked={trackedIds.has(String(product.id))}
                  onTrack={handleTrackProduct}
                  apiBaseUrl={API_BASE_URL}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onTrackProduct={handleTrackProduct}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Minimal Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(31,31,31,0.5)' }}>
        <p>INE Software Engineer Intern Assignment • Product Price Tracker (Web Scraping)</p>
      </footer>
    </div>
  );
}
