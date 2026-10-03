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
  AlertCircle,
  Banknote,
  CreditCard,
  Loader2,
  ReceiptText,
  X
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
  const [paymentMethod, setPaymentMethod] = useState('SSLCOMMERZ');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [activeCafeteriaTab, setActiveCafeteriaTab] = useState('menu');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api('/api/student/cafeteria/payments');
      setPaymentHistory(res?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load payment history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const transactionId = params.get('tran_id');
    if (!paymentStatus) return;

    const statusCopy = {
      success: {
        type: 'success',
        title: 'Payment Successful',
        text: `Payment successful${transactionId ? ` for ${transactionId}` : ''}. Your cafeteria order is ready for counter confirmation.`
      },
      failed: {
        type: 'error',
        title: 'Payment Failed',
        text: `Payment failed${transactionId ? ` for ${transactionId}` : ''}. Please try again or choose cash at counter.`
      },
      cancelled: {
        type: 'warning',
        title: 'Payment Cancelled',
        text: `Payment cancelled${transactionId ? ` for ${transactionId}` : ''}. Your meal tray was not charged.`
      }
    };

    setPaymentNotice(statusCopy[paymentStatus] || null);
    fetchPaymentHistory();
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

  const checkoutTray = async () => {
    if (trayItemCount <= 0 || checkoutBusy) return;
    setCheckoutBusy(true);
    setError(null);

    try {
      const payload = {
        paymentMethod,
        items: trayItems.map(({ item, count }) => ({
          itemId: item.id,
          quantity: count
        }))
      };
      const res = await api('/api/student/cafeteria/checkout', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const checkout = res?.data;

      if (paymentMethod === 'SSLCOMMERZ') {
        if (!checkout?.gatewayUrl) {
          throw new Error('Payment gateway did not return a checkout URL.');
        }
        window.location.assign(checkout.gatewayUrl);
        return;
      }

      setPaymentNotice({
        type: 'success',
        title: 'Cash Payment Noted',
        text: checkout?.message || 'Cash order noted. Please pay at the cafeteria counter.'
      });
      fetchPaymentHistory();
      clearTray();
    } catch (err) {
      setError(err.message || 'Unable to start cafeteria checkout.');
    } finally {
      setCheckoutBusy(false);
    }
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

  const getPaymentStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID' || s === 'COUNTER_PAYMENT') return 'status-active';
    if (s === 'FAILED' || s === 'CANCELLED' || s === 'INIT_FAILED') return 'status-disabled';
    return 'status-pending';
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      {paymentNotice && (
        <div className="payment-modal-backdrop" role="presentation" onMouseDown={() => setPaymentNotice(null)}>
          <section
            className={`payment-modal payment-modal--${paymentNotice.type}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="payment-modal-close"
              onClick={() => setPaymentNotice(null)}
              aria-label="Close payment message"
            >
              <X size={16} />
            </button>
            <div className="payment-modal-icon">
              {paymentNotice.type === 'success' ? <CheckCircle2 size={26} /> : <AlertCircle size={26} />}
            </div>
            <div>
              <span>CAFETERIA PAYMENT</span>
              <h3 id="payment-modal-title">{paymentNotice.title || 'Payment Update'}</h3>
              <p>{paymentNotice.text}</p>
            </div>
          </section>
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
          className="cafeteria-refresh-btn"
          title="Refresh Menu"
          onClick={() => fetchMenu(true)}
          disabled={refreshing}
        >
          <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing' : 'Refresh Menu'}</span>
        </button>
      </div>

      <div className="academic-tabs cafeteria-main-tabs" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`academic-tab${activeCafeteriaTab === 'menu' ? ' is-active' : ''}`}
          onClick={() => setActiveCafeteriaTab('menu')}
        >
          <Utensils size={14} />
          <span>Menu & Checkout</span>
        </button>
        <button
          type="button"
          className={`academic-tab${activeCafeteriaTab === 'history' ? ' is-active' : ''}`}
          onClick={() => {
            setActiveCafeteriaTab('history');
            fetchPaymentHistory();
          }}
        >
          <ReceiptText size={14} />
          <span>Payment History</span>
        </button>
      </div>

      {activeCafeteriaTab === 'history' ? (
        <div className="panel cafeteria-history-panel">
          <div className="meal-tray-header">
            <div className="meal-tray-title">
              <ReceiptText size={18} color="var(--accent-dark)" />
              <h3>Payment History</h3>
            </div>
            <button
              type="button"
              className="cafeteria-refresh-btn"
              onClick={fetchPaymentHistory}
              disabled={historyLoading}
              style={{ marginTop: 0 }}
            >
              <RotateCw size={15} className={historyLoading ? 'animate-spin' : ''} />
              <span>{historyLoading ? 'Refreshing' : 'Refresh'}</span>
            </button>
          </div>

          {historyLoading ? (
            <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>Loading payment history...</p>
          ) : paymentHistory.length === 0 ? (
            <EmptyState
              title="No payments yet"
              message="Your cafeteria checkout and SSLCommerz payment records will appear here."
            />
          ) : (
            <div className="admin-table-wrap cafeteria-history-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Items</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id || payment.transactionId}>
                      <td>
                        <strong>{payment.transactionId}</strong>
                        {payment.gatewayCardType && <span className="muted cafeteria-history-subtext">{payment.gatewayCardType}</span>}
                      </td>
                      <td>
                        <span className="cafeteria-history-items">{payment.itemsSummary}</span>
                        <span className="muted cafeteria-history-subtext">{payment.totalItems} item{payment.totalItems === 1 ? '' : 's'}</span>
                      </td>
                      <td>{payment.paymentMethod === 'SSLCOMMERZ' ? 'SSLCommerz' : 'Cash'}</td>
                      <td>
                        <span className={`admin-status-badge ${getPaymentStatusClass(payment.status)}`}>
                          {String(payment.status || '').replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--brand-orange, #ea580c)' }}>
                          BDT {Number(payment.totalAmount || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>{formatDateTime(payment.paidAt || payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>

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
            className="panel meal-tray-panel"
          >
            <div className="meal-tray-header">
              <div className="meal-tray-title">
                <ShoppingBag size={18} color="var(--brand-orange, #ea580c)" />
                <h3>Meal Tray Budget</h3>
              </div>
              <button
                type="button"
                className="meal-tray-clear-btn"
                title="Clear Tray"
                aria-label="Clear meal tray"
                onClick={clearTray}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="meal-tray-body">
              <div className="meal-tray-list">
                {trayItems.map(({ item, count }) => {
                  const sub = Number(item.price || 0) * count;
                  return (
                    <div
                      key={item.id}
                      className="meal-tray-row"
                    >
                      <div className="meal-tray-item-copy">
                        <strong>{item.name}</strong>
                        <span>
                          BDT {Number(item.price || 0).toFixed(2)} x {count}
                        </span>
                      </div>

                      <div className="meal-tray-row-actions">
                        <button
                          type="button"
                          className="meal-tray-stepper"
                          onClick={() => updateTrayCount(item.id, -1)}
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus size={11} />
                        </button>
                        <span>{count}</span>
                        <button
                          type="button"
                          className="meal-tray-stepper"
                          onClick={() => updateTrayCount(item.id, 1)}
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus size={11} />
                        </button>
                        <strong>
                          BDT {sub.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total calculation */}
              <div className="meal-tray-summary">
                <div className="meal-tray-summary-row">
                  <span>Total Items:</span>
                  <strong>{trayItemCount}</strong>
                </div>
                <div className="meal-tray-total-row">
                  <span>Estimated Bill:</span>
                  <strong>
                    BDT {trayTotal.toFixed(2)}
                  </strong>
                </div>
                <p>
                  Choose cash at counter, or continue to SSLCommerz for bKash, cards, and mobile banking demo payment.
                </p>
              </div>

              <div className="meal-tray-payment">
                <div className="meal-tray-payment-options" role="group" aria-label="Payment method">
                  <button
                    type="button"
                    className={paymentMethod === 'SSLCOMMERZ' ? 'is-active' : ''}
                    onClick={() => setPaymentMethod('SSLCOMMERZ')}
                  >
                    <CreditCard size={15} />
                    <span>bKash / Online</span>
                  </button>
                  <button
                    type="button"
                    className={paymentMethod === 'CASH' ? 'is-active' : ''}
                    onClick={() => setPaymentMethod('CASH')}
                  >
                    <Banknote size={15} />
                    <span>Cash</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="primary-btn meal-tray-pay-btn"
                  onClick={checkoutTray}
                  disabled={checkoutBusy || trayItemCount <= 0}
                >
                  {checkoutBusy ? <Loader2 size={16} className="animate-spin" /> : paymentMethod === 'SSLCOMMERZ' ? <CreditCard size={16} /> : <Banknote size={16} />}
                  <span>{checkoutBusy ? 'Starting Checkout...' : paymentMethod === 'SSLCOMMERZ' ? 'Pay with SSLCommerz' : 'Confirm Cash Payment'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
