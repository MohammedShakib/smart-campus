import React, { useState, useEffect } from 'react';
import { SectionHeader, Table } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';

export function StudentCafeteriaSection() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  function fetchMenu() {
    api('/api/student/cafeteria')
      .then((res) => {
        setMenu(res.data || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <div className="loading-spinner">Loading cafeteria menu...</div>;

  return (
    <div>
      <SectionHeader title="Cafeteria" subtitle="Today's menu and availability." />
      <div className="section-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Today's Menu</h3>
            <span className="panel-tag">{menu.length} items</span>
          </div>
          <div className="panel-body">
            {error && <div className="error-message">{error}</div>}
            <Table
              headers={['Item', 'Category', 'Price', 'Availability']}
              rows={menu.map(m => [
                m.itemName,
                m.category,
                `$${parseFloat(m.price).toFixed(2)}`,
                m.isAvailable ? 'Available' : 'Sold Out'
              ])}
              empty="Menu is currently unavailable."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
