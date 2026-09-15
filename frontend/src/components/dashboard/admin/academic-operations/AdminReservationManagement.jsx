import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const AdminReservationManagement = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const res = await api('/api/admin/academic-operations/reservations');
            setReservations(res.data || res || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to fetch reservations.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api(`/api/admin/academic-operations/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
            fetchReservations();
        } catch (err) {
            alert(err.message || 'Failed to update reservation status.');
        }
    };

    if (loading) return <div className="loading-state">Loading reservations...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="reservation-management">
            <div className="summary-cards">
                <div className="summary-card">
                    <h4>Total Reservations</h4>
                    <div className="card-value">{reservations.length}</div>
                </div>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Room</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Purpose</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map(res => (
                            <tr key={res.id}>
                                <td>{res.teacherEmail}</td>
                                <td>{res.roomNumber}</td>
                                <td>{res.reservationDate}</td>
                                <td>{res.startTime} - {res.endTime}</td>
                                <td>{res.purpose}</td>
                                <td><span className={`badge ${res.status.toLowerCase()}`}>{res.status}</span></td>
                                <td>
                                    {res.status !== 'APPROVED' && res.status !== 'CANCELLED' && (
                                        <button className="action-button approve" onClick={() => handleStatusChange(res.id, 'APPROVED')}>Approve</button>
                                    )}
                                    {res.status !== 'REJECTED' && res.status !== 'CANCELLED' && (
                                        <button className="action-button reject" onClick={() => handleStatusChange(res.id, 'REJECTED')}>Reject</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reservations.length === 0 && (
                            <tr>
                                <td colSpan="7" className="empty-state">No reservations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReservationManagement;
