import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const ParkingManagement = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api('/api/admin/campus-operations/parking');
            setZones(res.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load parking zones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await api('/api/admin/campus-operations/parking', { method: 'POST', body: JSON.stringify(formData) });
            setIsFormOpen(false);
            setFormData({});
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to save parking zone.');
        }
    };

    const handleCapacityChange = async (id, currentCapacity) => {
        const newCap = prompt('Enter new total capacity:', currentCapacity);
        if (newCap && !isNaN(newCap)) {
            try {
                await api(`/api/admin/campus-operations/parking/${id}/capacity`, {
                    method: 'PATCH',
                    body: JSON.stringify({ capacity: parseInt(newCap) })
                });
                fetchData();
            } catch (err) {
                alert(err.message || 'Failed to update capacity.');
            }
        }
    };

    const handleOccupancyChange = async (id, currentOccupied) => {
        const newOcc = prompt('Enter new occupied count:', currentOccupied);
        if (newOcc && !isNaN(newOcc)) {
            try {
                await api(`/api/admin/campus-operations/parking/${id}/occupancy`, {
                    method: 'PATCH',
                    body: JSON.stringify({ occupied: parseInt(newOcc) })
                });
                fetchData();
            } catch (err) {
                alert(err.message || 'Failed to update occupancy.');
            }
        }
    };

    if (loading && zones.length === 0) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="parking-management">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--card-bg)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <h3>Parking Zones</h3>
                <button className="btn btn-primary" onClick={() => { setFormData({}); setIsFormOpen(true); }}>Add Zone</button>
            </div>
            
            <div className="parking-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {zones.map(zone => {
                    const available = zone.totalCapacity - zone.currentOccupied;
                    const percent = (zone.currentOccupied / zone.totalCapacity) * 100;
                    let color = 'var(--success-color)';
                    if (percent > 80) color = 'var(--warning-color)';
                    if (percent >= 100) color = 'var(--danger-color)';

                    return (
                        <div key={zone.id} className="card parking-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{zone.zoneCode}</h4>
                                    <small style={{ color: 'var(--text-muted)' }}>{zone.zoneName}</small>
                                </div>
                                <span className={`status-badge ${zone.status === 'AVAILABLE' ? 'success' : zone.status === 'FULL' ? 'error' : 'warning'}`}>{zone.status}</span>
                            </div>

                            <div className="progress-bar-container" style={{ background: 'var(--border-color)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                <div className="progress-bar" style={{ width: `${percent}%`, height: '100%', background: color, transition: 'width 0.3s ease' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{available}</div>
                                    <small>Available Spots</small>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem' }}>{zone.currentOccupied} / {zone.totalCapacity}</div>
                                    <small>Occupied / Total</small>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleOccupancyChange(zone.id, zone.currentOccupied)}>Update Occupancy</button>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleCapacityChange(zone.id, zone.totalCapacity)}>Set Capacity</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Parking Zone</h3>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Zone Code</label>
                                <input type="text" required value={formData.zoneCode || ''} onChange={e => setFormData({...formData, zoneCode: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Zone Name</label>
                                <input type="text" required value={formData.zoneName || ''} onChange={e => setFormData({...formData, zoneName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Allowed Vehicle Type</label>
                                <select required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="">Select Type</option>
                                    <option value="CAR">Car</option>
                                    <option value="MOTORCYCLE">Motorcycle</option>
                                    <option value="BICYCLE">Bicycle</option>
                                    <option value="FACULTY_VIP">Faculty/VIP</option>
                                    <option value="GENERAL">General</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Total Capacity</label>
                                <input type="number" required value={formData.totalCapacity || ''} onChange={e => setFormData({...formData, totalCapacity: e.target.value})} />
                            </div>
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

export default ParkingManagement;
