import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Box,
  Send,
  Wrench,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

const CATEGORIES = [
  { id: 'ALL', label: 'All Hardware' },
  { id: 'DEV_BOARD', label: 'Development Boards' },
  { id: 'SENSOR_ACTUATOR', label: 'Sensors & Motors' },
  { id: 'MEASURING_INSTRUMENT', label: 'Measurement & DSOs' },
  { id: 'ROBOTICS_KIT', label: 'Robotics Kits' },
  { id: 'ACCESSORY', label: 'Analyzers & Accessories' }
];

export function StudentLabEquipmentSection() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'my-bookings'
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    equipmentId: null,
    courseCode: 'CSE 2211',
    quantity: 1,
    borrowDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    purpose: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = () => {
    setLoading(true);
    let url = '/api/student/equipment?';
    if (selectedCategory !== 'ALL') url += `category=${selectedCategory}`;

    Promise.all([
      api(url),
      api('/api/student/equipment/my-bookings')
    ])
      .then(([eqRes, bookRes]) => {
        setEquipmentList(eqRes.data || []);
        setMyBookings(bookRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const openBookingModal = (item) => {
    setSelectedItem(item);
    setBookingForm({
      equipmentId: item.id,
      courseCode: 'CSE 2211 AOOP Lab',
      quantity: 1,
      borrowDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      purpose: ''
    });
    setBookingModalOpen(true);
    setMessage(null);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    api('/api/student/equipment/book', {
      method: 'POST',
      body: JSON.stringify(bookingForm)
    })
      .then(() => {
        setSubmitting(false);
        setMessage({
          type: 'success',
          text: 'Hardware checkout requested! Stock reserved. Please collect it from the lab technician.'
        });
        setTimeout(() => {
          setBookingModalOpen(false);
          loadData();
        }, 1300);
      })
      .catch((err) => {
        setSubmitting(false);
        setMessage({ type: 'error', text: err.message });
      });
  };

  return (
    <div className="equipment-portal-wrapper">
      <SectionHeader
        title="Hardware & Lab Equipment Booking Hub"
        subtitle="Reserve microcontrollers, sensors, oscilloscopes, and lab instruments from departmental labs for academic and research projects."
      />

      {/* Tabs */}
      <div className="tab-pill-bar">
        <button
          type="button"
          className={`tab-pill ${activeTab === 'catalogue' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalogue')}
        >
          <Cpu size={16} /> Hardware Catalogue ({equipmentList.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'my-bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-bookings')}
        >
          <Box size={16} /> My Checkout Loans & Requests ({myBookings.length})
        </button>
      </div>

      {activeTab === 'catalogue' ? (
        <div>
          {/* Category Filter Pills */}
          <div className="category-tags-bar" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Layers size={13} /> {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading hardware inventory...</p>
          ) : equipmentList.length === 0 ? (
            <p className="muted" style={{ padding: '2rem 0' }}>No equipment found for the selected category.</p>
          ) : (
            <div className="equipment-grid">
              {equipmentList.map((item) => {
                const inStock = item.availableQuantity > 0;
                return (
                  <div key={item.id} className={`equipment-card ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                    <div className="equipment-image-box">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="eq-img" />
                      ) : (
                        <div className="eq-placeholder"><Cpu size={36} /></div>
                      )}
                      <span className={`stock-badge ${inStock ? 'stock--available' : 'stock--depleted'}`}>
                        {inStock ? `${item.availableQuantity} of ${item.totalQuantity} Available` : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="equipment-body">
                      <span className="eq-category-tag">{item.category.replace('_', ' ')}</span>
                      <h4 className="eq-name">{item.name}</h4>
                      <p className="eq-specs">{item.specifications}</p>
                      <div className="eq-location">
                        <Box size={13} /> <span>{item.labLocation}</span>
                      </div>

                      <div className="eq-card-footer">
                        <button
                          type="button"
                          className="checkout-btn"
                          disabled={!inStock}
                          onClick={() => openBookingModal(item)}
                        >
                          <Wrench size={14} /> {inStock ? 'Request Checkout' : 'Currently Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My Bookings Tab */
        <div className="bookings-panel">
          <Panel title="My Hardware Checkout Loans & History" tag={`${myBookings.length} records`}>
            {myBookings.length === 0 ? (
              <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
                You have not requested any equipment checkouts yet.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Quantity</th>
                      <th>Lab Location</th>
                      <th>Borrow Period</th>
                      <th>Purpose / Course</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookings.map((b) => {
                      const status = b.status;
                      const isOverdue = status === 'CHECKED_OUT' && new Date(b.expectedReturnDate) < new Date();

                      return (
                        <tr key={b.id}>
                          <td><strong>{b.equipment?.name || 'Lab Item'}</strong></td>
                          <td><span className="badge badge--neutral">{b.quantity} unit(s)</span></td>
                          <td style={{ fontSize: '0.82rem' }}>{b.equipment?.labLocation || 'Lab 524'}</td>
                          <td>
                            <div style={{ fontSize: '0.82rem' }}>
                              <span>From: {b.borrowDate}</span><br />
                              <span>To: {b.expectedReturnDate}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <strong>{b.courseCode}</strong>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--tx-muted)' }}>{b.purpose}</p>
                          </td>
                          <td>
                            <span className={`badge badge--${status === 'CHECKED_OUT' ? (isOverdue ? 'rose' : 'sky') : status === 'APPROVED' ? 'emerald' : status === 'RETURNED' ? 'neutral' : status === 'REJECTED' ? 'rose' : 'amber'}`}>
                              {status === 'CHECKED_OUT' && isOverdue ? 'OVERDUE' : status}
                            </span>
                          </td>
                          <td>
                            {b.adminRemarks ? (
                              <span style={{ fontSize: '0.82rem' }}>{b.adminRemarks}</span>
                            ) : (
                              <span className="muted">Standard checkout</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Checkout Request Modal */}
      {bookingModalOpen && selectedItem && (
        <div className="modal-overlay" onClick={() => setBookingModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Lab Equipment Checkout</h3>
              <button type="button" className="close-btn" onClick={() => setBookingModalOpen(false)}>×</button>
            </div>

            <div className="eq-modal-summary">
              <strong>{selectedItem.name}</strong>
              <span>{selectedItem.labLocation} • Available: {selectedItem.availableQuantity} units</span>
            </div>

            <form onSubmit={handleBookingSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity to Borrow *</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItem.availableQuantity}
                    required
                    value={bookingForm.quantity}
                    onChange={(e) => setBookingForm({ ...bookingForm, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label>Course / Lab Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE 2211 AOOP / CSE 4165 IoT"
                    value={bookingForm.courseCode}
                    onChange={(e) => setBookingForm({ ...bookingForm, courseCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Borrow Start Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.borrowDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, borrowDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Expected Return Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.expectedReturnDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, expectedReturnDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Project Purpose / Hardware Requirement Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the semester project, lab assignment, sensor interfacing, or experimentation purpose..."
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                />
              </div>

              {message && (
                <div className={`notice notice--${message.type}`} style={{ marginBottom: '1rem' }}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setBookingModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <Send size={16} /> {submitting ? 'Reserving...' : 'Submit Checkout Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
