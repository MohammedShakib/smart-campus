import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  Tag,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Archive,
  Image as ImageIcon,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function LostFoundAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [resolvingItem, setResolvingItem] = useState(null); // { item, action: 'RETURNED' | 'CLOSE' }
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/campus-operations/lost-found');
      setItems(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load lost and found items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async () => {
    if (!resolvingItem) return;
    setSubmitting(true);
    try {
      await api(`/api/admin/campus-operations/lost-found/${resolvingItem.item.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action: resolvingItem.action })
      });
      setToastMessage({
        type: 'success',
        text: `Item "${resolvingItem.item.title}" marked as ${resolvingItem.action === 'RETURNED' ? 'Returned to Owner' : 'Closed'}.`
      });
      setResolvingItem(null);
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to resolve item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = items.length;
  const lostCount = items.filter(i => i.type === 'LOST' && i.status !== 'RESOLVED').length;
  const foundCount = items.filter(i => i.type === 'FOUND' && i.status !== 'RESOLVED').length;
  const resolvedCount = items.filter(i => i.status === 'RESOLVED').length;

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(item => {
      const matchSearch = !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.reporterName && item.reporterName.toLowerCase().includes(q)) ||
        (item.reporterId && item.reporterId.toLowerCase().includes(q));

      const matchType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchType && matchStatus && matchCategory;
    });
  }, [items, search, typeFilter, statusFilter, categoryFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="cell-chip chip-priority-medium">OPEN</span>;
      case 'CLAIM_PENDING':
        return <span className="cell-chip chip-priority-low">CLAIM PENDING</span>;
      case 'RESOLVED':
        return <span className="cell-chip chip-status-success">RESOLVED</span>;
      default:
        return <span className="cell-chip chip-status-pending">{status}</span>;
    }
  };

  return (
    <div className="campus-management-subview" style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div className={`status-badge ${toastMessage.type === 'error' ? 'badge--critical' : 'badge--occupied'}`}
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
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
            <Tag size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Total Reported</span>
            <strong className="stat-value">{totalCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Lost (Open)</span>
            <strong className="stat-value" style={{ color: '#dc2626' }}>{lostCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
            <HelpCircle size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Found (Awaiting Claim)</span>
            <strong className="stat-value" style={{ color: '#059669' }}>{foundCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Resolved & Returned</span>
            <strong className="stat-value" style={{ color: '#2563eb' }}>{resolvedCount}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <Panel
        title="Lost & Found Oversight"
        action={
          <button
            type="button"
            className="ghost-btn"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        }
      >
        {/* Filter & Search Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item, location, reporter..."
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  paddingRight: '10px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '0.82rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 0.65rem', background: '#fff', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Types</option>
              <option value="LOST">Lost Only</option>
              <option value="FOUND">Found Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 0.65rem', background: '#fff', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLAIM_PENDING">Claim Pending</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ height: '36px', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 0.65rem', background: '#fff', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--tx-muted)' }}>
            <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
            <div>Loading lost & found reports...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
            <ShieldAlert size={28} style={{ marginBottom: '0.5rem' }} />
            <div>{error}</div>
            <button className="ghost-btn" onClick={() => fetchData(true)} style={{ marginTop: '0.75rem' }}>Retry</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No Items Found"
            message={search || typeFilter !== 'ALL' || statusFilter !== 'ALL' ? "No reports match your selected filters." : "No lost or found items reported yet."}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Type / Category</th>
                  <th>Location & Date</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    {/* Item details */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            background: item.type === 'LOST' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                            color: item.type === 'LOST' ? '#dc2626' : '#059669',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0
                          }}>
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--tx-primary)' }}>{item.title}</strong>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--tx-secondary)', maxWidth: '280px', whiteSpace: 'normal' }}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type & Category */}
                    <td>
                      <span className={`cell-chip ${item.type === 'LOST' ? 'chip-priority-high' : 'chip-status-success'}`} style={{ marginBottom: '0.2rem' }}>
                        {item.type}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--tx-muted)', textTransform: 'capitalize' }}>
                        {item.category || 'General'}
                      </div>
                    </td>

                    {/* Location & Date */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--tx-primary)' }}>
                        <MapPin size={13} style={{ color: 'var(--tx-muted)' }} />
                        <span>{item.location || 'Campus'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--tx-muted)', marginTop: '0.2rem' }}>
                        <Calendar size={12} />
                        <span>{item.itemDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent')}</span>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '600', color: 'var(--tx-primary)' }}>
                        <User size={13} style={{ color: 'var(--tx-muted)' }} />
                        <span>{item.reporterName || 'Anonymous'}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--tx-muted)', marginTop: '0.1rem' }}>
                        {item.reporterId || item.reporterEmail}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      {item.status !== 'RESOLVED' ? (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="primary-btn"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.32rem 0.65rem',
                              minHeight: '28px',
                              background: '#059669',
                              borderColor: '#059669'
                            }}
                            onClick={() => setResolvingItem({ item, action: 'RETURNED' })}
                            title="Mark Returned to Owner"
                          >
                            <Check size={13} />
                            <span>Return</span>
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            style={{ fontSize: '0.75rem', padding: '0.32rem 0.65rem', minHeight: '28px' }}
                            onClick={() => setResolvingItem({ item, action: 'CLOSE' })}
                            title="Close / Archive Ticket"
                          >
                            <Archive size={13} />
                            <span>Close</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--tx-muted)', fontStyle: 'italic' }}>
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Confirmation Modal */}
      {resolvingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'grid',
            gap: '1.2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: resolvingItem.action === 'RETURNED' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                  color: resolvingItem.action === 'RETURNED' ? '#059669' : '#475569',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  {resolvingItem.action === 'RETURNED' ? <Check size={20} /> : <Archive size={20} />}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--tx-primary)', margin: 0 }}>
                  {resolvingItem.action === 'RETURNED' ? 'Confirm Return' : 'Close Ticket'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--tx-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to mark <strong>"{resolvingItem.item.title}"</strong> as{' '}
              <strong style={{ color: resolvingItem.action === 'RETURNED' ? '#059669' : '#475569' }}>
                {resolvingItem.action === 'RETURNED' ? 'Returned to Owner' : 'Closed'}
              </strong>? This updates the status in the central database.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setResolvingItem(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{
                  background: resolvingItem.action === 'RETURNED' ? '#059669' : '#475569',
                  borderColor: resolvingItem.action === 'RETURNED' ? '#059669' : '#475569'
                }}
                onClick={handleResolve}
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
