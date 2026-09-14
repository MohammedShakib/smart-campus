import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ShieldCheck, CheckCircle2, Clock, Flame,
  RadioTower, AlertCircle, RefreshCw, X, ArrowRight, ShieldAlert, Siren
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityEmergencySection() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('Threat resolved. All zones verified safe by campus security team.');
  const [broadcastForm, setBroadcastForm] = useState({
    alertTitle: '', alertMessage: '', severity: 'CRITICAL', category: 'SECURITY'
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadAlerts = () => {
    setLoading(true);
    Promise.all([
      api('/api/security/emergency/active'),
      api('/api/security/emergency/all')
    ])
      .then(([activeRes, allRes]) => {
        setActiveAlerts(activeRes.data || []);
        setAllAlerts(allRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api('/api/security/emergency/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastForm)
      });
      setFeedback({ type: 'success', text: `🚨 Emergency alert activated: ${res.data.alertTitle}` });
      setBroadcastForm({ alertTitle: '', alertMessage: '', severity: 'CRITICAL', category: 'SECURITY' });
      setTimeout(() => {
        setBroadcastModalOpen(false);
        loadAlerts();
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/api/security/emergency/${selectedAlert.id}/resolve?notes=${encodeURIComponent(resolveNotes)}`, {
        method: 'POST'
      });
      setFeedback({ type: 'success', text: `Emergency Alert #${selectedAlert.id} marked as RESOLVED.` });
      setTimeout(() => {
        setResolveModalOpen(false);
        loadAlerts();
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Emergency Command & Campus-Wide Broadcast"
        subtitle="Manage critical incidents, fire alarms, medical responses, and broadcast high-priority safety instructions."
      />

      {/* Main Status Hero */}
      {activeAlerts.length > 0 ? (
        <div className="sec-emergency-hero sec-emergency-hero--active">
          <div className="sec-emergency-hero-icon">
            <Siren size={36} className="pulse-icon" />
          </div>
          <div className="sec-emergency-hero-content">
            <div className="sec-emergency-tag">🚨 ACTIVE CAMPUS EMERGENCY IN PROGRESS</div>
            <h2>{activeAlerts[0].alertTitle}</h2>
            <p>{activeAlerts[0].alertMessage}</p>
            <div className="sec-emergency-meta">
              <span>Category: <strong>{activeAlerts[0].category}</strong></span>
              <span>•</span>
              <span>Severity: <strong>{activeAlerts[0].severity}</strong></span>
              <span>•</span>
              <span>Broadcasted: {new Date(activeAlerts[0].broadcastTime).toLocaleString()}</span>
              <span>•</span>
              <span>By: <strong>{activeAlerts[0].broadcastBy}</strong></span>
            </div>
          </div>
          <div className="sec-emergency-hero-actions">
            <button
              type="button"
              className="primary-btn"
              style={{ background: '#10b981' }}
              onClick={() => { setSelectedAlert(activeAlerts[0]); setResolveModalOpen(true); }}
            >
              <CheckCircle2 size={16} /> Mark Resolved & Clear Alert
            </button>
          </div>
        </div>
      ) : (
        <div className="sec-emergency-hero sec-emergency-hero--calm">
          <div className="sec-emergency-hero-icon">
            <ShieldCheck size={36} />
          </div>
          <div className="sec-emergency-hero-content">
            <span className="sec-calm-tag">STATUS: ALL CLEAR</span>
            <h2>No Active Emergency Broadcasts</h2>
            <p>Perimeter gates, fire sensors, and automated surveillance reports indicate normal campus operating conditions.</p>
          </div>
          <div className="sec-emergency-hero-actions">
            <button
              type="button"
              className="primary-btn"
              style={{ background: '#ef4444' }}
              onClick={() => setBroadcastModalOpen(true)}
            >
              <AlertTriangle size={16} /> Broadcast Emergency Alert
            </button>
          </div>
        </div>
      )}

      {/* Historical Broadcasts Log */}
      <Panel title="Emergency Broadcast History & Resolutions" tag={`${allAlerts.length} past events`}>
        <div className="sec-table-container">
          <table className="sec-table">
            <thead>
              <tr>
                <th>Alert Headline</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Broadcast Time</th>
                <th>Status</th>
                <th>Resolution Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="sec-empty-cell">Loading emergency logs...</td></tr>
              ) : allAlerts.length === 0 ? (
                <tr><td colSpan={7} className="sec-empty-cell">No emergency alerts recorded.</td></tr>
              ) : (
                allAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <strong>{alert.alertTitle}</strong>
                      <div className="sec-sub-text">{alert.alertMessage}</div>
                    </td>
                    <td><span className="sec-dept-tag">{alert.category}</span></td>
                    <td>
                      <span className={`sec-severity-pill sec-severity-pill--${(alert.severity || '').toLowerCase()}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <div>{new Date(alert.broadcastTime).toLocaleDateString()}</div>
                      <small className="muted">{new Date(alert.broadcastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      {alert.active ? (
                        <span className="sec-status-badge sec-status-badge--active">ACTIVE</span>
                      ) : (
                        <span className="sec-status-badge sec-status-badge--resolved">RESOLVED</span>
                      )}
                    </td>
                    <td className="sec-purpose-cell">
                      {alert.resolutionNotes || (alert.active ? <em className="muted">Pending resolution</em> : 'Declared safe.')}
                    </td>
                    <td>
                      {alert.active && (
                        <button
                          type="button"
                          className="sec-action-btn sec-action-btn--approve"
                          onClick={() => { setSelectedAlert(alert); setResolveModalOpen(true); }}
                        >
                          <CheckCircle2 size={14} /> Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Broadcast Modal */}
      {broadcastModalOpen && (
        <div className="profile-modal-backdrop" onMouseDown={() => setBroadcastModalOpen(false)}>
          <section className="profile-modal sec-emergency-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Emergency Protocol</span>
                <h2>🚨 Broadcast Immediate Campus-Wide Alert</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setBroadcastModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleBroadcast}>
              <div className="sec-form-row">
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Emergency Category</label>
                  <select
                    value={broadcastForm.category}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                  >
                    <option value="FIRE">Fire Alarm / Smoke</option>
                    <option value="MEDICAL">Medical Response</option>
                    <option value="SECURITY">Intrusion / Security Breach</option>
                    <option value="WEATHER">Severe Storm / Cyclone Warning</option>
                    <option value="POWER">Power Grid Failure</option>
                    <option value="EVACUATION">Mandatory Evacuation</option>
                    <option value="GENERAL">General Campus Emergency</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Severity Level</label>
                  <select
                    value={broadcastForm.severity}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value })}
                  >
                    <option value="INFO">Level 1 - Information</option>
                    <option value="WARNING">Level 2 - Warning</option>
                    <option value="CRITICAL">Level 3 - Critical</option>
                    <option value="EMERGENCY">Level 4 - Immediate Danger</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Alert Title</label>
                <input
                  placeholder="e.g. Fire alarm triggered in East Wing Floor 4"
                  value={broadcastForm.alertTitle}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, alertTitle: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Broadcast Instructions for Campus</label>
                <textarea
                  placeholder="Provide immediate safety instructions (e.g. Please proceed calmly through Stairwell B to the sports field assembly point)..."
                  rows={4}
                  value={broadcastForm.alertMessage}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, alertMessage: e.target.value })}
                  required
                />
              </div>

              {feedback && (
                <div className={`profile-message profile-message--${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setBroadcastModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ background: '#ef4444' }} disabled={busy}>
                  <AlertTriangle size={16} /> Broadcast Alert Now
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalOpen && selectedAlert && (
        <div className="profile-modal-backdrop" onMouseDown={() => setResolveModalOpen(false)}>
          <section className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Emergency Resolution</span>
                <h2>Resolve Alert: {selectedAlert.alertTitle}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setResolveModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleResolve}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Marking this alert as resolved will notify all users that normal campus operations have resumed.
              </p>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Resolution Summary / Notes</label>
                <textarea
                  placeholder="Describe resolution (e.g. False alarm investigated and cleared by security team)..."
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  required
                />
              </div>

              {feedback && (
                <div className={`profile-message profile-message--${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setResolveModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ background: '#10b981' }} disabled={busy}>
                  <CheckCircle2 size={16} /> Confirm Resolution & Close
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
