import React, { useState, useEffect } from 'react';
import {
  Car, AlertTriangle, CheckCircle2, XCircle, Wrench, RefreshCw,
  Sliders, Plus, Minus, ArrowUpRight, ArrowDownRight, ShieldCheck, X
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityParkingSection() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ currentOccupied: 0, totalCapacity: 100, status: 'AVAILABLE' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadParking = () => {
    setLoading(true);
    api('/api/security/parking')
      .then((res) => {
        setZones(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadParking();
  }, []);

  const handleAdjust = async (zoneCode, delta) => {
    try {
      await api(`/api/security/parking/${zoneCode}/adjust?delta=${delta}`, { method: 'POST' });
      loadParking();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (zone) => {
    setSelectedZone(zone);
    setEditForm({
      currentOccupied: zone.currentOccupied,
      totalCapacity: zone.totalCapacity,
      status: zone.status
    });
    setEditModalOpen(true);
    setFeedback(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZone) return;
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/api/security/parking/${selectedZone.zoneCode}/update`, {
        method: 'POST',
        body: JSON.stringify(editForm)
      });
      setFeedback({ type: 'success', text: `Parking zone ${selectedZone.zoneCode} updated successfully!` });
      setTimeout(() => {
        setEditModalOpen(false);
        loadParking();
      }, 900);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const totalCapacity = zones.reduce((acc, z) => acc + (z.totalCapacity || 0), 0);
  const totalOccupied = zones.reduce((acc, z) => acc + (z.currentOccupied || 0), 0);
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
  const overallPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Campus Parking Pressure & Bay Management"
        subtitle="Live vehicle occupancy monitoring across Basement 1, Basement 2, and Open Ground parking bays."
      />

      {/* Aggregate Overview Metrics */}
      <div className="sec-parking-metrics-grid">
        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--emerald"><Car size={24} /></div>
          <div className="sec-kpi-details">
            <span>Total Available Spaces</span>
            <strong style={{ color: '#10b981' }}>{totalAvailable}</strong>
            <small>Across {zones.length} parking zones</small>
          </div>
        </div>

        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--blue"><Car size={24} /></div>
          <div className="sec-kpi-details">
            <span>Vehicles Parked</span>
            <strong>{totalOccupied} / {totalCapacity}</strong>
            <small>{overallPercent}% total campus occupancy</small>
          </div>
        </div>

        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--amber"><AlertTriangle size={24} /></div>
          <div className="sec-kpi-details">
            <span>Pressure Zones</span>
            <strong>{zones.filter(z => z.status === 'FULL' || z.status === 'ALMOST_FULL').length}</strong>
            <small>Require gate redirection</small>
          </div>
        </div>
      </div>

      {/* Detailed Zone Cards */}
      <Panel title="Parking Zones & Gate Controls" tag="Live Sensor Feed">
        <div className="sec-parking-cards-grid">
          {loading ? (
            <p className="muted" style={{ padding: '2rem' }}>Loading parking zones...</p>
          ) : (
            zones.map((zone) => {
              const percent = zone.totalCapacity > 0 ? Math.round((zone.currentOccupied / zone.totalCapacity) * 100) : 0;
              const isFull = percent >= 100;
              const isAlmostFull = percent >= zone.fullThresholdPercent;
              const isClosed = zone.status === 'CLOSED' || zone.status === 'MAINTENANCE';
              const theme = isClosed ? 'gray' : isFull ? 'red' : isAlmostFull ? 'amber' : 'emerald';

              return (
                <div key={zone.id} className={`sec-zone-card sec-zone-card--${theme}`}>
                  <div className="sec-zone-card-top">
                    <div>
                      <span className="sec-zone-code">{zone.zoneCode}</span>
                      <h3>{zone.zoneName}</h3>
                      <span className="sec-zone-type-badge">{zone.type}</span>
                    </div>
                    <span className={`sec-status-pill sec-status-pill--${theme}`}>
                      {zone.status}
                    </span>
                  </div>

                  {/* Meter */}
                  <div className="sec-zone-meter-box">
                    <div className="sec-zone-meter-track">
                      <div
                        className={`sec-zone-meter-fill sec-zone-meter-fill--${theme}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <div className="sec-zone-meter-labels">
                      <strong>{zone.currentOccupied} / {zone.totalCapacity} Occupied</strong>
                      <span>{percent}% Full</span>
                    </div>
                  </div>

                  {/* Warning banner if almost full or full */}
                  {isFull && (
                    <div className="sec-zone-alert sec-zone-alert--full">
                      <AlertTriangle size={14} /> <strong>Zone Full!</strong> Redirect traffic to Open Ground.
                    </div>
                  )}
                  {isAlmostFull && !isFull && (
                    <div className="sec-zone-alert sec-zone-alert--warn">
                      <AlertTriangle size={14} /> <strong>Approaching Capacity ({percent}%)</strong>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="sec-zone-actions">
                    <div className="sec-zone-steppers">
                      <button
                        type="button"
                        className="sec-stepper-btn"
                        onClick={() => handleAdjust(zone.zoneCode, -1)}
                        disabled={zone.currentOccupied <= 0}
                        title="Vehicle Exit (-1)"
                      >
                        <Minus size={14} /> Exit
                      </button>
                      <button
                        type="button"
                        className="sec-stepper-btn"
                        onClick={() => handleAdjust(zone.zoneCode, 1)}
                        disabled={zone.currentOccupied >= zone.totalCapacity}
                        title="Vehicle Entry (+1)"
                      >
                        <Plus size={14} /> Entry
                      </button>
                    </div>

                    <button
                      type="button"
                      className="ghost-btn sec-zone-edit-btn"
                      onClick={() => openEditModal(zone)}
                    >
                      <Sliders size={14} /> Settings
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      {/* Edit Modal */}
      {editModalOpen && selectedZone && (
        <div className="profile-modal-backdrop" onMouseDown={() => setEditModalOpen(false)}>
          <section className="profile-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Parking Bay Override</span>
                <h2>Configure {selectedZone.zoneName}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setEditModalOpen(false)}><X size={16} /></button>
            </header>
            <form className="sec-modal-form" onSubmit={handleEditSubmit}>
              <div className="sec-form-row">
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Current Occupied Count</label>
                  <input
                    type="number"
                    min={0}
                    max={editForm.totalCapacity}
                    value={editForm.currentOccupied}
                    onChange={(e) => setEditForm({ ...editForm, currentOccupied: parseInt(e.target.value, 10) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Total Bay Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.totalCapacity}
                    onChange={(e) => setEditForm({ ...editForm, totalCapacity: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Zone Operational Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE (Normal Operation)</option>
                  <option value="ALMOST_FULL">ALMOST_FULL (Restricted Entry)</option>
                  <option value="FULL">FULL (Block Entry)</option>
                  <option value="CLOSED">CLOSED (Temporary Lockout)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Construction / Cleaning)</option>
                </select>
              </div>

              {feedback && (
                <div className={`profile-message profile-message--${feedback.type}`}>
                  {feedback.text}
                </div>
              )}

              <div className="profile-actions">
                <button type="button" className="ghost-btn" onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={busy}>Save Parking Configuration</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
