import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Users,
  ShieldAlert,
  Send,
  Radio,
  FileText,
  Eye,
  Archive,
  Check
} from 'lucide-react';
import { api } from '../../../utils/api';
import { Panel, EmptyState } from '../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export function AdminCommunicationSection() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    audience: 'ALL',
    status: 'PUBLISHED'
  });

  const loadNotices = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/communication/notices');
      setNotices(dataOf(res));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setToastMessage({ type: 'error', text: 'Please fill in both title and announcement content.' });
      return;
    }

    setSubmitting(true);
    try {
      await api('/api/admin/communication/notices', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setToastMessage({ type: 'success', text: `Notice "${form.title}" published successfully.` });
      setShowCreateModal(false);
      setForm({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        audience: 'ALL',
        status: 'PUBLISHED'
      });
      loadNotices();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to publish notice.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await api(`/api/admin/communication/notices/${deletingId}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: 'Notice deleted successfully.' });
      setDeletingId(null);
      loadNotices();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete notice.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (notice) => {
    const nextStatus = notice.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    try {
      await api(`/api/admin/communication/notices/${notice.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      setToastMessage({ type: 'success', text: `Notice status set to ${nextStatus}.` });
      loadNotices();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update notice status.' });
    }
  };

  // Metrics
  const totalCount = notices.length;
  const publishedCount = notices.filter(n => n.status === 'PUBLISHED').length;
  const highPriorityCount = notices.filter(n => n.priority === 'HIGH' || n.priority === 'URGENT').length;
  const generalCount = notices.filter(n => n.audience === 'ALL').length;

  const filteredNotices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notices.filter(n => {
      const matchSearch = !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.postedBy && n.postedBy.toLowerCase().includes(q));

      const matchAudience = audienceFilter === 'ALL' || n.audience === audienceFilter;
      const matchPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
      const matchCategory = categoryFilter === 'ALL' || n.category === categoryFilter;

      return matchSearch && matchAudience && matchPriority && matchCategory;
    });
  }, [notices, search, audienceFilter, priorityFilter, categoryFilter]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return <span className="cell-chip chip-priority-high">{priority}</span>;
      case 'MEDIUM':
        return <span className="cell-chip chip-priority-medium">MEDIUM</span>;
      case 'LOW':
        return <span className="cell-chip chip-priority-low">LOW</span>;
      default:
        return <span className="cell-chip chip-status-pending">{priority}</span>;
    }
  };

  const getAudienceLabel = (aud) => {
    switch (aud) {
      case 'ALL': return 'Everyone';
      case 'STUDENTS': return 'Students';
      case 'TEACHERS': return 'Teachers';
      case 'ADMIN': return 'Administrators';
      case 'SECURITY': return 'Security Staff';
      default: return aud;
    }
  };

  return (
    <div className="campus-management-subview" style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Toast Notification */}
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="breadcrumb">
            <span>Administration</span> &gt; <span className="breadcrumb-active">Communication Hub</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--tx-primary)', margin: '0.2rem 0' }}>
            Communication & Bulletins
          </h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--tx-secondary)' }}>
            Broadcast campus-wide notices, targeted announcements, and real-time emergency bulletins.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Plus size={16} />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
            <Radio size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Total Bulletins</span>
            <strong className="stat-value">{totalCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Live / Published</span>
            <strong className="stat-value" style={{ color: '#059669' }}>{publishedCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">High Priority</span>
            <strong className="stat-value" style={{ color: '#dc2626' }}>{highPriorityCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}>
            <Users size={22} />
          </div>
          <div className="stat-card-copy">
            <span className="stat-label">Campus-wide (All)</span>
            <strong className="stat-value" style={{ color: '#2563eb' }}>{generalCount}</strong>
          </div>
        </div>
      </div>

      {/* Notices Table Panel */}
      <Panel
        title="Published Notices & Broadcasts"
        action={
          <button
            type="button"
            className="ghost-btn"
            onClick={() => loadNotices(true)}
            disabled={refreshing}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        }
      >
        {/* Search & Filters */}
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
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices by title, content or author..."
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

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 0.65rem', background: '#fff', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Audiences</option>
              <option value="STUDENTS">Students Only</option>
              <option value="TEACHERS">Teachers Only</option>
              <option value="ADMIN">Admins Only</option>
              <option value="SECURITY">Security Only</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 0.65rem', background: '#fff', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High / Urgent</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: '36px', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 0.65rem', background: '#fff', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="ACADEMIC">Academic</option>
              <option value="TRANSPORT">Transport</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>
        </div>

        {/* Notice List Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--tx-muted)' }}>
            <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
            <div>Loading communications...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
            <ShieldAlert size={28} style={{ marginBottom: '0.5rem' }} />
            <div>{error}</div>
            <button className="ghost-btn" onClick={() => loadNotices(true)} style={{ marginTop: '0.75rem' }}>Retry</button>
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No Notices Found"
            message={search || audienceFilter !== 'ALL' || priorityFilter !== 'ALL' ? "No bulletins match your active filters." : "No notices published yet. Click 'Publish Notice' above to start."}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Announcement</th>
                  <th>Target Audience</th>
                  <th>Category & Priority</th>
                  <th>Published By</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map(notice => (
                  <tr key={notice.id}>
                    {/* Notice info */}
                    <td>
                      <div style={{ maxWidth: '340px' }}>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            color: 'var(--tx-primary)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedNotice(notice)}
                        >
                          {notice.title}
                        </strong>
                        <p style={{
                          margin: '0.2rem 0 0',
                          fontSize: '0.8rem',
                          color: 'var(--tx-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.45
                        }}>
                          {notice.content}
                        </p>
                      </div>
                    </td>

                    {/* Audience */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--tx-primary)' }}>
                        <Users size={13} style={{ color: 'var(--accent-dark)' }} />
                        <strong>{getAudienceLabel(notice.audience)}</strong>
                      </div>
                    </td>

                    {/* Category & Priority */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {getPriorityBadge(notice.priority)}
                        <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                          {notice.category}
                        </span>
                      </div>
                    </td>

                    {/* Author & Date */}
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--tx-primary)' }}>
                        {notice.postedBy || 'Admin'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem', color: 'var(--tx-muted)', marginTop: '0.15rem' }}>
                        <Clock size={11} />
                        <span>{notice.postedAt ? new Date(notice.postedAt).toLocaleString() : 'Recent'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`cell-chip ${notice.status === 'PUBLISHED' ? 'chip-status-success' : 'chip-status-pending'}`}>
                        {notice.status || 'PUBLISHED'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ minHeight: '30px', padding: '0 0.5rem' }}
                          onClick={() => setSelectedNotice(notice)}
                          title="Preview full notice"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ minHeight: '30px', padding: '0 0.5rem' }}
                          onClick={() => handleStatusToggle(notice)}
                          title={notice.status === 'PUBLISHED' ? 'Archive bulletin' : 'Publish bulletin'}
                        >
                          <Archive size={13} />
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ minHeight: '30px', padding: '0 0.5rem', color: '#dc2626', borderColor: 'rgba(239,68,68,0.2)' }}
                          onClick={() => setDeletingId(notice.id)}
                          title="Delete bulletin"
                        >
                          <Trash2 size={13} />
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

      {/* View Notice Detail Modal */}
      {selectedNotice && (
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
            maxWidth: '560px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'grid',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  {getPriorityBadge(selectedNotice.priority)}
                  <span className="cell-chip chip-status-pending">{selectedNotice.category}</span>
                  <span className="cell-chip chip-status-progress">{getAudienceLabel(selectedNotice.audience)}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--tx-primary)', margin: 0 }}>
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              fontSize: '0.88rem',
              color: 'var(--tx-primary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {selectedNotice.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--tx-muted)' }}>
              <span>Published by <strong>{selectedNotice.postedBy || 'Admin'}</strong></span>
              <span>{selectedNotice.postedAt ? new Date(selectedNotice.postedAt).toLocaleString() : ''}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setSelectedNotice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Notice Modal */}
      {showCreateModal && (
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
            maxWidth: '580px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'grid',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#4f46e5',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--tx-primary)', margin: 0 }}>
                    Publish Campus Notice
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--tx-muted)' }}>
                    Broadcast to students, faculty, security, or all members
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Midterm Examination Schedule Released"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                    Audience
                  </label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#fff',
                      fontSize: '0.84rem'
                    }}
                  >
                    <option value="ALL">Everyone (All)</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="ADMIN">Admins Only</option>
                    <option value="SECURITY">Security Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#fff',
                      fontSize: '0.84rem'
                    }}
                  >
                    <option value="GENERAL">General</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="SECURITY">Security</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: '#fff',
                      fontSize: '0.84rem'
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                  Bulletin Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write notice details, instructions, links, or emergency instructions..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Publishing...' : 'Publish Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
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
            maxWidth: '420px',
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
                  background: 'rgba(239,68,68,0.1)',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Trash2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--tx-primary)', margin: 0 }}>
                  Delete Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--tx-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete this notice? This action will permanently remove it from all student, teacher, and staff portals.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setDeletingId(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteNotice}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
