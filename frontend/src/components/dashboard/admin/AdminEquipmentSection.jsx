import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  PackageCheck,
  RotateCcw,
  Layers,
  Search,
  RefreshCw,
  Sparkles,
  Calendar,
  UserCheck,
  Send,
  HelpCircle,
  Box
} from 'lucide-react';
import { api } from '../../../utils/api';
import { readUrlOption, writeUrlOption } from '../../../utils/urlState';
import { SectionHeader, Panel, ErrorState, EmptyState } from '../../shared/SharedComponents';

const EQUIPMENT_STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'CHECKED_OUT', 'RETURNED', 'REJECTED'];

export function AdminEquipmentSection() {
  const [bookings, setBookings] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(() => readUrlOption('equipmentStatus', EQUIPMENT_STATUS_FILTERS, 'ALL'));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review / Decline Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [targetStatus, setTargetStatus] = useState('APPROVED'); // 'APPROVED' | 'REJECTED' | 'CHECKED_OUT' | 'RETURNED'
  const [adminRemarks, setAdminRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api('/api/campus/admin/equipment/bookings'),
      api('/api/student/equipment')
    ])
      .then(([bookingsRes, eqRes]) => {
        setBookings(bookingsRes.data || []);
        setEquipmentList(eqRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    writeUrlOption('equipmentStatus', filterStatus, 'ALL');
  }, [filterStatus]);

  const openReviewModal = (booking, status) => {
    setSelectedBooking(booking);
    setTargetStatus(status);
    setAdminRemarks(status === 'APPROVED' ? 'Approved for laboratory project use.' : status === 'REJECTED' ? 'Insufficient justification or project mismatch.' : '');
    setReviewModalOpen(true);
    setActionMessage(null);
  };

  const handleStatusUpdate = (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setProcessing(true);
    setActionMessage(null);

    const query = `status=${targetStatus}&remarks=${encodeURIComponent(adminRemarks || '')}`;
    api(`/api/campus/admin/equipment/bookings/${selectedBooking.id}/status?${query}`, {
      method: 'POST'
    })
      .then((res) => {
        setProcessing(false);
        setActionMessage({
          type: 'success',
          text: `Booking #${selectedBooking.id} successfully updated to ${targetStatus}!`
        });
        setTimeout(() => {
          setReviewModalOpen(false);
          loadData();
        }, 1200);
      })
      .catch((err) => {
        setProcessing(false);
        setActionMessage({ type: 'error', text: err.message });
      });
  };

  // Quick Direct Actions
  const quickAction = (bookingId, status, defaultRemark) => {
    const query = `status=${status}&remarks=${encodeURIComponent(defaultRemark || '')}`;
    api(`/api/campus/admin/equipment/bookings/${bookingId}/status?${query}`, {
      method: 'POST'
    })
      .then(() => {
        loadData();
      })
      .catch((err) => alert(err.message));
  };

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      (b.studentName && b.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.studentId && b.studentId.includes(searchQuery)) ||
      (b.equipment?.name && b.equipment.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.courseCode && b.courseCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const approvedCount = bookings.filter((b) => b.status === 'APPROVED').length;
  const checkedOutCount = bookings.filter((b) => b.status === 'CHECKED_OUT').length;
  const returnedCount = bookings.filter((b) => b.status === 'RETURNED').length;

  return (
    <div className="admin-management-page">
      <SectionHeader
        title="Hardware & Lab Equipment Checkout Management"
        subtitle="Review, accept, or decline student equipment borrowing requests. Manage laboratory stock allocations, handovers, and return logs."
      />

      {/* Metrics Row */}
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Pending Review</span>
            <span className="metric-icon" style={{ color: pendingCount > 0 ? 'var(--amber)' : 'inherit' }}><Clock size={20} /></span>
          </div>
          <strong>{pendingCount}</strong>
          <div className="metric-card-foot">
            <span>{pendingCount > 0 ? 'Requires Admin Action' : 'All Requests Processed'}</span>
          </div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Approved & Ready</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong>{approvedCount}</strong>
          <div className="metric-card-foot">
            <span>Awaiting lab pickup</span>
          </div>
        </div>

        <div className="metric-card metric-card--complaints">
          <div className="metric-card-head">
            <span>Currently Checked Out</span>
            <span className="metric-icon"><PackageCheck size={20} /></span>
          </div>
          <strong>{checkedOutCount}</strong>
          <div className="metric-card-foot">
            <span>In active student possession</span>
          </div>
        </div>

        <div className="metric-card metric-card--attendees">
          <div className="metric-card-head">
            <span>Successfully Returned</span>
            <span className="metric-icon"><RotateCcw size={20} /></span>
          </div>
          <strong>{returnedCount}</strong>
          <div className="metric-card-foot">
            <span>Stock restored to lab</span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <Panel
        title="Student Hardware Borrowing Requests"
        tag={`${filteredBookings.length} items`}
      >
        {/* Filter Bar */}
        <div className="admin-toolbar">
          <div className="admin-toolbar-left tab-pill-bar" style={{ margin: 0, gap: '0.25rem', padding: '4px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <button
              type="button"
              className={`tab-pill ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              All ({bookings.length})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterStatus === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('APPROVED')}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterStatus === 'CHECKED_OUT' ? 'active' : ''}`}
              onClick={() => setFilterStatus('CHECKED_OUT')}
            >
              Checked Out ({checkedOutCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterStatus === 'RETURNED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('RETURNED')}
            >
              Returned ({returnedCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterStatus === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('REJECTED')}
            >
              Declined ({bookings.filter((b) => b.status === 'REJECTED').length})
            </button>
          </div>

          <div className="admin-toolbar-right">
            <div className="admin-search" style={{ minWidth: '220px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search student or device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="button" className="ghost-btn" onClick={loadData} title="Refresh requests">
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading equipment requests...</p>
        ) : filteredBookings.length === 0 ? (
          <EmptyState title="No Equipment Requests Found" message="No student checkout requests match your current filters." icon={Cpu} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Req #</th>
                  <th>Student</th>
                  <th>Equipment & Qty</th>
                  <th>Borrow Window</th>
                  <th>Course & Purpose</th>
                  <th>Status</th>
                  <th>Admin Decision & Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const isPending = b.status === 'PENDING';
                  const isApproved = b.status === 'APPROVED';
                  const isCheckedOut = b.status === 'CHECKED_OUT';
                  const isReturned = b.status === 'RETURNED';
                  const isRejected = b.status === 'REJECTED';
                  const isCancelled = b.status === 'CANCELLED';

                  return (
                    <tr key={b.id}>
                      <td><strong>#{b.id}</strong></td>
                      <td>
                        <strong style={{ display: 'block', color: 'var(--tx-primary)' }}>{b.studentName}</strong>
                        <span className="muted" style={{ fontSize: '0.75rem' }}>ID: {b.studentId} • {b.studentEmail}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--tx-primary)' }}>{b.equipment?.name || 'Lab Device'}</strong>
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <span className="badge badge--sky">Qty: {b.quantity} unit{b.quantity > 1 ? 's' : ''}</span>
                          <span className="badge badge--neutral">{b.equipment?.category}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--tx-primary)', fontWeight: 600 }}>
                          {b.borrowDate} → {b.expectedReturnDate}
                        </span>
                        {b.actualReturnDate && (
                          <span className="muted" style={{ display: 'block', fontSize: '0.74rem' }}>
                            Returned on: {b.actualReturnDate}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge--emerald" style={{ marginBottom: '0.2rem', display: 'inline-block' }}>{b.courseCode}</span>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--tx-secondary)', maxWidth: '240px' }}>
                          {b.purpose || 'Academic laboratory project'}
                        </p>
                        {b.adminRemarks && (
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--tx-muted)', fontStyle: 'italic' }}>
                            Note: {b.adminRemarks}
                          </p>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge badge--${
                            isApproved
                              ? 'sky'
                              : isCheckedOut
                              ? 'violet'
                              : isReturned
                              ? 'emerald'
                              : isPending
                              ? 'amber'
                              : 'rose'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* Pending Actions: Accept or Decline */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="action-btn--approve"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.35rem 0.65rem',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => openReviewModal(b, 'APPROVED')}
                              >
                                <CheckCircle2 size={13} /> Accept
                              </button>
                              <button
                                type="button"
                                className="action-btn--decline"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.35rem 0.65rem',
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => openReviewModal(b, 'REJECTED')}
                              >
                                <XCircle size={13} /> Decline
                              </button>
                            </>
                          )}

                          {/* Approved: Dispatch or Cancel */}
                          {isApproved && (
                            <>
                              <button
                                type="button"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.35rem 0.65rem',
                                  background: '#f5f3ff',
                                  color: '#6d28d9',
                                  border: '1px solid #ddd6fe',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => quickAction(b.id, 'CHECKED_OUT', 'Dispatched from Hardware Lab')}
                              >
                                <PackageCheck size={13} /> Issue / Check Out
                              </button>
                              <button
                                type="button"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.35rem 0.55rem',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.74rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => openReviewModal(b, 'REJECTED')}
                              >
                                <XCircle size={12} /> Decline
                              </button>
                            </>
                          )}

                          {/* Checked Out: Mark Returned */}
                          {isCheckedOut && (
                            <button
                              type="button"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '0.35rem 0.65rem',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => quickAction(b.id, 'RETURNED', 'Returned in good working condition')}
                            >
                              <RotateCcw size={13} /> Mark Returned
                            </button>
                          )}

                          {/* Closed States */}
                          {(isReturned || isRejected || isCancelled) && (
                            <span className="muted" style={{ fontSize: '0.75rem' }}>
                              {isReturned ? 'Completed' : isRejected ? 'Declined' : 'Cancelled'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Review / Decision Modal */}
      {reviewModalOpen && selectedBooking && (
        <div className="modal-overlay" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {targetStatus === 'APPROVED' ? (
                  <CheckCircle2 size={22} style={{ color: 'var(--emerald)' }} />
                ) : (
                  <XCircle size={22} style={{ color: 'var(--rose)' }} />
                )}
                <h3>
                  {targetStatus === 'APPROVED' ? 'Accept & Approve Hardware Request' : 'Decline Hardware Request'}
                </h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setReviewModalOpen(false)}>×</button>
            </div>

            <div className="slot-modal-info" style={{ marginBottom: '1.25rem' }}>
              <strong>
                Request #{selectedBooking.id}: {selectedBooking.equipment?.name} (Qty: {selectedBooking.quantity})
              </strong>
              <span>
                Student: {selectedBooking.studentName} ({selectedBooking.studentId}) • {selectedBooking.courseCode}
              </span>
            </div>

            <form onSubmit={handleStatusUpdate} className="modal-form">
              <div className="form-group">
                <label>Admin Decision *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                >
                  <option value="APPROVED">Accept & Approve (Reservation Confirmed)</option>
                  <option value="REJECTED">Decline / Reject (Restores Stock to Available Pool)</option>
                  <option value="CHECKED_OUT">Mark Checked Out (Physical Handover Complete)</option>
                  <option value="RETURNED">Mark Returned (Equipment Returned & Verified)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Admin Feedback / Remarks</label>
                <textarea
                  rows={3}
                  placeholder={
                    targetStatus === 'APPROVED'
                      ? 'e.g. Approved. Please collect from Lab Room 524 between 2 PM - 4 PM.'
                      : 'e.g. Declined due to high semester final demand or missing supervisor signature.'
                  }
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                />
              </div>

              {actionMessage && (
                <div className={`notice notice--${actionMessage.type}`} style={{ marginBottom: '1rem' }}>
                  {actionMessage.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setReviewModalOpen(false)}>Cancel</button>
                <button
                  type="submit"
                  className={targetStatus === 'APPROVED' ? 'primary-btn' : 'ghost-btn'}
                  style={
                    targetStatus === 'REJECTED'
                      ? { background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }
                      : {}
                  }
                  disabled={processing}
                >
                  {processing ? 'Updating...' : targetStatus === 'APPROVED' ? 'Confirm Acceptance' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
