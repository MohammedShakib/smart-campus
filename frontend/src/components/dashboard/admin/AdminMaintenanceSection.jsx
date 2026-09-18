import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Search,
  RefreshCw,
  X,
  Save,
  MapPin,
  User,
  Tag,
  Calendar,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  XCircle
} from 'lucide-react';
import { api } from '../../../utils/api';
import { Panel, EmptyState } from '../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export function AdminMaintenanceSection({ data, reload }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/campus-operations/complaints');
      setComplaints(dataOf(res));
      setError(null);
    } catch (err) {
      // Fallback to data.queuedComplaints if available
      if (data?.queuedComplaints) {
        setComplaints(data.queuedComplaints);
      } else {
        setError(err.message || 'Failed to load maintenance complaints.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessNext = async () => {
    setSubmitting(true);
    try {
      const res = await api('/api/campus/complaint/process-next', { method: 'POST' });
      setToastMessage({
        type: 'success',
        text: res.message || 'Dequeued and processed next ticket in FIFO queue.'
      });
      loadData();
      if (reload) reload();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to process next queue item.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);

    try {
      await api(`/api/admin/campus-operations/complaints/${selectedComplaint.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editStatus,
          resolutionNote: editNote
        })
      });
      setToastMessage({
        type: 'success',
        text: `Complaint #${selectedComplaint.id} updated to ${editStatus}.`
      });
      setSelectedComplaint(null);
      setEditNote('');
      loadData();
      if (reload) reload();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to update complaint status.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdateModal = (c) => {
    setSelectedComplaint(c);
    setEditStatus(c.status || 'OPEN');
    setEditNote(c.resolutionNote || '');
  };

  // Metrics
  const totalCount = complaints.length;
  const queuePendingCount = complaints.filter(c => c.status === 'OPEN' || c.status === 'PENDING').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  const categories = useMemo(() => {
    const set = new Set();
    complaints.forEach(c => { if (c.category) set.add(c.category); });
    return Array.from(set);
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter(c => {
      const matchSearch = !q ||
        (c.issueTitle && c.issueTitle.toLowerCase().includes(q)) ||
        (c.issueDescription && c.issueDescription.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.reporterName && c.reporterName.toLowerCase().includes(q)) ||
        (c.reporterId && c.reporterId.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
      const matchCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [complaints, search, statusFilter, priorityFilter, categoryFilter]);

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'HIGH':
      case 'URGENT':
        return <span className="cell-chip chip-priority-high">{p}</span>;
      case 'MEDIUM':
        return <span className="cell-chip chip-priority-medium">MEDIUM</span>;
      case 'LOW':
        return <span className="cell-chip chip-priority-low">LOW</span>;
      default:
        return <span className="cell-chip chip-status-pending">{p || 'NORMAL'}</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'OPEN':
      case 'PENDING':
        return <span className="cell-chip chip-priority-medium">QUEUED</span>;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return <span className="cell-chip chip-status-progress">{s.replace('_', ' ')}</span>;
      case 'RESOLVED':
        return <span className="cell-chip chip-status-success">RESOLVED</span>;
      case 'CLOSED':
        return <span className="cell-chip chip-status-pending">CLOSED</span>;
      default:
        return <span className="cell-chip chip-status-pending">{s}</span>;
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
            <span>Administration</span> &gt; <span className="breadcrumb-active">Maintenance & Facility Tickets</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--tx-primary)', margin: '0.2rem 0' }}>
            Facility Maintenance & Complaints
          </h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--tx-secondary)' }}>
            Real-time FIFO queue dispatcher, technician assignment, priority tracking, and resolution history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="primary-btn"
            onClick={handleProcessNext}
            disabled={queuePendingCount === 0 || submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: queuePendingCount > 0 ? '#4f46e5' : '#94a3b8',
              borderColor: queuePendingCount > 0 ? '#4f46e5' : '#94a3b8'
            }}
          >
            <PlayCircle size={16} />
            <span>Dequeue Next (FIFO)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid maintenance-metric-grid">
        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Total Logged Tickets</span>
            <span className="metric-icon"><Wrench size={20} /></span>
          </div>
          <strong>{totalCount}</strong>
          <div className="metric-card-foot">
            <span>All facility reports</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>FIFO Pending Queue</span>
            <span className="metric-icon"><Clock size={20} /></span>
          </div>
          <strong>{queuePendingCount}</strong>
          <div className="metric-card-foot">
            <span>Awaiting dispatch</span>
          </div>
        </div>

        <div className="metric-card metric-card--resolved">
          <div className="metric-card-head">
            <span>In Progress / Assigned</span>
            <span className="metric-icon"><PlayCircle size={20} /></span>
          </div>
          <strong>{inProgressCount}</strong>
          <div className="metric-card-foot">
            <span>Technician activity</span>
          </div>
        </div>

        <div className="metric-card metric-card--found">
          <div className="metric-card-head">
            <span>Resolved & Closed</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong>{resolvedCount}</strong>
          <div className="metric-card-foot">
            <span>Completed tickets</span>
          </div>
        </div>
      </div>

      {/* Table Panel */}
      <Panel
        title="Complaints & Dispatch Roster"
        action={
          <button
            type="button"
            className="ghost-btn"
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        }
      >
        {/* Search & Filter Toolbar */}
        <div className="admin-toolbar maintenance-toolbar">
          <div className="admin-toolbar-left">
            <div className="admin-search maintenance-search">
              <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issue title, description, location, or reporter..."
            />
            </div>
          </div>

          <div className="admin-toolbar-right">
            <div className="admin-filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Queued)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            </div>

            <div className="admin-filter-group">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
            </div>

            {categories.length > 0 && (
              <div className="admin-filter-group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              </div>
            )}
          </div>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--tx-muted)' }}>
            <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
            <div>Loading maintenance complaints...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
            <ShieldAlert size={28} style={{ marginBottom: '0.5rem' }} />
            <div>{error}</div>
            <button className="ghost-btn" onClick={() => loadData(true)} style={{ marginTop: '0.75rem' }}>Retry</button>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No Complaints Found"
            message={search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? "No tickets match your filter criteria." : "No maintenance complaints reported yet. Queue is empty."}
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table maintenance-table">
              <thead>
                <tr>
                  <th>Ticket & Issue</th>
                  <th>Location</th>
                  <th>Reporter Info</th>
                  <th>Priority</th>
                  <th>Status & Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c, idx) => (
                  <tr key={c.id}>
                    {/* Ticket and Issue */}
                    <td>
                      <div style={{ maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.1rem 0.4rem',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                            color: '#475569'
                          }}>
                            #{c.id}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                            {c.category || 'General'}
                          </span>
                        </div>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--tx-primary)' }}>
                          {c.issueTitle}
                        </strong>
                        <p style={{
                          margin: '0.15rem 0 0',
                          fontSize: '0.78rem',
                          color: 'var(--tx-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.45
                        }}>
                          {c.issueDescription}
                        </p>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--tx-primary)' }}>
                        <MapPin size={13} style={{ color: 'var(--tx-muted)' }} />
                        <span>{c.location || 'Campus'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: 'var(--tx-muted)', marginTop: '0.2rem' }}>
                        <Calendar size={11} />
                        <span>{c.reportedAt ? new Date(c.reportedAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '600', color: 'var(--tx-primary)' }}>
                        <User size={13} style={{ color: 'var(--tx-muted)' }} />
                        <span>{c.reporterName || 'Anonymous'}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--tx-muted)', marginTop: '0.1rem' }}>
                        {c.reporterId || c.reporterEmail}
                      </div>
                    </td>

                    {/* Priority */}
                    <td>
                      {getPriorityBadge(c.priority)}
                    </td>

                    {/* Status & Resolution note */}
                    <td>
                      {getStatusBadge(c.status)}
                      {c.resolutionNote && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.72rem',
                          color: 'var(--tx-muted)',
                          marginTop: '0.25rem',
                          maxWidth: '180px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={c.resolutionNote}>
                          <MessageSquare size={10} />
                          <span>{c.resolutionNote}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="primary-btn"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.32rem 0.7rem',
                          minHeight: '28px'
                        }}
                        onClick={() => openUpdateModal(c)}
                      >
                        <span>Update Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Update Status Modal */}
      {selectedComplaint && (
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
            maxWidth: '520px',
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
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--tx-primary)', margin: 0 }}>
                    Update Ticket #{selectedComplaint.id}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--tx-muted)' }}>
                    {selectedComplaint.issueTitle} • {selectedComplaint.location}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                  Progress Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    fontSize: '0.86rem'
                  }}
                >
                  <option value="OPEN">Open (In Queue)</option>
                  <option value="ASSIGNED">Assigned to Technician</option>
                  <option value="IN_PROGRESS">In Progress / Fixing</option>
                  <option value="RESOLVED">Resolved & Fixed</option>
                  <option value="CLOSED">Closed / Archived</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--tx-primary)', marginBottom: '0.35rem' }}>
                  Resolution Notes / Action Taken
                </label>
                <textarea
                  rows={4}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Technician replaced the faulty projector lamp in Room 524. System tested and functional."
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
                  onClick={() => setSelectedComplaint(null)}
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
                  <Save size={14} />
                  <span>{submitting ? 'Saving...' : 'Save & Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
