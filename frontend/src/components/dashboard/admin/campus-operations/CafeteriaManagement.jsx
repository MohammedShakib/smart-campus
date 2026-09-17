import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Tag,
  Save,
  X,
  RefreshCw,
  Sparkles,
  Trash2,
  Edit2
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

const CATEGORIES = ['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES', 'DESSERT'];

export default function CafeteriaManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: null,
    name: '',
    category: 'LUNCH',
    description: '',
    price: '',
    available: true
  });

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/campus-operations/cafeteria');
      setMenuItems(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load cafeteria menu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.toUpperCase(),
        description: form.description.trim(),
        price: Number(form.price),
        available: Boolean(form.available)
      };

      if (!payload.name || isNaN(payload.price) || payload.price < 0) {
        throw new Error('Please provide a valid item name and price.');
      }

      if (form.id) {
        await api(`/api/admin/campus-operations/cafeteria/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: `Menu item "${payload.name}" updated successfully.` });
      } else {
        await api('/api/admin/campus-operations/cafeteria', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: `Menu item "${payload.name}" added successfully.` });
      }
      setIsCreateModalOpen(false);
      setForm({ id: null, name: '', category: 'LUNCH', description: '', price: '', available: true });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save menu item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvailabilityToggle = async (item) => {
    try {
      await api(`/api/admin/campus-operations/cafeteria/${item.id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ available: !item.available })
      });
      setToastMessage({
        type: 'success',
        text: `"${item.name}" marked as ${!item.available ? 'In Stock (Available)' : 'Out of Stock'}.`
      });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update availability.' });
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) {
      return;
    }
    try {
      await api(`/api/admin/campus-operations/cafeteria/${id}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: `Menu item "${name}" removed.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete item.' });
    }
  };

  const availableCount = menuItems.filter(i => i.available).length;
  const outOfStockCount = menuItems.filter(i => !i.available).length;
  const uniqueCats = new Set(menuItems.map(i => i.category)).size;

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter(item => {
      const matchSearch = !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchCat = categoryFilter === 'ALL' || (item.category && item.category.toUpperCase() === categoryFilter);

      return matchSearch && matchCat;
    });
  }, [menuItems, search, categoryFilter]);

  return (
    <div className="campus-subpage cafeteria-management-view">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`status-badge ${toastMessage.type === 'error' ? 'badge--critical' : 'badge--occupied'}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}
        >
          {toastMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Total Menu Items</span>
            <span className="metric-icon"><Utensils size={20} /></span>
          </div>
          <strong>{menuItems.length}</strong>
          <div className="metric-card-foot">
            <span>{uniqueCats} Food Categories</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>In Stock</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong style={{ color: '#047857' }}>{availableCount}</strong>
          <div className="metric-card-foot">
            <span>Ready to order</span>
          </div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Out of Stock</span>
            <span className="metric-icon"><XCircle size={20} /></span>
          </div>
          <strong style={{ color: outOfStockCount > 0 ? '#b91c1c' : 'var(--tx-muted)' }}>{outOfStockCount}</strong>
          <div className="metric-card-foot">
            <span>Temporarily unavailable</span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel
          title="Cafeteria & Dining Inventory"
          tag={`${filteredItems.length} ITEMS`}
          action={
            <button
              type="button"
              className="ghost-btn"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          }
        >
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search item name, ingredients, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-toolbar-right">
              <ActionButton
                label="Add Menu Item"
                icon={Plus}
                onClick={() => {
                  setForm({ id: null, name: '', category: 'LUNCH', description: '', price: '', available: true });
                  setIsCreateModalOpen(true);
                }}
              />
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading cafeteria menu...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredItems.length === 0 ? (
            <EmptyState title="No menu items found" message="Add items to the cafeteria menu or change filters." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Price (BDT)</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} style={{ opacity: item.available ? 1 : 0.75 }}>
                      <td>
                        <strong style={{ fontSize: '0.88rem' }}>{item.name}</strong>
                      </td>
                      <td>
                        <span className="day-badge day-monday" style={{ textTransform: 'capitalize' }}>
                          {item.category ? item.category.toLowerCase() : 'General'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--tx-secondary)' }}>
                          {item.description || '-'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.88rem', color: '#047857' }}>
                          ৳ {Number(item.price || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${item.available ? 'status-active' : 'status-disabled'}`}>
                          {item.available ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit Menu Item"
                            onClick={() => {
                              setForm({
                                id: item.id,
                                name: item.name || '',
                                category: item.category || 'LUNCH',
                                description: item.description || '',
                                price: item.price !== undefined && item.price !== null ? String(item.price) : '',
                                available: !!item.available
                              });
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className={`action-pill-btn ${item.available ? 'action-pill-btn--reject' : 'action-pill-btn--approve'}`}
                            onClick={() => handleAvailabilityToggle(item)}
                            title={item.available ? "Mark as Out of Stock" : "Mark as In Stock"}
                          >
                            {item.available ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                            <span>{item.available ? 'Set Out of Stock' : 'Set Available'}</span>
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Delete Menu Item"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                          >
                            <Trash2 size={14} color="var(--rose)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Modal: Create/Edit Item */}
      {isCreateModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setIsCreateModalOpen(false)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Cafeteria Dining</span>
                <h2>{form.id ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsCreateModalOpen(false)}><X size={16} /></button>
            </header>
            <form onSubmit={handleFormSubmit} className="standard-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicken Biryani / Cappuccino"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="LUNCH">Lunch Meal</option>
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="SNACKS">Snacks / Bakery</option>
                    <option value="BEVERAGES">Beverages & Coffee</option>
                    <option value="DESSERT">Dessert</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Price (BDT) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="e.g. 150.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Stock Status</label>
                  <select
                    value={form.available ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, available: e.target.value === 'true' })}
                  >
                    <option value="true">In Stock (Available)</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Description & Ingredients</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Fragrant basmati rice served with tender chicken roast, egg, and salad."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <Save size={16} /> {submitting ? 'Saving...' : form.id ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
