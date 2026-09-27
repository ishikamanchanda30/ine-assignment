import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import ProductTile from './components/ProductTile.jsx';
import { Search, RefreshCw, Layers } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadProducts() {
    setRefreshing(true);
    try {
      // Fetch catalog listings
      const res = await fetch(`${API_BASE_URL}/products/search?limit=100`);
      const data = await res.json();
      setProducts(data.results || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast('Could not load products from backend API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleExportCsv() {
    window.open(`${API_BASE_URL}/export/csv`, '_blank');
    showToast('Downloading complete scrape history CSV');
  }

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Filter products by search query and selected category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
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
  }, [products, searchQuery, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
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
        onRefresh={loadProducts}
        onExport={handleExportCsv}
        isRefreshing={refreshing}
        totalProducts={products.length}
      />

      {/* Main Grid View */}
      <main className="container" style={{ flex: 1 }}>
        {/* Search & Filter Bar */}
        <div style={{ marginBottom: '28px' }}>
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search products by name, brand, SKU or category..."
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`variant-chip ${selectedCategory === cat ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(31,31,31,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Showing {filteredProducts.length} of {products.length} Products
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(31,31,31,0.5)' }}>
            Select variant on any card to view price & scrape history
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(31,31,31,0.5)' }}>
            <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Loading store catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(31,31,31,0.5)' }}>
            <Layers size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>No products found</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Try searching with a different keyword or category.
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <ProductTile
                key={product.id}
                product={product}
                apiBaseUrl={API_BASE_URL}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(31,31,31,0.5)' }}>
        <p>INE Software Engineer Intern Assignment • Product Price Tracker</p>
      </footer>
    </div>
  );
}
