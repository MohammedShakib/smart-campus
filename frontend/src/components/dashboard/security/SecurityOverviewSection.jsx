import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, UsersRound, Car, QrCode, DoorOpen,
  FileWarning, Plus, CheckCircle2, Clock, MapPin, ArrowRight,
  RadioTower, AlertCircle, Phone, Search, RefreshCw, X
} from 'lucide-react';
import { api } from '../../../utils/api';
import { Panel } from '../../shared/SharedComponents';

export function SecurityOverviewSection({ data, reload, setActiveSection }) {
  const summary = data?.securitySummary || {};
  const activeAlerts = summary.activeEmergencyAlerts || [];
  const hasEmergency = summary.hasActiveEmergency;
  const parkingZones = summary.parkingZones || [];
  const recentVisitors = summary.recentVisitors || [];
  const recentIncidents = summary.recentIncidents || [];

  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    visitorName: '', phone: '', email: '', purpose: '', hostName: '', hostDepartment: 'CSE',
    vehicleNumber: '', nationalId: '', walkIn: true
  });
  const [emergencyForm, setEmergencyForm] = useState({
    alertTitle: '', alertMessage: '', severity: 'CRITICAL', category: 'SECURITY'
  });
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await api('/api/security/visitors/request', {
        method: 'POST',
        body: JSON.stringify(walkInForm)
      });
      setStatusMessage({ type: 'success', text: `Walk-in visitor ${res.data.visitorName} checked in! Pass: ${res.data.passCode}` });
      setWalkInForm({ visitorName: '', phone: '', email: '', purpose: '', hostName: '', hostDepartment: 'CSE', vehicleNumber: '', nationalId: '', walkIn: true });
      setTimeout(() => { setWalkInModalOpen(false); reload(); setStatusMessage(null); }, 1500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await api('/api/security/emergency/broadcast', {
        method: 'POST',
        body: JSON.stringify(emergencyForm)
      });
      setStatusMessage({ type: 'success', text: `🚨 Emergency alert broadcasted: ${res.data.alertTitle}` });
      setEmergencyForm({ alertTitle: '', alertMessage: '', severity: 'CRITICAL', category: 'SECURITY' });
      setTimeout(() => { setEmergencyModalOpen(false); reload(); setStatusMessage(null); }, 1500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleQuickAdjustParking = async (zoneCode, delta) => {
    try {
      await api(`/api/security/parking/${zoneCode}/adjust?delta=${delta}`, { method: 'POST' });
      reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="security-overview-container">
      {/* 1. Emergency Status Banner */}
      {hasEmergency ? (
        <div className="security-alert-banner security-alert-banner--active">
          <div className="security-alert-icon">
            <AlertTriangle size={28} className="pulse-icon" />
          </div>
          <div className="security-alert-body">
            <div className="security-alert-head">
              <span className="security-alert-tag">ACTIVE CAMPUS EMERGENCY</span>
              <strong>{activeAlerts[0]?.alertTitle}</strong>
            </div>
            <p>{activeAlerts[0]?.alertMessage}</p>
            <div className="security-alert-meta">
              <span>Severity: <strong>{activeAlerts[0]?.severity}</strong></span>
              <span>•</span>
              <span>Category: <strong>{activeAlerts[0]?.category}</strong></span>
              <span>•</span>
              <span>Broadcasted: {new Date(activeAlerts[0]?.broadcastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <button
            type="button"
            className="secondary-btn security-alert-action"
            onClick={() => setActiveSection('emergency')}
          >
            Manage Alert <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="security-alert-banner security-alert-banner--calm">
          <div className="security-alert-icon">
            <ShieldCheck size={26} />
          </div>
          <div className="security-alert-body">
            <strong>All Clear • Campus Fully Secured</strong>
            <p>No active emergency broadcasts. All perimeter gates and telemetry links are operating normally.</p>
          </div>
          <button
            type="button"
            className="ghost-btn security-calm-action"
            onClick={() => setEmergencyModalOpen(true)}
          >
            <AlertTriangle size={15} /> Broadcast Alert
          </button>
        </div>
      )}

      {/* 2. Security KPI Grid */}
      <div className="security-kpi-grid">
        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--blue"><UsersRound size={22} /></div>
          <div className="sec-kpi-details">
            <span>Visitors On Campus</span>
            <strong>{summary.onCampusVisitorsCount || 0}</strong>
            <small>{summary.todayVisitorsCount || 0} expected today</small>
          </div>
        </div>

        <div className="sec-kpi-card" onClick={() => setActiveSection('visitors')} style={{ cursor: 'pointer' }}>
          <div className="sec-kpi-icon sec-kpi-icon--amber"><Clock size={22} /></div>
          <div className="sec-kpi-details">
            <span>Pending Approvals</span>
            <strong>{summary.pendingVisitorsCount || 0}</strong>
            <small className="clickable-text">Review requests →</small>
          </div>
        </div>

        <div className="sec-kpi-card" onClick={() => setActiveSection('parking')} style={{ cursor: 'pointer' }}>
          <div className="sec-kpi-icon sec-kpi-icon--emerald"><Car size={22} /></div>
          <div className="sec-kpi-details">
            <span>Parking Occupancy</span>
            <strong>{summary.totalParkingOccupied || 0} / {summary.totalParkingCapacity || 0}</strong>
            <small>{summary.totalParkingCapacity > 0 ? Math.round(((summary.totalParkingOccupied || 0) / summary.totalParkingCapacity) * 100) : 0}% capacity</small>
          </div>
        </div>

        <div className="sec-kpi-card" onClick={() => setActiveSection('incidents')} style={{ cursor: 'pointer' }}>
          <div className="sec-kpi-icon sec-kpi-icon--purple"><FileWarning size={22} /></div>
          <div className="sec-kpi-details">
            <span>Active Incidents</span>
            <strong>{summary.openIncidentsCount || 0}</strong>
            <small className="clickable-text">View incident log →</small>
          </div>
        </div>
      </div>

      {/* 3. Quick Security Actions */}
      <div className="sec-quick-actions-bar">
        <span className="sec-quick-label"><RadioTower size={15} /> Quick Actions:</span>
        <div className="sec-quick-buttons">
          <button type="button" className="sec-quick-btn" onClick={() => setActiveSection('scanner')}>
            <QrCode size={16} /> Scan QR Pass
          </button>
          <button type="button" className="sec-quick-btn" onClick={() => setWalkInModalOpen(true)}>
            <Plus size={16} /> Log Walk-in Guest
          </button>
          <button type="button" className="sec-quick-btn" onClick={() => setActiveSection('parking')}>
            <Car size={16} /> Update Parking
          </button>
          <button type="button" className="sec-quick-btn sec-quick-btn--danger" onClick={() => setEmergencyModalOpen(true)}>
            <AlertTriangle size={16} /> Broadcast Emergency
          </button>
        </div>
      </div>

      {/* 4. Dual Workspace Grid */}
      <div className="sec-workspace-grid">
        {/* Left Column: Live Visitor Gate Stream */}
        <div className="sec-main-panel">
          <Panel title="Recent Visitors & Passes" tag="Real-Time Log">
            <div className="sec-table-container">
              <table className="sec-table">
                <thead>
                  <tr>
                    <th>Pass Code</th>
                    <th>Visitor Name</th>
                    <th>Host / Dept</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisitors.length === 0 ? (
                    <tr><td colSpan={5} className="sec-empty-cell">No recent visitor entries.</td></tr>
                  ) : (
                    recentVisitors.map((v) => (
                      <tr key={v.id}>
                        <td><span className="sec-code-badge">{v.passCode}</span></td>
                        <td>
                          <strong>{v.visitorName}</strong>
                          <div className="sec-sub-text">{v.phone}</div>
                        </td>
                        <td>
                          <div>{v.hostName}</div>
                          <span className="sec-dept-tag">{v.hostDepartment}</span>
                        </td>
                        <td className="sec-purpose-cell">{v.purpose}</td>
                        <td>
                          <span className={`sec-status-badge sec-status-badge--${(v.status || '').toLowerCase()}`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="sec-panel-footer">
              <button type="button" className="ghost-btn" onClick={() => setActiveSection('visitors')}>
                View All Visitor Passes <ArrowRight size={14} />
              </button>
            </div>
          </Panel>
        </div>

        {/* Right Column: Parking Pressure & Incidents */}
        <div className="sec-side-panel">
          <Panel title="Live Parking Pressure" tag="Occupancy Sensors">
            <div className="sec-parking-list">
              {parkingZones.map((zone) => {
                const percent = zone.totalCapacity > 0 ? Math.round((zone.currentOccupied / zone.totalCapacity) * 100) : 0;
                const isFull = percent >= 100;
                const isAlmostFull = percent >= zone.fullThresholdPercent;
                const meterColor = isFull ? 'red' : isAlmostFull ? 'amber' : 'emerald';

                return (
                  <div key={zone.id} className="sec-parking-item">
                    <div className="sec-parking-header">
                      <div>
                        <strong>{zone.zoneName}</strong>
                        <span className="sec-parking-type">{zone.type}</span>
                      </div>
                      <span className={`sec-badge sec-badge--${meterColor}`}>{zone.status}</span>
                    </div>
                    <div className="sec-parking-bar-bg">
                      <div
                        className={`sec-parking-bar sec-parking-bar--${meterColor}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <div className="sec-parking-meta">
                      <span>{zone.currentOccupied} / {zone.totalCapacity} spots occupied ({percent}%)</span>
                      <div className="sec-parking-controls">
                        <button
                          type="button"
                          className="sec-mini-btn"
                          onClick={() => handleQuickAdjustParking(zone.zoneCode, -1)}
                          disabled={zone.currentOccupied <= 0}
                          title="Vehicle Exit (-1)"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="sec-mini-btn"
                          onClick={() => handleQuickAdjustParking(zone.zoneCode, 1)}
                          disabled={zone.currentOccupied >= zone.totalCapacity}
                          title="Vehicle Entry (+1)"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="sec-panel-footer">
              <button type="button" className="ghost-btn" onClick={() => setActiveSection('parking')}>
                Manage Parking Lots <ArrowRight size={14} />
              </button>
            </div>
          </Panel>

          <Panel title="Recent Security Incidents" tag="Audit Log">
            <div className="sec-incident-feed">
              {recentIncidents.length === 0 ? (
                <p className="muted" style={{ padding: '1rem', fontSize: '0.88rem' }}>No recent security incident reports.</p>
              ) : (
                recentIncidents.map((inc) => (
                  <div key={inc.id} className="sec-incident-item">
                    <div className="sec-incident-top">
                      <span className={`sec-severity-dot sec-severity-dot--${(inc.severity || '').toLowerCase()}`} />
                      <strong>{inc.title}</strong>
                      <span className="sec-time-tag">{new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="sec-incident-loc"><MapPin size={12} /> {inc.location}</div>
                    <p className="sec-incident-desc">{inc.description}</p>
                  </div>
                ))
              )}
            </div>
            <div className="sec-panel-footer">
              <button type="button" className="ghost-btn" onClick={() => setActiveSection('incidents')}>
                Full Incident Log <ArrowRight size={14} />
              </button>
            </div>
          </Panel>
        </div>
      </div>

      {/* Walk-in Visitor Modal */}
      {walkInModalOpen && (
        <div className="profile-modal-backdrop" onMouseDown={() => setWalkInModalOpen(false)}>
          <section className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Security Gate Post</span>
                <h2>Log Walk-In Visitor</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setWalkInModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleWalkInSubmit}>
              <div className="sec-form-row">
                <input
                  placeholder="Visitor Full Name *"
                  value={walkInForm.visitorName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, visitorName: e.target.value })}
                  required
                />
                <input
                  placeholder="Phone Number *"
                  value={walkInForm.phone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="sec-form-row">
                <input
                  placeholder="Host Faculty/Staff Name *"
                  value={walkInForm.hostName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, hostName: e.target.value })}
                  required
                />
                <select
                  value={walkInForm.hostDepartment}
                  onChange={(e) => setWalkInForm({ ...walkInForm, hostDepartment: e.target.value })}
                >
                  <option value="CSE">CSE Department</option>
                  <option value="EEE">EEE Department</option>
                  <option value="BBA">BBA School</option>
                  <option value="Administration">Administration</option>
                  <option value="Registrar">Registrar Office</option>
                  <option value="Admission">Admission Office</option>
                </select>
              </div>
              <input
                placeholder="Purpose of Visit *"
                value={walkInForm.purpose}
                onChange={(e) => setWalkInForm({ ...walkInForm, purpose: e.target.value })}
                required
              />
              <div className="sec-form-row">
                <input
                  placeholder="Vehicle Number (optional)"
                  value={walkInForm.vehicleNumber}
                  onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNumber: e.target.value })}
                />
                <input
                  placeholder="National ID / Passport"
                  value={walkInForm.nationalId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, nationalId: e.target.value })}
                />
              </div>

              {statusMessage && <div className={`profile-message profile-message--${statusMessage.type}`}>{statusMessage.text}</div>}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setWalkInModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={busy}>
                  <CheckCircle2 size={16} /> Confirm Entry & Generate Pass
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Emergency Broadcast Modal */}
      {emergencyModalOpen && (
        <div className="profile-modal-backdrop" onMouseDown={() => setEmergencyModalOpen(false)}>
          <section className="profile-modal sec-emergency-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Emergency Protocol</span>
                <h2>🚨 Broadcast Emergency Alert</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setEmergencyModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleEmergencySubmit}>
              <div className="sec-form-row">
                <select
                  value={emergencyForm.category}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, category: e.target.value })}
                >
                  <option value="FIRE">Fire Hazard</option>
                  <option value="MEDICAL">Medical Emergency</option>
                  <option value="SECURITY">Security / Intrusion</option>
                  <option value="WEATHER">Severe Weather / Storm</option>
                  <option value="POWER">Power Outage / Facility</option>
                  <option value="EVACUATION">Campus Evacuation</option>
                  <option value="GENERAL">General Emergency</option>
                </select>
                <select
                  value={emergencyForm.severity}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, severity: e.target.value })}
                >
                  <option value="INFO">Level 1 - Information</option>
                  <option value="WARNING">Level 2 - Warning</option>
                  <option value="CRITICAL">Level 3 - Critical</option>
                  <option value="EMERGENCY">Level 4 - Immediate Emergency</option>
                </select>
              </div>
              <input
                placeholder="Alert Headline (e.g. Fire alarm triggered in East Wing Floor 4) *"
                value={emergencyForm.alertTitle}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, alertTitle: e.target.value })}
                required
              />
              <textarea
                placeholder="Detailed instructions for students, faculty and staff (e.g. Please evacuate calmly using staircase C and proceed to football ground assembly point)... *"
                rows={4}
                value={emergencyForm.alertMessage}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, alertMessage: e.target.value })}
                required
              />

              {statusMessage && <div className={`profile-message profile-message--${statusMessage.type}`}>{statusMessage.text}</div>}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setEmergencyModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ background: '#ef4444' }} disabled={busy}>
                  <AlertTriangle size={16} /> Broadcast Campus-Wide Alert
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
