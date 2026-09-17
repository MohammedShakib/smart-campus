import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  RefreshCw,
  DoorOpen,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function AdminReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionBusyId, setActionBusyId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchReservations = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/academic-operations/reservations');
      setReservations(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch reservations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setActionBusyId(id);
    try {
      await api(`/api/admin/academic-operations/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setToastMessage({
        type: 'success',
        text: `Reservation #${id} has been ${newStatus.toLowerCase()}.`
      });
      fetchReservations();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to update reservation status.'
      });
    } finally {
      setActionBusyId(null);
    }
  };

  const pendingCount = reservations.filter(r => r.status === 'PENDING').length;
  const approvedCount = reservations.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = reservations.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length;

  const filteredReservations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations.filter(r => {
      const matchSearch = !q ||
        (r.teacherEmail && r.teacherEmail.toLowerCase().includes(q)) ||
        (r.roomNumber && r.roomNumber.toLowerCase().includes(q)) ||
        (r.purpose && r.purpose.toLowerCase().includes(q)) ||
        (r.reservationDate && r.reservationDate.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || (r.status && r.status.toUpperCase() === statusFilter);

      return matchSearch && matchStatus;
    });
  }, [reservations, search, statusFilter]);

  return (
    <div className="academic-subpage reservation-management-view">
      {toastMessage && (
        <div className={`notice ${toastMessage.type}`} style={{ marginBottom: '1rem' }}>
          {toastMessage.text}
        </div>
      )}

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Total Requests</span>
            <span className="metric-icon"><CalendarCheck size={20} /></span>
          </div>
          <strong>{reservations.length}</strong>
          <div className="metric-card-foot"><span>Classroom booking records</span></div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Pending Review</span>
            <span className="metric-icon"><AlertCircle size={20} /></span>
          </div>
          <strong style={{ color: pendingCount > 0 ? '#d97706' : 'inherit' }}>
            {pendingCount}
          </strong>
          <div className="metric-card-foot"><span>Awaiting administrative action</span></div>
        </div>

        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Approved Bookings</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong style={{ color: '#047857' }}>{approvedCount}</strong>
          <div className="metric-card-foot"><span>Confirmed venue reservations</span></div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Rejected / Closed</span>
            <span className="metric-icon"><XCircle size={20} /></span>
          </div>
          <strong>{rejectedCount}</strong>
          <div className="metric-card-foot"><span>Declined or cancelled</span></div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel title="Classroom Reservation Requests" tag={`${filteredReservations.length} OF ${reservations.length} REQUESTS`}>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by instructor email, room, or purpose..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-toolbar-right">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => fetchReservations(true)}
                disabled={refreshing}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading reservation queue...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredReservations.length === 0 ? (
            <EmptyState
              title="No reservations found"
              message={reservations.length > 0 ? "No reservations matched your criteria." : "No faculty members have submitted classroom reservation requests yet."}
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Classroom</th>
                    <th>Date</th>
                    <th>Time Window</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(res => {
                    const statusClass = (res.status || 'PENDING').toLowerCase();
                    const isBusy = actionBusyId === res.id;

                    return (
                      <tr key={res.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <div className="mini-avatar">
                              {res.teacherEmail ? res.teacherEmail[0].toUpperCase() : 'F'}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{res.teacherEmail}</span>
                          </div>
                        </td>
                        <td>
                          <span className="room-pill">
                            <DoorOpen size={13} />
                            {res.roomNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} style={{ color: 'var(--tx-muted)' }} />
                            <span>{res.reservationDate}</span>
                          </div>
                        </td>
                        <td>
                          <span className="time-pill">
                            <Clock size={13} />
                            {res.startTime ? res.startTime.slice(0, 5) : ''} - {res.endTime ? res.endTime.slice(0, 5) : ''}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.84rem', color: 'var(--tx-primary)' }}>
                            {res.purpose || 'Academic session'}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-badge status-${statusClass}`}>
                            {res.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            {res.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  className="action-pill-btn action-pill-btn--approve"
                                  onClick={() => handleStatusChange(res.id, 'APPROVED')}
                                  disabled={isBusy}
                                  title="Approve Reservation"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  className="action-pill-btn action-pill-btn--reject"
                                  onClick={() => handleStatusChange(res.id, 'REJECTED')}
                                  disabled={isBusy}
                                  title="Reject Reservation"
                                >
                                  <XCircle size={14} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            {res.status === 'APPROVED' && (
                              <button
                                type="button"
                                className="action-pill-btn action-pill-btn--reject"
                                onClick={() => handleStatusChange(res.id, 'REJECTED')}
                                disabled={isBusy}
                                title="Revoke Approval"
                              >
                                <XCircle size={14} />
                                <span>Reject</span>
                              </button>
                            )}
                            {res.status === 'REJECTED' && (
                              <button
                                type="button"
                                className="action-pill-btn action-pill-btn--approve"
                                onClick={() => handleStatusChange(res.id, 'APPROVED')}
                                disabled={isBusy}
                                title="Re-approve Request"
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve</span>
                              </button>
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
      </div>
    </div>
  );
}
