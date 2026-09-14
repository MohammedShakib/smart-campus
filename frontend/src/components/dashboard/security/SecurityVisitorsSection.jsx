import React, { useState, useEffect } from 'react';
import {
  UsersRound, Search, CheckCircle2, XCircle, Clock, Plus,
  QrCode, Printer, Filter, Car, Phone, Mail, IdCard, Building2,
  Calendar, Check, X, ShieldAlert, ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityVisitorsSection() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'checked_in' | 'all' | 'register'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Action States
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // New Registration Form
  const [form, setForm] = useState({
    visitorName: '', phone: '', email: '', purpose: '', hostName: '', hostDepartment: 'CSE',
    visitDate: new Date().toISOString().split('T')[0], expectedEntryTime: '10:00',
    vehicleNumber: '', nationalId: '', walkIn: false
  });

  const loadVisitors = () => {
    setLoading(true);
    const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    api(`/api/security/visitors${queryParam}`)
      .then((res) => {
        setVisitors(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadVisitors();
  }, [searchQuery]);

  const handleApproveReject = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;
    setActionBusy(true);
    setActionFeedback(null);
    try {
      const endpoint = reviewAction === 'approve'
        ? `/api/security/visitors/${selectedVisitor.id}/approve?remarks=${encodeURIComponent(adminRemarks)}`
        : `/api/security/visitors/${selectedVisitor.id}/reject?remarks=${encodeURIComponent(adminRemarks)}`;

      await api(endpoint, { method: 'POST' });
      setActionFeedback({ type: 'success', text: `Visitor #${selectedVisitor.id} ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully!` });
      setTimeout(() => {
        setReviewModalOpen(false);
        setActionFeedback(null);
        loadVisitors();
      }, 1000);
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message });
    } finally {
      setActionBusy(false);
    }
  };

  const handleCheckIn = async (passCodeOrId) => {
    try {
      const res = await api(`/api/security/visitors/checkin?passCodeOrId=${encodeURIComponent(passCodeOrId)}`, { method: 'POST' });
      alert(res.message);
      loadVisitors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCheckOut = async (passCodeOrId) => {
    try {
      const res = await api(`/api/security/visitors/checkout?passCodeOrId=${encodeURIComponent(passCodeOrId)}`, { method: 'POST' });
      alert(res.message);
      loadVisitors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setActionBusy(true);
    setActionFeedback(null);
    try {
      const res = await api('/api/security/visitors/request', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setActionFeedback({ type: 'success', text: `Visitor pass created! Pass Code: ${res.data.passCode}` });
      setSelectedVisitor(res.data);
      setQrModalOpen(true);
      setForm({
        visitorName: '', phone: '', email: '', purpose: '', hostName: '', hostDepartment: 'CSE',
        visitDate: new Date().toISOString().split('T')[0], expectedEntryTime: '10:00',
        vehicleNumber: '', nationalId: '', walkIn: false
      });
      loadVisitors();
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message });
    } finally {
      setActionBusy(false);
    }
  };

  const filteredVisitors = visitors.filter((v) => {
    if (activeTab === 'pending') return v.status === 'PENDING';
    if (activeTab === 'checked_in') return v.status === 'CHECKED_IN';
    return true;
  });

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Visitor Passes & Gate Control"
        subtitle="Manage pre-registered guests, review visitor requests, verify QR passes, and log immediate walk-ins."
      />

      {/* Tabs & Search Bar */}
      <div className="sec-toolbar">
        <div className="sec-tab-group">
          <button
            type="button"
            className={`sec-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests ({visitors.filter(v => v.status === 'PENDING').length})
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${activeTab === 'checked_in' ? 'active' : ''}`}
            onClick={() => setActiveTab('checked_in')}
          >
            Active On-Campus ({visitors.filter(v => v.status === 'CHECKED_IN').length})
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All History & Logs ({visitors.length})
          </button>
          <button
            type="button"
            className={`sec-tab-btn sec-tab-btn--highlight ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <Plus size={15} /> New Visitor Pass
          </button>
        </div>

        {activeTab !== 'register' && (
          <div className="sec-search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, phone, pass code, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="icon-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'register' ? (
        <Panel title="Create New Visitor Pre-Registration / Walk-In Pass" tag="Security Terminal">
          <form className="sec-register-grid" onSubmit={handleRegisterSubmit}>
            <div className="sec-form-section">
              <h3><UsersRound size={16} /> Visitor Personal Info</h3>
              <input
                placeholder="Visitor Full Name *"
                value={form.visitorName}
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                required
              />
              <input
                placeholder="Phone Number (e.g. 01700000000) *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <input
                placeholder="Email Address (optional)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="National ID / Passport Number"
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
              />
            </div>

            <div className="sec-form-section">
              <h3><Building2 size={16} /> Visit Details & Host</h3>
              <input
                placeholder="Host Faculty / Staff Name *"
                value={form.hostName}
                onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                required
              />
              <select
                value={form.hostDepartment}
                onChange={(e) => setForm({ ...form, hostDepartment: e.target.value })}
              >
                <option value="CSE">CSE Department</option>
                <option value="EEE">EEE Department</option>
                <option value="BBA">BBA School</option>
                <option value="Administration">Administration</option>
                <option value="Registrar">Registrar Office</option>
                <option value="Admission">Admission Office</option>
                <option value="Student Affairs">Directorate of Student Affairs</option>
              </select>
              <textarea
                placeholder="Specific Purpose of Visit (e.g. External Thesis Defense, Vendor Meeting, Campus Tour)... *"
                rows={3}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>

            <div className="sec-form-section sec-form-section--wide">
              <h3><Calendar size={16} /> Date, Time & Logistics</h3>
              <div className="sec-form-row">
                <input
                  type="date"
                  value={form.visitDate}
                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  required
                />
                <input
                  type="time"
                  value={form.expectedEntryTime}
                  onChange={(e) => setForm({ ...form, expectedEntryTime: e.target.value })}
                  required
                />
                <input
                  placeholder="Vehicle Number Plate (if entering with car/bike)"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                />
              </div>

              <label className="sec-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.walkIn}
                  onChange={(e) => setForm({ ...form, walkIn: e.target.checked })}
                />
                <span>Immediate Walk-in Guest (Automatically marks entry as <strong>CHECKED_IN</strong> immediately)</span>
              </label>

              {actionFeedback && (
                <div className={`profile-message profile-message--${actionFeedback.type}`}>
                  {actionFeedback.text}
                </div>
              )}

              <div className="sec-form-actions">
                <button type="button" className="ghost-btn" onClick={() => setActiveTab('pending')}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={actionBusy}>
                  <QrCode size={16} /> Generate & Issue Visitor Pass
                </button>
              </div>
            </div>
          </form>
        </Panel>
      ) : (
        <Panel title={`${activeTab.replace('_', ' ').toUpperCase()} Visitors`} tag={`${filteredVisitors.length} passes`}>
          <div className="sec-table-container">
            <table className="sec-table">
              <thead>
                <tr>
                  <th>Pass Code & QR</th>
                  <th>Visitor Info</th>
                  <th>Host & Department</th>
                  <th>Visit Date / Time</th>
                  <th>Vehicle / NID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="sec-empty-cell">Loading visitor passes...</td></tr>
                ) : filteredVisitors.length === 0 ? (
                  <tr><td colSpan={7} className="sec-empty-cell">No visitor records match this filter.</td></tr>
                ) : (
                  filteredVisitors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <button
                          type="button"
                          className="sec-qr-preview-btn"
                          onClick={() => { setSelectedVisitor(v); setQrModalOpen(true); }}
                          title="View QR Pass Badge"
                        >
                          <QrCode size={18} />
                          <strong>{v.passCode}</strong>
                        </button>
                      </td>
                      <td>
                        <strong>{v.visitorName}</strong>
                        <div className="sec-sub-text"><Phone size={11} /> {v.phone}</div>
                        {v.email && <div className="sec-sub-text"><Mail size={11} /> {v.email}</div>}
                      </td>
                      <td>
                        <div>{v.hostName}</div>
                        <span className="sec-dept-tag">{v.hostDepartment}</span>
                        <div className="sec-purpose-snippet" title={v.purpose}>{v.purpose}</div>
                      </td>
                      <td>
                        <div>{v.visitDate}</div>
                        <div className="sec-sub-text"><Clock size={11} /> {v.expectedEntryTime || '10:00'}</div>
                        {v.actualCheckInTime && (
                          <small className="sec-entry-time">In: {new Date(v.actualCheckInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        )}
                        {v.actualCheckOutTime && (
                          <small className="sec-exit-time">Out: {new Date(v.actualCheckOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        )}
                      </td>
                      <td>
                        {v.vehicleNumber ? (
                          <span className="sec-vehicle-tag"><Car size={12} /> {v.vehicleNumber}</span>
                        ) : (
                          <span className="muted">Pedestrian</span>
                        )}
                        {v.nationalId && <div className="sec-sub-text">NID: {v.nationalId}</div>}
                      </td>
                      <td>
                        <span className={`sec-status-badge sec-status-badge--${(v.status || '').toLowerCase()}`}>
                          {v.status}
                        </span>
                        {v.walkIn && <span className="sec-walkin-pill">Walk-in</span>}
                      </td>
                      <td>
                        <div className="sec-actions-cell">
                          {v.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                className="sec-action-btn sec-action-btn--approve"
                                onClick={() => { setSelectedVisitor(v); setReviewAction('approve'); setAdminRemarks('Approved by Security Desk.'); setReviewModalOpen(true); }}
                                title="Approve Request"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                className="sec-action-btn sec-action-btn--reject"
                                onClick={() => { setSelectedVisitor(v); setReviewAction('reject'); setAdminRemarks('Invalid host or denied entry.'); setReviewModalOpen(true); }}
                                title="Reject Request"
                              >
                                <X size={14} /> Reject
                              </button>
                            </>
                          )}

                          {v.status === 'APPROVED' && (
                            <button
                              type="button"
                              className="sec-action-btn sec-action-btn--checkin"
                              onClick={() => handleCheckIn(v.passCode)}
                              title="Confirm Gate Check-In"
                            >
                              <CheckCircle2 size={14} /> Confirm Entry
                            </button>
                          )}

                          {v.status === 'CHECKED_IN' && (
                            <button
                              type="button"
                              className="sec-action-btn sec-action-btn--checkout"
                              onClick={() => handleCheckOut(v.passCode)}
                              title="Confirm Gate Check-Out"
                            >
                              <ArrowRight size={14} /> Confirm Exit
                            </button>
                          )}

                          <button
                            type="button"
                            className="sec-action-btn sec-action-btn--view"
                            onClick={() => { setSelectedVisitor(v); setQrModalOpen(true); }}
                            title="View Pass Badge"
                          >
                            <Printer size={14} /> Pass
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Visitor QR Pass Badge Modal */}
      {qrModalOpen && selectedVisitor && (
        <div className="profile-modal-backdrop" onMouseDown={() => setQrModalOpen(false)}>
          <div className="sec-pass-badge-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sec-pass-badge">
              <div className="sec-badge-head">
                <div>
                  <span className="sec-badge-university">UNITED INTERNATIONAL UNIVERSITY</span>
                  <h2>OFFICIAL VISITOR PASS</h2>
                </div>
                <button type="button" className="icon-btn" onClick={() => setQrModalOpen(false)}><X size={16} /></button>
              </div>

              <div className="sec-badge-body">
                <div className="sec-badge-qr-box">
                  <QRCodeSVG
                    value={selectedVisitor.passCode}
                    size={150}
                    level="H"
                    includeMargin
                  />
                  <span className="sec-badge-code">{selectedVisitor.passCode}</span>
                </div>

                <div className="sec-badge-details">
                  <div className="sec-badge-row">
                    <span>Visitor Name:</span>
                    <strong>{selectedVisitor.visitorName}</strong>
                  </div>
                  <div className="sec-badge-row">
                    <span>Phone:</span>
                    <strong>{selectedVisitor.phone}</strong>
                  </div>
                  <div className="sec-badge-row">
                    <span>Host / Dept:</span>
                    <strong>{selectedVisitor.hostName} ({selectedVisitor.hostDepartment})</strong>
                  </div>
                  <div className="sec-badge-row">
                    <span>Visit Date:</span>
                    <strong>{selectedVisitor.visitDate}</strong>
                  </div>
                  <div className="sec-badge-row">
                    <span>Purpose:</span>
                    <span>{selectedVisitor.purpose}</span>
                  </div>
                  <div className="sec-badge-row">
                    <span>Vehicle Plate:</span>
                    <strong>{selectedVisitor.vehicleNumber || 'Pedestrian (No Vehicle)'}</strong>
                  </div>
                  <div className="sec-badge-row">
                    <span>Pass Status:</span>
                    <span className={`sec-status-badge sec-status-badge--${(selectedVisitor.status || '').toLowerCase()}`}>
                      {selectedVisitor.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sec-badge-footer">
                <small>Present this digital pass or QR barcode at Campus Gate 1 / 2 security post.</small>
                <div className="sec-badge-actions">
                  <button type="button" className="ghost-btn" onClick={() => window.print()}>
                    <Printer size={15} /> Print Pass
                  </button>
                  {selectedVisitor.status === 'APPROVED' && (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => { handleCheckIn(selectedVisitor.passCode); setQrModalOpen(false); }}
                    >
                      <CheckCircle2 size={15} /> Check In Visitor Now
                    </button>
                  )}
                  {selectedVisitor.status === 'CHECKED_IN' && (
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ background: '#f59e0b' }}
                      onClick={() => { handleCheckOut(selectedVisitor.passCode); setQrModalOpen(false); }}
                    >
                      <ArrowRight size={15} /> Check Out & Close Pass
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Approval/Rejection Modal */}
      {reviewModalOpen && selectedVisitor && (
        <div className="profile-modal-backdrop" onMouseDown={() => setReviewModalOpen(false)}>
          <section className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Visitor Request Decision</span>
                <h2>{reviewAction === 'approve' ? 'Approve Visitor Pass' : 'Reject Visitor Pass'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setReviewModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleApproveReject}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {reviewAction === 'approve'
                  ? `Grant authorized campus entry for ${selectedVisitor.visitorName} to meet ${selectedVisitor.hostName}.`
                  : `Deny campus entry for ${selectedVisitor.visitorName}.`}
              </p>

              <textarea
                placeholder="Security Officer Remarks (optional)..."
                rows={3}
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
              />

              {actionFeedback && (
                <div className={`profile-message profile-message--${actionFeedback.type}`}>
                  {actionFeedback.text}
                </div>
              )}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ background: reviewAction === 'approve' ? '#10b981' : '#ef4444' }}
                  disabled={actionBusy}
                >
                  {reviewAction === 'approve' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
