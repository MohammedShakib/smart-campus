import React, { useState, useEffect, useMemo } from 'react';
import {
  UsersRound,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  Building,
  KeyRound,
  RefreshCw,
  X,
  Save,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function VisitorManagement() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rejectingVisitor, setRejectingVisitor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/campus-operations/visitors');
      setVisitors(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load visitors.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id, passCode) => {
    try {
      await api(`/api/admin/campus-operations/visitors/${id}/approve`, { method: 'POST' });
      setToastMessage({ type: 'success', text: `Visitor pass (${passCode}) approved.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to approve visitor.' });
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectingVisitor) return;
    try {
      await api(`/api/admin/campus-operations/visitors/${rejectingVisitor.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason || 'Administrative decision' })
      });
      setToastMessage({ type: 'success', text: `Visitor pass (${rejectingVisitor.passCode}) rejected.` });
      setRejectingVisitor(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to reject visitor.' });
    }
  };

  const copyPassCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = visitors.filter(v => v.status === 'PENDING').length;
  const approvedCount = visitors.filter(v => v.status === 'APPROVED' || v.status === 'CHECKED_IN').length;
  const rejectedCount = visitors.filter(v => v.status === 'REJECTED').length;

  const filteredVisitors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visitors.filter(v => {
      const matchSearch = !q ||
        (v.visitorName && v.visitorName.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.hostName && v.hostName.toLowerCase().includes(q)) ||
        (v.purpose && v.purpose.toLowerCase().includes(q)) ||
        (v.passCode && v.passCode.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [visitors, search, statusFilter]);

  return (
    <div className="campus-subpage visitor-management-view">
      {toastMessage && (
        <div className={`notice ${toastMessage.type}`} style={{ marginBottom: '1rem' }}>
          {toastMessage.text}
        </div>
      )}

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Total Visitors</span>
            <span className="metric-icon"><UsersRound size={20} /></span>
          </div>
          <strong>{visitors.length}</strong>
          <div className="metric-card-foot"><span>Recorded gate applications</span></div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Pending Authorization</span>
            <span className="metric-icon"><Clock size={20} /></span>
          </div>
          <strong style={{ color: pendingCount > 0 ? '#d97706' : 'inherit' }}>
            {pendingCount}
          </strong>
          <div className="metric-card-foot"><span>Awaiting administrative review</span></div>
        </div>

        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Approved / Checked In</span>
            <span className="metric-icon"><ShieldCheck size={20} /></span>
          </div>
          <strong style={{ color: '#047857' }}>{approvedCount}</strong>
          <div className="metric-card-foot"><span>Access authorized</span></div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Declined Passes</span>
            <span className="metric-icon"><XCircle size={20} /></span>
          </div>
          <strong>{rejectedCount}</strong>
          <div className="metric-card-foot"><span>Rejected or invalid</span></div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel title="Visitor Entry Passes & Gate Authorization" tag={`${filteredVisitors.length} RECORDS`}>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by visitor name, phone, host, or pass code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="APPROVED">Approved</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="admin-toolbar-right">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading visitor records...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredVisitors.length === 0 ? (
            <EmptyState title="No visitor records found" message="No applications matched your search or filters." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Visitor Contact</th>
                    <th>Visiting Host</th>
                    <th>Purpose</th>
                    <th>Date & Time</th>
                    <th>Pass Code</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map(v => {
                    const statusClass = (v.status || 'PENDING').toLowerCase();
                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.88rem' }}>{v.visitorName}</strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>
                              <Phone size={11} style={{ display: 'inline', marginRight: 3 }} />
                              {v.phone || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{v.hostName || '-'}</span>
                            {v.hostDepartment && (
                              <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>{v.hostDepartment}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.84rem' }}>{v.purpose || 'Campus Visit'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{v.visitDate}</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>{v.expectedEntryTime || '-'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <code className="code-pill" style={{ letterSpacing: '0.08em' }}>{v.passCode}</code>
                            <button
                              type="button"
                              className="icon-btn"
                              style={{ width: '24px', height: '24px', padding: 0 }}
                              title="Copy Pass Code"
                              onClick={() => copyPassCode(v.passCode, v.id)}
                            >
                              {copiedId === v.id ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-status-badge status-${statusClass}`}>
                            {v.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {v.status === 'PENDING' ? (
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="action-pill-btn action-pill-btn--approve"
                                onClick={() => handleApprove(v.id, v.passCode)}
                              >
                                <CheckCircle2 size={13} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                className="action-pill-btn action-pill-btn--reject"
                                onClick={() => { setRejectingVisitor(v); setRejectReason(''); }}
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--tx-muted)' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Modal: Rejection Reason */}
      {rejectingVisitor && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setRejectingVisitor(null)}>
          <div className="profile-modal" role="dialog" aria-modal="true" style={{ maxWidth: '420px' }} onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Gate Authorization</span>
                <h2>Reject Visitor Entry</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setRejectingVisitor(null)}><X size={16} /></button>
            </header>
            <form onSubmit={handleRejectConfirm} className="standard-form-content">
              <p style={{ fontSize: '0.85rem', color: 'var(--tx-secondary)', marginBottom: '1rem' }}>
                State the reason for rejecting <strong>{rejectingVisitor.visitorName}</strong> ({rejectingVisitor.passCode}):
              </p>
              <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Reason / Remarks *</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Unverified host / Security policy mismatch"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}
                  required
                />
              </div>
              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setRejectingVisitor(null)}>Cancel</button>
                <button type="submit" className="action-pill-btn action-pill-btn--reject" style={{ padding: '0.5rem 1rem' }}>
                  <XCircle size={14} /> Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
