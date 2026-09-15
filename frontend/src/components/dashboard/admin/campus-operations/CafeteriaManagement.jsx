import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const CafeteriaManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api('/api/admin/campus-operations/cafeteria');
            setMenuItems(res.data || []);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load menu items.');
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
            await api('/api/admin/campus-operations/cafeteria', { method: 'POST', body: JSON.stringify(formData) });
            setIsFormOpen(false);
            setFormData({});
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to save menu item.');
        }
    };

    const handleAvailabilityToggle = async (id, currentStatus) => {
        try {
            await api(`/api/admin/campus-operations/cafeteria/${id}/availability`, {
                method: 'PATCH',
                body: JSON.stringify({ available: !currentStatus })
            });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to update availability.');
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    // Group items by category
    const groupedMenu = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    return (
        <div className="cafeteria-management">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--card-bg)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <h3>Cafeteria Menu</h3>
                <button className="btn btn-primary" onClick={() => { setFormData({}); setIsFormOpen(true); }}>Add Item</button>
            </div>

            <div className="menu-categories" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {Object.keys(groupedMenu).length === 0 ? (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>No items in the menu.</div>
                ) : (
                    Object.entries(groupedMenu).map(([category, items]) => (
                        <div key={category} className="menu-category card">
                            <h4 style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', margin: 0, textTransform: 'capitalize' }}>{category.toLowerCase()}</h4>
                            <div className="table-responsive">
                                <table className="data-table" style={{ margin: 0 }}>
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Description</th>
                                            <th>Price (BDT)</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id} style={{ opacity: item.available ? 1 : 0.6 }}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.description}</td>
                                                <td>BDT {Number(item.price).toFixed(2)}</td>
                                                <td><span className={`status-badge ${item.available ? 'success' : 'error'}`}>{item.available ? 'Available' : 'Out of Stock'}</span></td>
                                                <td>
                                                    <button className="btn btn-small btn-secondary" onClick={() => handleAvailabilityToggle(item.id, item.available)}>Toggle</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Menu Item</h3>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Item Name</label>
                                <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select required value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    <option value="">Select Category</option>
                                    <option value="BREAKFAST">Breakfast</option>
                                    <option value="LUNCH">Lunch</option>
                                    <option value="SNACKS">Snacks</option>
                                    <option value="DRINKS">Drinks</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Price (BDT)</label>
                                <input type="number" step="0.01" required value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
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

export default CafeteriaManagement;
