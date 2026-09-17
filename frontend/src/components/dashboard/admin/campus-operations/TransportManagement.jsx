import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus,
  Map,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RadioTower,
  Save,
  X,
  Edit2,
  RefreshCw,
  Phone,
  User,
  Navigation,
  Trash2
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState, BusLocations } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function TransportManagement() {
  const [subTab, setSubTab] = useState('buses'); // buses, routes, tracking
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busLocations, setBusLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [busForm, setBusForm] = useState({
    id: null,
    busCode: '',
    registrationNumber: '',
    driverName: '',
    driverPhone: '',
    capacity: 40,
    operationalStatus: 'AVAILABLE'
  });

  const [routeForm, setRouteForm] = useState({
    id: null,
    routeCode: '',
    name: '',
    origin: '',
    destination: '',
    assignedBusId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [busesRes, routesRes] = await Promise.all([
        api('/api/admin/campus-operations/buses'),
        api('/api/admin/campus-operations/routes')
      ]);
      setBuses(dataOf(busesRes));
      setRoutes(dataOf(routesRes));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load transport data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    try {
      const res = await api('/api/campus/bus/locations');
      if (res?.data) {
        setBusLocations(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval;
    if (subTab === 'tracking') {
      fetchTracking();
      interval = setInterval(fetchTracking, 10000);
    }
    return () => clearInterval(interval);
  }, [subTab]);

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);
    try {
      const payload = {
        busCode: busForm.busCode.trim().toUpperCase(),
        registrationNumber: busForm.registrationNumber.trim().toUpperCase(),
        driverName: busForm.driverName.trim(),
        driverPhone: busForm.driverPhone.trim(),
        capacity: Number(busForm.capacity),
        operationalStatus: busForm.operationalStatus || 'AVAILABLE'
      };

      if (busForm.id) {
        await api(`/api/admin/campus-operations/buses/${busForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: `Bus ${payload.busCode} updated successfully.` });
      } else {
        await api('/api/admin/campus-operations/buses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: 'New bus added to campus fleet.' });
      }
      setIsBusModalOpen(false);
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save bus.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);
    try {
      const payload = {
        routeCode: routeForm.routeCode.trim().toUpperCase(),
        name: routeForm.name.trim(),
        origin: routeForm.origin.trim(),
        destination: routeForm.destination.trim(),
        assignedBus: routeForm.assignedBusId ? { id: Number(routeForm.assignedBusId) } : null
      };

      if (routeForm.id) {
        await api(`/api/admin/campus-operations/routes/${routeForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: `Route ${payload.routeCode} updated successfully.` });
      } else {
        await api('/api/admin/campus-operations/routes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: 'New shuttle route created.' });
      }
      setIsRouteModalOpen(false);
      setRouteForm({ id: null, routeCode: '', name: '', origin: '', destination: '', assignedBusId: '' });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save route.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBus = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete bus "${code}"?`)) return;
    try {
      await api(`/api/admin/campus-operations/buses/${id}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: `Bus "${code}" deleted successfully.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete bus.' });
    }
  };

  const handleDeleteRoute = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete route "${code}"?`)) return;
    try {
      await api(`/api/admin/campus-operations/routes/${id}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: `Route "${code}" deleted successfully.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete route.' });
    }
  };

  const toggleBusStatus = async (bus) => {
    try {
      await api(`/api/admin/campus-operations/buses/${bus.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: bus.operationalStatus || 'AVAILABLE',
          active: !bus.active
        })
      });
      setToastMessage({ type: 'success', text: `Bus ${bus.busCode} status updated.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update bus status.' });
    }
  };

  const toggleRouteStatus = async (route) => {
    try {
      await api(`/api/admin/campus-operations/routes/${route.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !route.active })
      });
      setToastMessage({ type: 'success', text: `Route ${route.routeCode} status updated.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update route status.' });
    }
  };

  const filteredBuses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buses;
    return buses.filter(b =>
      (b.busCode && b.busCode.toLowerCase().includes(q)) ||
      (b.registrationNumber && b.registrationNumber.toLowerCase().includes(q)) ||
      (b.driverName && b.driverName.toLowerCase().includes(q)) ||
      (b.driverPhone && b.driverPhone.toLowerCase().includes(q))
    );
  }, [buses, search]);

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(r =>
      (r.routeCode && r.routeCode.toLowerCase().includes(q)) ||
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.origin && r.origin.toLowerCase().includes(q)) ||
      (r.destination && r.destination.toLowerCase().includes(q))
    );
  }, [routes, search]);

  const activeBusesCount = buses.filter(b => b.active).length;
  const activeRoutesCount = routes.filter(r => r.active).length;

  return (
    <div className="campus-subpage transport-management-view">
      {toastMessage && (
        <div className={`notice ${toastMessage.type}`} style={{ marginBottom: '1rem' }}>
          {toastMessage.text}
        </div>
      )}

      {/* Top Metrics */}
      <div className="metric-grid">
        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Fleet Vehicles</span>
            <span className="metric-icon"><Bus size={20} /></span>
          </div>
          <strong>{buses.length}</strong>
          <div className="metric-card-foot"><span>{activeBusesCount} active on duty</span></div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Active Routes</span>
            <span className="metric-icon"><Map size={20} /></span>
          </div>
          <strong>{routes.length}</strong>
          <div className="metric-card-foot"><span>{activeRoutesCount} running schedules</span></div>
        </div>

        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Total Passenger Cap</span>
            <span className="metric-icon"><User size={20} /></span>
          </div>
          <strong>{buses.reduce((acc, b) => acc + (b.capacity || 0), 0)}</strong>
          <div className="metric-card-foot"><span>Seating capacity</span></div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Live Telemetry</span>
            <span className="metric-icon"><RadioTower size={20} /></span>
          </div>
          <strong>{Object.keys(busLocations).length || activeBusesCount}</strong>
          <div className="metric-card-foot"><span>Socket transmissions</span></div>
        </div>
      </div>

      {/* Sub-tab Pill Navigation */}
      <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="academic-tabs" style={{ maxWidth: '460px' }}>
          <button
            type="button"
            className={`academic-tab${subTab === 'buses' ? ' is-active' : ''}`}
            onClick={() => { setSubTab('buses'); setSearch(''); }}
          >
            <Bus size={15} />
            <span>Bus Fleet</span>
          </button>
          <button
            type="button"
            className={`academic-tab${subTab === 'routes' ? ' is-active' : ''}`}
            onClick={() => { setSubTab('routes'); setSearch(''); }}
          >
            <Map size={15} />
            <span>Shuttle Routes</span>
          </button>
          <button
            type="button"
            className={`academic-tab${subTab === 'tracking' ? ' is-active' : ''}`}
            onClick={() => { setSubTab('tracking'); setSearch(''); }}
          >
            <Activity size={15} />
            <span>Live GPS Radar</span>
          </button>
        </div>
      </div>

      {/* Tab: BUSES */}
      {subTab === 'buses' && (
        <Panel title="University Bus Fleet" tag={`${filteredBuses.length} BUSES`}>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by bus code, registration, or driver..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-toolbar-right">
              <ActionButton
                label="Add New Bus"
                icon={Plus}
                onClick={() => {
                  setBusForm({ id: null, busCode: '', registrationNumber: '', driverName: '', driverPhone: '', capacity: 40, operationalStatus: 'AVAILABLE' });
                  setIsBusModalOpen(true);
                }}
              />
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading bus fleet...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredBuses.length === 0 ? (
            <EmptyState title="No buses found" message="Add a bus or adjust your search term." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bus Code</th>
                    <th>Registration No.</th>
                    <th>Capacity</th>
                    <th>Driver Contact</th>
                    <th>Operational Status</th>
                    <th>Active</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map(bus => (
                    <tr key={bus.id}>
                      <td><strong className="code-pill">{bus.busCode}</strong></td>
                      <td><span style={{ fontWeight: 600 }}>{bus.registrationNumber}</span></td>
                      <td><span className="section-chip">{bus.capacity} Seats</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{bus.driverName || 'Unassigned'}</span>
                          {bus.driverPhone && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>
                              <Phone size={11} style={{ display: 'inline', marginRight: 3 }} />
                              {bus.driverPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-badge status-${(bus.operationalStatus || 'available').toLowerCase()}`}>
                          {bus.operationalStatus || 'AVAILABLE'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${bus.active ? 'status-active' : 'status-disabled'}`}>
                          {bus.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit Bus"
                            onClick={() => {
                              setBusForm({
                                id: bus.id,
                                busCode: bus.busCode,
                                registrationNumber: bus.registrationNumber,
                                driverName: bus.driverName || '',
                                driverPhone: bus.driverPhone || '',
                                capacity: bus.capacity || 40,
                                operationalStatus: bus.operationalStatus || 'AVAILABLE'
                              });
                              setIsBusModalOpen(true);
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title={bus.active ? "Disable Bus" : "Enable Bus"}
                            onClick={() => toggleBusStatus(bus)}
                          >
                            {bus.active ? <XCircle size={15} color="var(--rose)" /> : <CheckCircle2 size={15} color="var(--emerald)" />}
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Delete Bus"
                            onClick={() => handleDeleteBus(bus.id, bus.busCode)}
                          >
                            <Trash2 size={15} color="var(--rose)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* Tab: ROUTES */}
      {subTab === 'routes' && (
        <Panel title="Bus Routes & Pathways" tag={`${filteredRoutes.length} ROUTES`}>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by route code, origin, or destination..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-toolbar-right">
              <ActionButton
                label="Add Route"
                icon={Plus}
                onClick={() => {
                  setRouteForm({ id: null, routeCode: '', name: '', origin: '', destination: '', assignedBusId: '' });
                  setIsRouteModalOpen(true);
                }}
              />
            </div>
          </div>

          {filteredRoutes.length === 0 ? (
            <EmptyState title="No routes found" message="Create a new shuttle route to get started." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Route Code</th>
                    <th>Route Name</th>
                    <th>Origin & Destination</th>
                    <th>Assigned Bus</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map(route => (
                    <tr key={route.id}>
                      <td><strong className="code-pill">{route.routeCode}</strong></td>
                      <td><strong>{route.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
                          <span>{route.origin}</span>
                          <Navigation size={13} style={{ color: 'var(--tx-muted)' }} />
                          <span>{route.destination}</span>
                        </div>
                      </td>
                      <td>
                        {route.assignedBus ? (
                          <span className="room-pill room-pill--active">
                            <Bus size={13} /> {route.assignedBus.busCode} ({route.assignedBus.registrationNumber})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--tx-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-status-badge ${route.active ? 'status-active' : 'status-disabled'}`}>
                          {route.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit Route"
                            onClick={() => {
                              setRouteForm({
                                id: route.id,
                                routeCode: route.routeCode || '',
                                name: route.name || '',
                                origin: route.origin || '',
                                destination: route.destination || '',
                                assignedBusId: route.assignedBus ? String(route.assignedBus.id) : ''
                              });
                              setIsRouteModalOpen(true);
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title={route.active ? "Disable Route" : "Enable Route"}
                            onClick={() => toggleRouteStatus(route)}
                          >
                            {route.active ? <XCircle size={15} color="var(--rose)" /> : <CheckCircle2 size={15} color="var(--emerald)" />}
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title="Delete Route"
                            onClick={() => handleDeleteRoute(route.id, route.routeCode)}
                          >
                            <Trash2 size={15} color="var(--rose)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* Tab: TRACKING */}
      {subTab === 'tracking' && (
        <Panel title="Real-Time Bus GPS Socket Telemetry" tag="LIVE TCP">
          <div style={{ padding: '0.5rem 0' }}>
            <BusLocations locations={busLocations} />
          </div>
        </Panel>
      )}

      {/* Modal: Create/Edit Bus */}
      {isBusModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setIsBusModalOpen(false)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Fleet Management</span>
                <h2>{busForm.id ? 'Edit Bus' : 'Add Fleet Bus'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsBusModalOpen(false)}><X size={16} /></button>
            </header>
            <form onSubmit={handleBusSubmit} className="standard-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Bus Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. BUS-01"
                    value={busForm.busCode}
                    onChange={(e) => setBusForm({ ...busForm, busCode: e.target.value })}
                    disabled={!!busForm.id}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. DHA-CHA-11-2233"
                    value={busForm.registrationNumber}
                    onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value })}
                    disabled={!!busForm.id}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Driver Name *</label>
                  <input
                    type="text"
                    placeholder="Driver Full Name"
                    value={busForm.driverName}
                    onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Driver Phone *</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={busForm.driverPhone}
                    onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Seating Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={busForm.capacity}
                    onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Operational Status *</label>
                  <select
                    value={busForm.operationalStatus}
                    onChange={(e) => setBusForm({ ...busForm, operationalStatus: e.target.value })}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_SERVICE">In Service</option>
                    <option value="ON_ROUTE">On Route</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>
              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setIsBusModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}><Save size={16} /> Save Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Route */}
      {isRouteModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setIsRouteModalOpen(false)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Route Network</span>
                <h2>{routeForm.id ? 'Edit Shuttle Route' : 'Add Shuttle Route'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsRouteModalOpen(false)}><X size={16} /></button>
            </header>
            <form onSubmit={handleRouteSubmit} className="standard-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Route Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. ROUTE-A"
                    value={routeForm.routeCode}
                    onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                    disabled={!!routeForm.id}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Route Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Notun Bazar - UIU Campus"
                    value={routeForm.name}
                    onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Origin *</label>
                  <input
                    type="text"
                    placeholder="e.g. Notun Bazar"
                    value={routeForm.origin}
                    onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Destination *</label>
                  <input
                    type="text"
                    placeholder="e.g. UIU Campus"
                    value={routeForm.destination}
                    onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Assign Bus (Optional)</label>
                  <select
                    value={routeForm.assignedBusId}
                    onChange={(e) => setRouteForm({ ...routeForm, assignedBusId: e.target.value })}
                  >
                    <option value="">None (Unassigned)</option>
                    {buses.filter(b => b.active).map(b => (
                      <option key={b.id} value={b.id}>{b.busCode} - {b.registrationNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setIsRouteModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}><Save size={16} /> Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
