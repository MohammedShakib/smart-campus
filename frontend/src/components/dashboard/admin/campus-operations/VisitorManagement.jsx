import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const VisitorManagement = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api('/api/admin/campus-operations/visitors');
            setVisitors(res.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load visitors.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api(`/api/admin/campus-operations/visitors/${id}/approve`, { method: 'POST' });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to approve.');
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (reason !== null) {
            try {
                await api(`/api/admin/campus-operations/visitors/${id}/reject`, { 
                    method: 'POST',
                    body: JSON.stringify({ reason }) 
                });
                fetchData();
            } catch (err) {
                alert(err.message || 'Failed to reject.');
            }
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const getStatusClass = (status) => {
        switch(status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'CHECKED_IN': return 'success';
            case 'CHECKED_OUT': return 'secondary';
            default: return '';
        }
    };

    return (
        <div className="visitor-management">
            <div className="data-table-container card">
                <div className="table-header" style={{ padding: '1rem' }}>
                    <h3>Visitor Oversight</h3>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name / Contact</th>
                                <th>Purpose</th>
                                <th>Host</th>
                                <th>Date & Time</th>
                                <th>Pass Code</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map(v => (
                                <tr key={v.id}>
                                    <td>
                                        <strong>{v.visitorName}</strong><br/>
                                        <small>{v.phone}</small>
                                    </td>
                                    <td>{v.purpose}</td>
                                    <td>{v.hostName}<br/><small>{v.hostDepartment}</small></td>
                                    <td>{v.visitDate}<br/><small>{v.expectedEntryTime}</small></td>
                                    <td><code style={{background: '#eee', padding: '2px 4px'}}>{v.passCode}</code></td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(v.status)}`}>{v.status}</span>
                                    </td>
                                    <td>
                                        {v.status === 'PENDING' && (
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button className="btn btn-small btn-primary" onClick={() => handleApprove(v.id)}>Approve</button>
                                                <button className="btn btn-small btn-danger" onClick={() => handleReject(v.id)}>Reject</button>
                                            </div>
                                        )}
                                        {v.status !== 'PENDING' && (
                                            <small className="text-muted">Processed</small>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VisitorManagement;
