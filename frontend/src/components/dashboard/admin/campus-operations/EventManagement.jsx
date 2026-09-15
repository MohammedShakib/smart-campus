import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const EventManagement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api('/api/admin/campus-operations/events');
            setEvents(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await api('/api/admin/campus-operations/events', { method: 'POST', body: JSON.stringify(formData) });
            setIsFormOpen(false);
            setFormData({});
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save event.');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api(`/api/admin/campus-operations/events/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.');
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="event-management">
            <div className="data-table-container card">
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                    <h3>Campus Events</h3>
                    <button className="btn btn-primary" onClick={() => { setFormData({}); setIsFormOpen(true); }}>Create Event</button>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title & Organizer</th>
                                <th>Date & Time</th>
                                <th>Location & Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(ev => (
                                <tr key={ev.id}>
                                    <td>
                                        <strong>{ev.title}</strong><br/>
                                        <small>{ev.organizer}</small>
                                    </td>
                                    <td>
                                        {ev.eventDate}<br/>
                                        <small>{ev.startTime} - {ev.endTime}</small>
                                    </td>
                                    <td>
                                        {ev.location}<br/>
                                        <small>Cap: {ev.capacity || 'N/A'}</small>
                                    </td>
                                    <td>
                                        <select 
                                            value={ev.status} 
                                            onChange={(e) => handleStatusChange(ev.id, e.target.value)}
                                            style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                        >
                                            <option value="DRAFT">DRAFT</option>
                                            <option value="PUBLISHED">PUBLISHED</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button className="btn btn-small btn-secondary" onClick={() => alert(ev.description)}>View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Create Event</h3>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Organizer</label>
                                <input type="text" value={formData.organizer || ''} onChange={e => setFormData({...formData, organizer: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" required value={formData.eventDate || ''} onChange={e => setFormData({...formData, eventDate: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Start Time</label>
                                    <input type="time" required value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>End Time</label>
                                    <input type="time" required value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Capacity</label>
                                <input type="number" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
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

export default EventManagement;
