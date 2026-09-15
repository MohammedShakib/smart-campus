import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { Bus, Map, Activity } from 'lucide-react';

const TransportManagement = () => {
    const [subTab, setSubTab] = useState('buses'); // buses, routes, tracking
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [busLocations, setBusLocations] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [busesRes, routesRes] = await Promise.all([
                api('/api/admin/campus-operations/buses'),
                api('/api/admin/campus-operations/routes')
            ]);
            setBuses(busesRes.data || []);
            setRoutes(routesRes.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load transport data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTracking = async () => {
        try {
            const res = await api('/api/campus/bus/locations');
            if (res.data) {
                setBusLocations(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch tracking data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (subTab === 'tracking') {
            fetchTracking();
            interval = setInterval(fetchTracking, 20000); // 20s polling
        }
        return () => clearInterval(interval);
    }, [subTab]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (subTab === 'buses') {
                if (formData.id) {
                    await api(`/api/admin/campus-operations/buses/${formData.id}`, { method: 'PUT', body: JSON.stringify(formData) });
                } else {
                    await api('/api/admin/campus-operations/buses', { method: 'POST', body: JSON.stringify(formData) });
                }
            } else if (subTab === 'routes') {
                await api('/api/admin/campus-operations/routes', { method: 'POST', body: JSON.stringify(formData) });
            }
            setIsFormOpen(false);
            setFormData({});
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to save data.');
        }
    };

    const handleStatusToggle = async (id, currentStatus, type) => {
        try {
            if (type === 'bus') {
                const bus = buses.find(item => item.id === id);
                await api(`/api/admin/campus-operations/buses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: bus?.operationalStatus || 'AVAILABLE', active: !currentStatus }) });
            } else {
                await api(`/api/admin/campus-operations/routes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !currentStatus }) });
            }
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to update status.');
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="transport-management">
            <div className="secondary-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className={`btn ${subTab === 'buses' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSubTab('buses')}><Bus size={16} /> Buses</button>
                <button className={`btn ${subTab === 'routes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSubTab('routes')}><Map size={16} /> Routes</button>
                <button className={`btn ${subTab === 'tracking' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSubTab('tracking')}><Activity size={16} /> Tracking</button>
            </div>

            {subTab === 'buses' && (
                <div className="data-table-container card">
                    <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                        <h3>Bus Fleet</h3>
                        <button className="btn btn-primary" onClick={() => { setFormData({}); setIsFormOpen(true); }}>Add Bus</button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Reg Number</th>
                                    <th>Capacity</th>
                                    <th>Driver</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buses.map(bus => (
                                    <tr key={bus.id}>
                                        <td>{bus.busCode}</td>
                                        <td>{bus.registrationNumber}</td>
                                        <td>{bus.capacity}</td>
                                        <td>{bus.driverName}<br/><small>{bus.driverPhone}</small></td>
                                        <td><span className={`status-badge ${bus.active ? 'success' : 'error'}`}>{bus.active ? 'Active' : 'Disabled'}</span></td>
                                        <td>
                                            <button className="btn btn-small btn-secondary" onClick={() => handleStatusToggle(bus.id, bus.active, 'bus')}>Toggle</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {subTab === 'routes' && (
                <div className="data-table-container card">
                    <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                        <h3>Bus Routes</h3>
                        <button className="btn btn-primary" onClick={() => { setFormData({}); setIsFormOpen(true); }}>Add Route</button>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Origin ➔ Destination</th>
                                    <th>Assigned Bus</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routes.map(r => (
                                    <tr key={r.id}>
                                        <td>{r.routeCode}</td>
                                        <td>{r.name}</td>
                                        <td>{r.origin} ➔ {r.destination}</td>
                                        <td>{r.assignedBus ? r.assignedBus.busCode : 'None'}</td>
                                        <td><span className={`status-badge ${r.active ? 'success' : 'error'}`}>{r.active ? 'Active' : 'Disabled'}</span></td>
                                        <td>
                                            <button className="btn btn-small btn-secondary" onClick={() => handleStatusToggle(r.id, r.active, 'route')}>Toggle</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {subTab === 'tracking' && (
                <div className="data-table-container card">
                    <div className="table-header" style={{ padding: '1rem' }}>
                        <h3>Live Telemetry</h3>
                        <p><small>Updating every 20 seconds from socket feeds</small></p>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Bus Code</th>
                                    <th>Current Location</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(busLocations).length === 0 ? (
                                    <tr><td colSpan="3" style={{textAlign: 'center'}}>No telemetry data available</td></tr>
                                ) : (
                                    Object.entries(busLocations).map(([code, loc]) => (
                                        <tr key={code}>
                                            <td>{code}</td>
                                            <td>{loc}</td>
                                            <td><span className="status-badge success">ONLINE</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{subTab === 'buses' ? 'Add Bus' : 'Add Route'}</h3>
                        <form onSubmit={handleFormSubmit}>
                            {subTab === 'buses' && (
                                <>
                                    <div className="form-group">
                                        <label>Bus Code</label>
                                        <input type="text" required value={formData.busCode || ''} onChange={e => setFormData({...formData, busCode: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Registration Number</label>
                                        <input type="text" required value={formData.registrationNumber || ''} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Capacity</label>
                                        <input type="number" required value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Driver Name</label>
                                        <input type="text" value={formData.driverName || ''} onChange={e => setFormData({...formData, driverName: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Driver Phone</label>
                                        <input type="text" value={formData.driverPhone || ''} onChange={e => setFormData({...formData, driverPhone: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {subTab === 'routes' && (
                                <>
                                    <div className="form-group">
                                        <label>Route Code</label>
                                        <input type="text" required value={formData.routeCode || ''} onChange={e => setFormData({...formData, routeCode: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Origin</label>
                                        <input type="text" required value={formData.origin || ''} onChange={e => setFormData({...formData, origin: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Destination</label>
                                        <input type="text" required value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} />
                                    </div>
                                </>
                            )}
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransportManagement;
