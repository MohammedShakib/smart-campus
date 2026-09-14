import React, { useState, useEffect } from 'react';
import {
  FileWarning, Plus, Search, CheckCircle2, Clock, MapPin,
  AlertTriangle, Filter, User, ArrowRight, ShieldAlert, X
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityIncidentsSection() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [targetStatus, setTargetStatus] = useState('RESOLVED');
  const [actionTakenText, setActionTakenText] = useState('');

  const [form, setForm] = useState({
    title: '', incidentType: 'UNAUTHORIZED_ENTRY', location: '', severity: 'MEDIUM',
    description: '', involvedPersons: '', actionTaken: ''
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadIncidents = () => {
    setLoading(true);
    const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    api(`/api/security/incidents${query}`)
      .then((res) => {
        setIncidents(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadIncidents();
  }, [searchQuery]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api('/api/security/incidents/report', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setFeedback({ type: 'success', text: `Incident #${res.data.id} recorded in security log!` });
      setForm({
        title: '', incidentType: 'UNAUTHORIZED_ENTRY', location: '', severity: 'MEDIUM',
        description: '', involvedPersons: '', actionTaken: ''
      });
      setTimeout(() => {
        setReportModalOpen(false);
        loadIncidents();
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/api/security/incidents/${selectedIncident.id}/status?status=${targetStatus}&actionTaken=${encodeURIComponent(actionTakenText)}`, {
        method: 'POST'
      });
      setFeedback({ type: 'success', text: `Incident #${selectedIncident.id} updated to ${targetStatus}!` });
      setTimeout(() => {
        setStatusModalOpen(false);
        loadIncidents();
      }, 900);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const filtered = incidents.filter((i) => {
    if (filterType === 'ALL') return true;
    return i.incidentType === filterType;
  });

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Campus Security Incident Reports & Investigations"
        subtitle="Log security violations, unauthorized access, medical emergencies, damage, and parking infractions."
      />

      <div className="sec-toolbar">
        <div className="sec-tab-group">
          <button
            type="button"
            className={`sec-tab-btn ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            All Incidents ({incidents.length})
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${filterType === 'UNAUTHORIZED_ENTRY' ? 'active' : ''}`}
            onClick={() => setFilterType('UNAUTHORIZED_ENTRY')}
          >
            Unauthorized Access
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${filterType === 'TRAFFIC_PARKING' ? 'active' : ''}`}
            onClick={() => setFilterType('TRAFFIC_PARKING')}
          >
            Traffic & Parking
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${filterType === 'MEDICAL_EMERGENCY' ? 'active' : ''}`}
            onClick={() => setFilterType('MEDICAL_EMERGENCY')}
          >
            Medical Incidents
          </button>
          <button
            type="button"
            className="sec-tab-btn sec-tab-btn--highlight"
            onClick={() => { setReportModalOpen(true); setFeedback(null); }}
          >
            <Plus size={15} /> Log Incident
          </button>
        </div>

        <div className="sec-search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search incident title, location, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button type="button" className="icon-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>}
        </div>
      </div>

      <Panel title="Incident Log Book" tag={`${filtered.length} entries`}>
        <div className="sec-table-container">
          <table className="sec-table">
            <thead>
              <tr>
                <th>ID & Title</th>
                <th>Type</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Involved Parties</th>
                <th>Reported At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="sec-empty-cell">Loading security incident logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="sec-empty-cell">No incident logs found.</td></tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <div className="sec-incident-cell">
                        <span className="sec-incident-id">#{inc.id}</span>
                        <div>
                          <strong>{inc.title}</strong>
                          <div className="sec-sub-text sec-desc-truncate">{inc.description}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="sec-dept-tag">{inc.incidentType}</span></td>
                    <td>
                      <div className="sec-loc-tag"><MapPin size={12} /> {inc.location}</div>
                    </td>
                    <td>
                      <span className={`sec-severity-pill sec-severity-pill--${(inc.severity || '').toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>{inc.involvedPersons || <span className="muted">-</span>}</td>
                    <td>
                      <div>{new Date(inc.reportedAt).toLocaleDateString()}</div>
                      <small className="muted">{new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      <span className={`sec-status-badge sec-status-badge--${(inc.status || '').toLowerCase()}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sec-action-btn sec-action-btn--view"
                        onClick={() => {
                          setSelectedIncident(inc);
                          setTargetStatus(inc.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED');
                          setActionTakenText(inc.actionTaken || '');
                          setStatusModalOpen(true);
                        }}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Log Incident Modal */}
      {reportModalOpen && (
        <div className="profile-modal-backdrop" onMouseDown={() => setReportModalOpen(false)}>
          <section className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Security Command Post</span>
                <h2>File New Security Incident Report</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setReportModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleCreateSubmit}>
              <div className="sec-form-row">
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Incident Category</label>
                  <select
                    value={form.incidentType}
                    onChange={(e) => setForm({ ...form, incidentType: e.target.value })}
                  >
                    <option value="UNAUTHORIZED_ENTRY">Unauthorized Entry / Tailgating</option>
                    <option value="PROPERTY_DAMAGE">Campus Property Damage</option>
                    <option value="MEDICAL_EMERGENCY">Medical Incident</option>
                    <option value="SUSPICIOUS_ACTIVITY">Suspicious Behavior / Loitering</option>
                    <option value="TRAFFIC_PARKING">Traffic / Parking Obstruction</option>
                    <option value="THEFT_LOST">Reported Theft / Lost Property</option>
                    <option value="OTHER">Other Security Event</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Severity Level</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="LOW">Low (Log only)</option>
                    <option value="MEDIUM">Medium (Requires follow-up)</option>
                    <option value="HIGH">High (Urgent action taken)</option>
                    <option value="CRITICAL">Critical (Immediate escalation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Incident Title *</label>
                <input
                  placeholder="e.g. Broken barrier arm at North Gate"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="sec-form-row">
                <input
                  placeholder="Exact Location (e.g. Gate 1, Basement 2 Bay B) *"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
                <input
                  placeholder="Involved Persons / Vehicles (e.g. Driver ID, Car Reg DH-1122)"
                  value={form.involvedPersons}
                  onChange={(e) => setForm({ ...form, involvedPersons: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Factual Description of Incident</label>
                <textarea
                  placeholder="Provide detailed description of sequence of events..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Immediate Action Taken by Security</label>
                <input
                  placeholder="e.g. Escorted off premises, First aid administered, CCTV footage preserved"
                  value={form.actionTaken}
                  onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                />
              </div>

              {feedback && (
                <div className={`profile-message profile-message--${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setReportModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={busy}>
                  <FileWarning size={16} /> Submit Incident Report
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && selectedIncident && (
        <div className="profile-modal-backdrop" onMouseDown={() => setStatusModalOpen(false)}>
          <section className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Incident Update</span>
                <h2>Update Incident #{selectedIncident.id}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setStatusModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleStatusUpdate}>
              <div className="sec-form-row">
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Current Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                  >
                    <option value="OPEN">OPEN (Under review)</option>
                    <option value="INVESTIGATING">INVESTIGATING (CCTV / Interview)</option>
                    <option value="RESOLVED">RESOLVED (Action complete)</option>
                    <option value="ESCALATED">ESCALATED (Referred to Proctor / Police)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Action Taken & Resolution Notes</label>
                <textarea
                  placeholder="Summary of investigation findings and outcome..."
                  rows={3}
                  value={actionTakenText}
                  onChange={(e) => setActionTakenText(e.target.value)}
                />
              </div>

              {feedback && (
                <div className={`profile-message profile-message--${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setStatusModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={busy}>
                  Save Incident Status
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
