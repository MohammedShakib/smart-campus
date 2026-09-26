import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Coffee,
  Search,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  RotateCw,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  AlertCircle
} from 'lucide-react';
import { SectionHeader, EmptyState } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';

const CATEGORIES = [
  { id: 'ALL', label: 'All Items', icon: Utensils },
  { id: 'BREAKFAST', label: 'Breakfast', icon: Coffee },
  { id: 'LUNCH', label: 'Lunch Meals', icon: Utensils },
  { id: 'SNACKS', label: 'Snacks & Bakery', icon: Sparkles },
  { id: 'BEVERAGES', label: 'Beverages', icon: Coffee },
  { id: 'DESSERT', label: 'Desserts', icon: Sparkles }
];

export function StudentCafeteriaSection() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockOnly, setStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [tray, setTray] = useState({}); // { [itemId]: { item, count } }
  const [toast, setToast] = useState(null);

  const fetchMenu = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/student/cafeteria');
      const items = Array.isArray(res) ? res : (res?.data || []);
      setMenu(items);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load cafeteria menu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const addToTray = (item) => {
    if (!item.available) return;
    setTray(prev => {
      const existing = prev[item.id];
      const newCount = existing ? existing.count + 1 : 1;
      return {
        ...prev,
        [item.id]: { item, count: newCount }
      };
    });
    showToast(`Added "${item.name}" to meal tray.`);
  };

  const updateTrayCount = (itemId, delta) => {
    setTray(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const newCount = existing.count + delta;
      if (newCount <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, count: newCount }
      };
    });
  };

  const clearTray = () => {
    setTray({});
    showToast('Meal tray cleared.');
  };

  const trayItems = Object.values(tray);
  const trayTotal = trayItems.reduce((acc, t) => acc + (Number(t.item.price || 0) * t.count), 0);
  const trayItemCount = trayItems.reduce((acc, t) => acc + t.count, 0);

  const availableCount = menu.filter(m => m.available).length;
  const outOfStockCount = menu.filter(m => !m.available).length;
  const categoriesPresent = new Set(menu.map(m => (m.category || '').toUpperCase())).size;

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter(item => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const cat = (item.category || '').toUpperCase();

      const matchesSearch = !q || name.includes(q) || desc.includes(q) || cat.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'ALL' || cat === selectedCategory;
      const matchesStock = !stockOnly || item.available;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [menu, search, selectedCategory, stockOnly]);

  const getCategoryColor = (cat) => {
    const c = (cat || '').toUpperCase();
    switch (c) {
      case 'BREAKFAST': return 'day-thursday';
      case 'LUNCH': return 'day-wednesday';
      case 'SNACKS': return 'day-tuesday';
      case 'BEVERAGES': return 'day-friday';
      case 'DESSERT': return 'day-monday';
      default: return 'day-saturday';
    }
  };

  if (loading) {
    return (
      <div className="campus-subpage" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
        <p className="muted">Fetching fresh cafeteria menu...</p>
      </div>
    );
  }

  return (
    <div className="student-page campus-subpage student-cafeteria-container">
      {/* Toast Notification */}
      {toast && (
        <div
          className="admin-status-badge status-active"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '0.85rem 1.35rem',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={16} color="var(--emerald)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <SectionHeader
            title="Campus Cafeteria & Dining"
            subtitle="Explore today's live menu, real-time availability, and calculate your meal budget."
          />
        </div>
        <button
          type="button"
          className="icon-btn"
          title="Refresh Menu"
          onClick={() => fetchMenu(true)}
          disabled={refreshing}
          style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem' }}
        >
          <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Refresh Menu</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Live Dishes</span>
            <span className="metric-icon"><Utensils size={20} /></span>
          </div>
          <strong>{menu.length}</strong>
          <div className="metric-card-foot">
            <span>{categoriesPresent} Categories</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Freshly In Stock</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong style={{ color: '#047857' }}>{availableCount}</strong>
          <div className="metric-card-foot">
            <span>Ready to serve today</span>
          </div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Out of Stock</span>
            <span className="metric-icon"><XCircle size={20} /></span>
          </div>
          <strong style={{ color: '#e11d48' }}>{outOfStockCount}</strong>
          <div className="metric-card-foot">
            <span>Unavailable right now</span>
          </div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>My Meal Tray</span>
            <span className="metric-icon"><ShoppingBag size={20} /></span>
          </div>
          <strong style={{ color: 'var(--brand-orange, #f97316)' }}>
            BDT {trayTotal.toFixed(2)}
          </strong>
          <div className="metric-card-foot">
            <span>{trayItemCount} items selected</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Menu on Left, Tray on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: trayItemCount > 0 ? '1fr 340px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Menu list */}
        <div>
          {/* Category Tabs */}
          <div className="academic-tabs" style={{ marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`academic-tab${selectedCategory === cat.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter / Search Bar */}
          <div className="admin-toolbar" style={{ marginBottom: '1.25rem' }}>
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search" style={{ flex: 1, maxWidth: '380px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search dish name, description, ingredients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={stockOnly}
                  onChange={(e) => setStockOnly(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--brand-orange, #ea580c)' }}
                />
                <span>In-Stock Only</span>
              </label>
            </div>

            <div className="admin-toolbar-right" style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className={`icon-btn${viewMode === 'grid' ? ' is-active' : ''}`}
                title="Grid Cards View"
                onClick={() => setViewMode('grid')}
                style={{ padding: '0.5rem', background: viewMode === 'grid' ? 'var(--bg-card-hover, #f1f5f9)' : 'transparent' }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`icon-btn${viewMode === 'table' ? ' is-active' : ''}`}
                title="Table View"
                onClick={() => setViewMode('table')}
                style={{ padding: '0.5rem', background: viewMode === 'table' ? 'var(--bg-card-hover, #f1f5f9)' : 'transparent' }}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {error && <div className="notice error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

          {filteredMenu.length === 0 ? (
            <EmptyState
              title="No dishes found"
              message="Adjust your search or category filter to explore other available cafeteria items."
            />
          ) : viewMode === 'grid' ? (
            /* Cards View */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem'
            }}>
              {filteredMenu.map(item => {
                const isSelected = !!tray[item.id];
                const countInTray = tray[item.id]?.count || 0;
                const priceNum = Number(item.price || 0);

                return (
                  <div
                    key={item.id}
                    className="panel"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid var(--brand-orange, #ea580c)' : '1px solid var(--border-color, #e2e8f0)',
                      boxShadow: isSelected ? '0 8px 20px rgba(234, 88, 12, 0.12)' : '0 4px 12px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease-in-out',
                      opacity: item.available ? 1 : 0.65,
                      background: 'var(--bg-surface, #ffffff)',
                      padding: '1.25rem'
                    }}
                  >
                    <div>
                      {/* Top tags */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className={`day-badge ${getCategoryColor(item.category)}`} style={{ textTransform: 'capitalize', fontSize: '0.74rem' }}>
                          {item.category ? item.category.toLowerCase() : 'Meal'}
                        </span>
                        <span className={`admin-status-badge ${item.available ? 'status-active' : 'status-disabled'}`} style={{ fontSize: '0.72rem' }}>
                          {item.available ? 'AVAILABLE' : 'SOLD OUT'}
                        </span>
                      </div>

                      {/* Title & Price */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--tx-primary, #0f172a)' }}>
                          {item.name}
                        </h3>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857', whiteSpace: 'nowrap' }}>
                          BDT {priceNum.toFixed(2)}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--tx-secondary, #64748b)',
                        lineHeight: '1.45',
                        minHeight: '2.8rem',
                        margin: '0 0 1rem 0'
                      }}>
                        {item.description || 'Prepared fresh daily by UIU Central Cafeteria culinary team.'}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div style={{ borderTop: '1px solid var(--border-color, #f1f5f9)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.available ? (
                        isSelected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => updateTrayCount(item.id, -1)}
                              title="Decrease"
                              style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '18px', textAlign: 'center' }}>
                              {countInTray}
                            </span>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => updateTrayCount(item.id, 1)}
                              title="Increase"
                              style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => addToTray(item)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.45rem 0.9rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              borderRadius: '8px'
                            }}
                          >
                            <Plus size={14} /> Add to Tray
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--rose, #e11d48)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertCircle size={13} /> Unavailable
                        </span>
                      )}

                      <span style={{ fontSize: '0.72rem', color: 'var(--tx-muted, #94a3b8)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> Fresh Daily
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Dish Name</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Order / Tray</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenu.map(item => (
                      <tr key={item.id} style={{ opacity: item.available ? 1 : 0.65 }}>
                        <td>
                          <strong style={{ fontSize: '0.9rem' }}>{item.name}</strong>
                        </td>
                        <td>
                          <span className={`day-badge ${getCategoryColor(item.category)}`} style={{ textTransform: 'capitalize' }}>
                            {item.category ? item.category.toLowerCase() : 'Meal'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--tx-secondary, #64748b)' }}>
                            {item.description || '-'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.92rem', color: '#047857' }}>
                            BDT {Number(item.price || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className={`admin-status-badge ${item.available ? 'status-active' : 'status-disabled'}`}>
                            {item.available ? 'IN STOCK' : 'OUT OF STOCK'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {item.available ? (
                            tray[item.id] ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button type="button" className="icon-btn" onClick={() => updateTrayCount(item.id, -1)}><Minus size={12} /></button>
                                <strong style={{ minWidth: '18px', textAlign: 'center', fontSize: '0.85rem' }}>{tray[item.id].count}</strong>
                                <button type="button" className="icon-btn" onClick={() => updateTrayCount(item.id, 1)}><Plus size={12} /></button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="primary-btn"
                                onClick={() => addToTray(item)}
                                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                              >
                                + Add
                              </button>
                            )
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--tx-muted, #94a3b8)' }}>Sold out</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Meal Tray / Budget Calculator */}
        {trayItemCount > 0 && (
          <div
            className="panel"
            style={{
              position: 'sticky',
              top: '80px',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--bg-surface, #ffffff)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
            }}
          >
            <div className="panel-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} color="var(--brand-orange, #ea580c)" />
                <h3 style={{ margin: 0, fontSize: '0.98rem' }}>Meal Tray Budget</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                title="Clear Tray"
                onClick={clearTray}
                style={{ color: 'var(--rose, #e11d48)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="panel-body" style={{ padding: '1rem 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                {trayItems.map(({ item, count }) => {
                  const sub = Number(item.price || 0) * count;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.84rem',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        background: 'var(--bg-main, #f8fafc)'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--tx-primary, #0f172a)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--tx-secondary, #64748b)' }}>
                          BDT {Number(item.price || 0).toFixed(2)} x {count}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => updateTrayCount(item.id, -1)}
                          style={{ width: '22px', height: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={11} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '16px', textAlign: 'center', fontSize: '0.8rem' }}>{count}</span>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => updateTrayCount(item.id, 1)}
                          style={{ width: '22px', height: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={11} />
                        </button>
                        <strong style={{ marginLeft: '0.4rem', color: '#047857', minWidth: '55px', textAlign: 'right' }}>
                          BDT {sub.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total calculation */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px dashed var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.84rem', color: 'var(--tx-secondary, #64748b)' }}>
                  <span>Total Items:</span>
                  <span style={{ fontWeight: 600 }}>{trayItemCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--tx-primary, #0f172a)' }}>Estimated Bill:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-orange, #ea580c)' }}>
                    BDT {trayTotal.toFixed(2)}
                  </span>
                </div>
                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.72rem', color: 'var(--tx-muted, #94a3b8)', textAlign: 'center' }}>
                  Pay at UIU Cafeteria counter via Cash or bKash / Nagad.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
