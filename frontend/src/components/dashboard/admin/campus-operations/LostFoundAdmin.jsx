import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const LostFoundAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api('/api/admin/campus-operations/lost-found');
            setItems(res.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResolve = async (id, action) => {
        try {
            await api(`/api/admin/campus-operations/lost-found/${id}/resolve`, {
                method: 'POST',
                body: JSON.stringify({ action })
            });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to resolve item.');
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const getStatusClass = (status) => {
        switch(status) {
            case 'OPEN': return 'warning';
            case 'CLAIM_PENDING': return 'primary';
            case 'RESOLVED': return 'success';
            default: return '';
        }
    };

    return (
        <div className="lost-found-admin">
            <div className="data-table-container card">
                <div className="table-header" style={{ padding: '1rem' }}>
                    <h3>Lost & Found Oversight</h3>
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type / Category</th>
                                <th>Location & Date</th>
                                <th>Reporter</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            {item.imageUrl && (
                                                <img src={item.imageUrl} alt="Item" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            )}
                                            <div>
                                                <strong>{item.title}</strong><br/>
                                                <small>{(item.description || '').substring(0, 50)}...</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${item.type === 'LOST' ? 'error' : 'success'}`}>{item.type}</span><br/>
                                        <small>{item.category}</small>
                                    </td>
                                    <td>
                                        {item.location}<br/>
                                        <small>{item.itemDate}</small>
                                    </td>
                                    <td>
                                        {item.reporterName}<br/>
                                        <small>{item.reporterId}</small>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(item.status)}`}>{item.status}</span>
                                    </td>
                                    <td>
                                        {item.status !== 'RESOLVED' && (
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button className="btn btn-small btn-success" onClick={() => handleResolve(item.id, 'RETURNED')}>Return</button>
                                                <button className="btn btn-small btn-secondary" onClick={() => handleResolve(item.id, 'CLOSE')}>Close</button>
                                            </div>
                                        )}
                                        {item.status === 'RESOLVED' && <small className="text-muted">Resolved</small>}
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

export default LostFoundAdmin;
