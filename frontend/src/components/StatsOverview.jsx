import React from 'react';
import { Layers, CheckCircle2, TrendingDown, Clock } from 'lucide-react';

export default function StatsOverview({ products = [], allLogs = [] }) {
  const totalTracked = products.length;
  const successfulScrapes = allLogs.filter(l => l.outcome === 'success' || l.outcome === 'retried').length;
  const totalScrapes = allLogs.length || 1;
  const successRate = Math.round((successfulScrapes / totalScrapes) * 100);

  // Lowest price item
  const validPrices = products.filter(p => p.current_price !== null && p.current_price !== undefined);
  const lowestPrice = validPrices.length > 0 
    ? Math.min(...validPrices.map(p => p.current_price)) 
    : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '28px'
    }}>
      {/* Stat 1 */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Tracked Products</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#fff' }}>{totalTracked}</h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={22} />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
          Target: INE Mock Storefront
        </p>
      </div>

      {/* Stat 2 */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Scrape Success Rate</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#34d399' }}>{successRate}%</h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
          {allLogs.length} total automated runs logged
        </p>
      </div>

      {/* Stat 3 */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Lowest Tracked Price</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#38bdf8' }}>
              {lowestPrice ? `₹${lowestPrice.toLocaleString()}` : '—'}
            </h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingDown size={22} />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
          Live dynamic variant pricing
        </p>
      </div>

      {/* Stat 4 */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Polling Interval</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#fbbf24' }}>Every 2h</h3>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
          External cron-job.org wake-up hook
        </p>
      </div>
    </div>
  );
}
