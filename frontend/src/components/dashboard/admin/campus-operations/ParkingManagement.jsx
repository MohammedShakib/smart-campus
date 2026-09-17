import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  TrendingUp,
  Clock,
  Layers,
  Save,
  X,
  RefreshCw,
  Edit2,
  Sliders,
  CheckCircle2,
  XCircle,
  Trash2
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function ParkingManagement() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    zoneCode: '',
    zoneName: '',
    totalCapacity: 50,
    currentOccupied: 0
  });

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/campus-operations/parking');
      setZones(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load parking data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateZone = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);
    try {
      const payload = {
        zoneCode: createForm.zoneCode.trim().toUpperCase(),
        zoneName: createForm.zoneName.trim(),
        totalCapacity: Number(createForm.totalCapacity),
        currentOccupied: Number(createForm.currentOccupied || 0)
      };

      await api('/api/admin/campus-operations/parking', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setToastMessage({ type: 'success', text: 'New parking zone created.' });
      setIsCreateModalOpen(false);
      setCreateForm({ zoneCode: '', zoneName: '', totalCapacity: 50, currentOccupied: 0 });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to create parking zone.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOccupancy = async (zone, newOccupancy) => {
    const val = Math.max(0, Math.min(zone.totalCapacity, Number(newOccupancy)));
    try {
      await api(`/api/admin/campus-operations/parking/${zone.id}/occupancy`, {
        method: 'PATCH',
        body: JSON.stringify({ occupied: val })
      });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update occupancy.' });
    }
  };

  const handleUpdateCapacity = async (zone, newCapacity) => {
    const cap = Math.max(zone.currentOccupied, Number(newCapacity));
    try {
      await api(`/api/admin/campus-operations/parking/${zone.id}/capacity`, {
        method: 'PATCH',
        body: JSON.stringify({ capacity: cap })
      });
      setToastMessage({ type: 'success', text: `Capacity for ${zone.zoneCode} updated to ${cap}.` });
      setEditZone(null);
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update capacity.' });
    }
  };

  const handleDeleteZone = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete parking zone "${code}"?`)) {
      return;
    }
    try {
      await api(`/api/admin/campus-operations/parking/${id}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: `Parking zone "${code}" deleted.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete parking zone.' });
    }
  };

  const totalCap = zones.reduce((acc, z) => acc + (z.totalCapacity || 0), 0);
  const totalOcc = zones.reduce((acc, z) => acc + (z.currentOccupied || 0), 0);
  const availableSlots = totalCap - totalOcc;
  const overallUtil = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

  return (
    <div className="campus-subpage parking-management-view">
      {/* Toast Feedback */}
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

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Total Parking Slots</span>
            <span className="metric-icon"><Car size={20} /></span>
          </div>
          <strong>{totalCap}</strong>
          <div className="metric-card-foot"><span>Across {zones.length} campus zones</span></div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Currently Occupied</span>
            <span className="metric-icon"><TrendingUp size={20} /></span>
          </div>
          <strong>{totalOcc}</strong>
          <div className="metric-card-foot"><span>{overallUtil}% utilized</span></div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Available Vacancies</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong style={{ color: '#047857' }}>{availableSlots}</strong>
          <div className="metric-card-foot"><span>Free parking bays</span></div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel
          title="Campus Parking Zones & Real-Time Sensors"
          tag={`${zones.length} ZONES`}
          action={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
                <span>Refresh</span>
              </button>
              <ActionButton
                label="Add Parking Zone"
                icon={Plus}
                onClick={() => setIsCreateModalOpen(true)}
              />
            </div>
          }
        >
          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading parking telemetry...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : zones.length === 0 ? (
            <EmptyState title="No parking zones defined" message="Create your first parking zone to monitor occupancy." />
          ) : (
            <div className="parking-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              {zones.map(zone => {
                const percent = zone.totalCapacity > 0 ? Math.round((zone.currentOccupied / zone.totalCapacity) * 100) : 0;
                const free = zone.totalCapacity - zone.currentOccupied;
                const statusTone = percent >= 100 ? 'critical' : percent >= 75 ? 'warning' : 'success';

                return (
                  <div key={zone.id} className="parking-lot-card" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '1.15rem', background: '#ffffff', boxShadow: '0 1px 3px rgba(15,23,42,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <strong className="code-pill" style={{ fontSize: '0.9rem' }}>{zone.zoneCode}</strong>
                        <h4 style={{ margin: '0.35rem 0 0', fontSize: '0.95rem' }}>{zone.zoneName}</h4>
                      </div>
                      <span className={`admin-status-badge status-${statusTone}`}>
                        {percent >= 100 ? 'FULL' : percent >= 75 ? 'LIMITED' : 'AVAILABLE'}
                      </span>
                    </div>

                    {/* Capacity & Progress */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--tx-secondary)', marginBottom: '0.35rem' }}>
                        <span>Occupancy: <strong>{zone.currentOccupied}</strong> / {zone.totalCapacity}</span>
                        <span>{percent}% Full ({free} Free)</span>
                      </div>
                      <div className="rate-meter-bar" style={{ maxWidth: '100%', height: '8px' }}>
                        <div
                          className={`rate-meter-fill rate-meter-fill--${statusTone}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Occupancy Steppers & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--tx-muted)', fontWeight: 600 }}>Adjust:</span>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', minWidth: '28px' }}
                          onClick={() => handleUpdateOccupancy(zone, zone.currentOccupied - 1)}
                          disabled={zone.currentOccupied <= 0}
                          title="Decrease occupied count (-1)"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', minWidth: '28px' }}
                          onClick={() => handleUpdateOccupancy(zone, zone.currentOccupied + 1)}
                          disabled={zone.currentOccupied >= zone.totalCapacity}
                          title="Increase occupied count (+1)"
                        >
                          +
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => setEditZone({ ...zone })}
                          title="Edit total capacity"
                        >
                          <Sliders size={13} />
                          <span>Cap</span>
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Delete Zone"
                          onClick={() => handleDeleteZone(zone.id, zone.zoneCode)}
                        >
                          <Trash2 size={13} color="var(--rose)" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Modal: Create Zone */}
      {isCreateModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setIsCreateModalOpen(false)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Parking Operations</span>
                <h2>Add Parking Zone</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsCreateModalOpen(false)}><X size={16} /></button>
            </header>
            <form onSubmit={handleCreateZone} className="standard-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Zone Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B2-EAST"
                    value={createForm.zoneCode}
                    onChange={(e) => setCreateForm({ ...createForm, zoneCode: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Zone Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basement 2 Car Park (Faculty)"
                    value={createForm.zoneName}
                    onChange={(e) => setCreateForm({ ...createForm, zoneName: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Total Capacity (Bays) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createForm.totalCapacity}
                    onChange={(e) => setCreateForm({ ...createForm, totalCapacity: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Initial Occupied Count</label>
                  <input
                    type="number"
                    min="0"
                    max={createForm.totalCapacity}
                    value={createForm.currentOccupied}
                    onChange={(e) => setCreateForm({ ...createForm, currentOccupied: e.target.value })}
                  />
                </div>
              </div>
              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <Save size={16} /> {submitting ? 'Saving...' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Capacity */}
      {editZone && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setEditZone(null)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Parking Capacity</span>
                <h2>Update Zone Capacity ({editZone.zoneCode})</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setEditZone(null)}><X size={16} /></button>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateCapacity(editZone, editZone.totalCapacity);
              }}
              className="standard-form-content"
            >
              <div className="admin-form-grid">
                <div className="admin-form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Total Slot Capacity (Must be &ge; {editZone.currentOccupied}) *</label>
                  <input
                    type="number"
                    min={editZone.currentOccupied}
                    required
                    value={editZone.totalCapacity}
                    onChange={(e) => setEditZone({ ...editZone, totalCapacity: e.target.value })}
                  />
                </div>
              </div>
              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setEditZone(null)}>Cancel</button>
                <button type="submit" className="primary-btn">
                  <Save size={16} /> Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
