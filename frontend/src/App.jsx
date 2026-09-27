import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import StatsOverview from './components/StatsOverview.jsx';
import ProductCard from './components/ProductCard.jsx';
import SearchModal from './components/SearchModal.jsx';
import { Sparkles, AlertCircle, Plus, Layers, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ine-price-tracker-backend-l2zl.onrender.com/api'
);

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  function showToast(message, type = 'success') {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  async function loadDashboardData() {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tracked`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load tracked products:', err);
      showToast('Unable to connect to backend server. Retrying...', 'error');
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      showToast(`Started tracking ${productPayload.product_name} (${productPayload.selected_option_label})!`);
      await loadDashboardData();
    } catch (err) {
      console.error('Track product failed:', err);
      showToast('Failed to add product to tracking list', 'error');
    }
  }

  async function handleScrapeNow(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/tracked/${productId}/scrape`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      showToast(`Scrape completed! Outcome: ${data.log.outcome.toUpperCase()}`);
      await loadDashboardData();
    } catch (err) {
      console.error('Scrape now failed:', err);
      showToast('Scrape attempt encountered an issue', 'error');
    }
  }

  async function handleRemoveProduct(productId) {
    if (!window.confirm('Are you sure you want to stop tracking this product?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tracked/${productId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Product removed from active tracking.');
      await loadDashboardData();
    } catch (err) {
      console.error('Remove failed:', err);
      showToast('Failed to remove product', 'error');
    }
  }

  function handleExportCsv() {
    window.open(`${API_BASE_URL}/export/csv`, '_blank');
    showToast('Downloading full scrape history CSV...');
  }

  // Flatten preview logs for stats
  const allLogs = products.flatMap(p => p.history_preview || []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast notification banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 60,
          background: notification.type === 'error' ? 'rgba(244, 63, 94, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <Sparkles size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onRefresh={loadDashboardData}
        onExport={handleExportCsv}
        isRefreshing={refreshing}
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '32px 24px', flex: 1 }}>
        {/* Top Hero Banner */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            Product Price & Stock Intelligence
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Resilient multi-strategy web scraper monitoring dynamic prices, stock levels, and store shifts every 2 hours.
          </p>
        </div>

        {/* Global Statistics Overview */}
        <StatsOverview products={products} allLogs={allLogs} />

        {/* Tracked Products Section */}
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                Tracked Products ({products.length})
              </h3>
            </div>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Plus size={15} />
              <span>Add Item</span>
            </button>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px' }} />
              <p>Fetching active tracked products & price histories...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Layers size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>No products tracked yet</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '20px' }}>
                Search the INE mock store to pick a product and select an option to start tracking.
              </p>
              <button onClick={() => setIsSearchOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                <span>Search Mock Storefront</span>
              </button>
            </div>
          ) : (
            <div>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onScrapeNow={handleScrapeNow}
                  onRemove={handleRemoveProduct}
                  apiBaseUrl={API_BASE_URL}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Catalog Search & Variant Selection Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onTrackProduct={handleTrackProduct}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(5, 8, 15, 0.6)'
      }}>
        <p>INE Software Engineer Intern Assignment • Product Price Tracker (Web Scraping)</p>
        <p style={{ marginTop: '4px' }}>
          Target: <a href="https://demo.inelabteamdev.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>https://demo.inelabteamdev.com</a>
        </p>
      </footer>
    </div>
  );
}
