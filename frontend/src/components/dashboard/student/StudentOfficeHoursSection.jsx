import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  UserCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  MessageSquare,
  Lock,
  XCircle,
  Sparkles,
  BookOpen,
  Info
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

const QUERY_CATEGORIES = [
  'Theory & Concept Clarification',
  'Project & Assignment Consultation',
  'Exam & Grade Review',
  'Thesis / Research Advising',
  'Career & Recommendation Letter',
  'General Academic Advising'
];

export function StudentOfficeHoursSection() {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my-appointments'

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    slotId: null,
    queryCategory: 'Project & Assignment Consultation',
    queryTopic: '',
    queryDetails: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const loadSlots = () => {
    setLoading(true);
    Promise.all([
      api('/api/student/office-hours/slots'),
      api('/api/student/office-hours/my-appointments')
    ])
      .then(([slotsRes, appsRes]) => {
        setAvailableSlots(slotsRes.data || []);
        setMyAppointments(appsRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const openBookingModal = (slot) => {
    setSelectedSlot(slot);
    setBookingForm({
      slotId: slot.id,
      queryCategory: 'Project & Assignment Consultation',
      queryTopic: '',
      queryDetails: ''
    });
    setBookingModalOpen(true);
    setMessage(null);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!bookingForm.queryTopic.trim()) {
      setMessage({ type: 'error', text: 'Query topic is mandatory for booking faculty office hours.' });
      return;
    }
    if (!bookingForm.queryDetails.trim()) {
      setMessage({ type: 'error', text: 'Detailed query explanation is required so faculty can prepare in advance.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    api('/api/student/office-hours/book', {
      method: 'POST',
      body: JSON.stringify(bookingForm)
    })
      .then(() => {
        setSubmitting(false);
        setMessage({
          type: 'success',
          text: 'Faculty consultation booked successfully! Your query topic has been submitted for faculty review.'
        });
        setTimeout(() => {
          setBookingModalOpen(false);
          loadSlots();
          setActiveTab('my-appointments');
        }, 1400);
      })
      .catch((err) => {
        setSubmitting(false);
        // Concurrency conflict or validation error
        setMessage({
          type: 'error',
          text: err.message || 'Concurrency Conflict: This slot was just booked by another student. Please select an alternate slot.'
        });
      });
  };

  const cancelAppointment = (slotId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation booking?')) return;
    api(`/api/student/office-hours/appointments/${slotId}/cancel`, { method: 'POST' })
      .then(() => {
        alert('Appointment cancelled. The slot has been released.');
        loadSlots();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="student-page office-hours-wrapper">
      <SectionHeader
        title="Faculty Office Hours & Consultation Engine"
        subtitle="Reserve one-on-one consultation slots with faculty members. Powered by concurrency-safe locking and mandatory query pre-submission."
      />

      {/* AOOP Concurrency Notice Callout */}
      <div className="concurrency-banner">
        <Lock size={20} className="concurrency-banner-icon" />
        <div>
          <strong>Concurrency-Safe Slot Reservation</strong>
          <p>
            Consultation booking employs serialized thread locking (`ReentrantLock` + database transaction isolation) to prevent race conditions.
            Student query pre-submission is mandatory so instructors can review topics in advance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-pill-bar">
        <button
          type="button"
          className={`tab-pill ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <CalendarDays size={16} /> Available Faculty Slots ({availableSlots.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'my-appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-appointments')}
        >
          <CheckCircle2 size={16} /> My Booked Consultations ({myAppointments.length})
        </button>
      </div>

      {activeTab === 'available' ? (
        <div>
          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading available office hour slots...</p>
          ) : availableSlots.length === 0 ? (
            <div className="empty-state-box">
              <CalendarDays size={32} style={{ color: 'var(--tx-muted)', marginBottom: '0.75rem' }} />
              <h3>No Open Slots Currently Available</h3>
              <p className="muted">All consultation slots for the current cycle are booked or pending publication.</p>
            </div>
          ) : (
            <div className="slots-grid">
              {availableSlots.map((slot) => {
                return (
                  <div key={slot.id} className="slot-card">
                    <div className="slot-card-header">
                      <div>
                        <span className="slot-dept-tag">{slot.department || 'CSE Department'}</span>
                        <h4 className="slot-teacher-name">{slot.teacherName}</h4>
                      </div>
                      <span className="badge badge--emerald">OPEN</span>
                    </div>

                    <div className="slot-meta-list">
                      <div className="slot-meta-item">
                        <CalendarDays size={15} />
                        <strong>{slot.dayOfWeek}, {slot.slotDate}</strong>
                      </div>
                      <div className="slot-meta-item">
                        <Clock size={15} />
                        <span>{slot.startTime} – {slot.endTime} (30 mins)</span>
                      </div>
                      <div className="slot-meta-item">
                        <MapPin size={15} />
                        <span>{slot.roomNumber || 'Room 524'}</span>
                      </div>
                    </div>

                    <div className="slot-card-footer">
                      <button
                        type="button"
                        className="slot-book-btn"
                        onClick={() => openBookingModal(slot)}
                      >
                        <MessageSquare size={14} /> Book Consultation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My Appointments Tab */
        <div className="appointments-panel">
          <Panel title="My Consultation Schedule & Pre-Submitted Queries" tag={`${myAppointments.length} bookings`}>
            {myAppointments.length === 0 ? (
              <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
                You have no active faculty consultation appointments booked.
              </p>
            ) : (
              <div className="appointments-list">
                {myAppointments.map((app) => (
                  <div key={app.id} className="appointment-card">
                    <div className="app-card-top">
                      <div>
                        <span className="badge badge--sky">{app.dayOfWeek}, {app.slotDate} • {app.startTime} - {app.endTime}</span>
                        <h4 style={{ margin: '0.4rem 0 0.2rem', color: 'var(--tx-primary)' }}>{app.teacherName}</h4>
                        <span className="muted" style={{ fontSize: '0.8rem' }}>Location: {app.roomNumber || 'Room 524'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge badge--${app.status === 'BOOKED' ? 'emerald' : app.status === 'COMPLETED' ? 'neutral' : 'rose'}`}>
                          {app.status}
                        </span>
                        {app.status === 'BOOKED' && (
                          <button
                            type="button"
                            className="inline-cancel-btn"
                            onClick={() => cancelAppointment(app.id)}
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Student's Pre-Submitted Query */}
                    <div className="app-query-box">
                      <div className="query-category-pill">
                        <BookOpen size={13} /> {app.queryCategory}
                      </div>
                      <strong className="query-topic-title">Topic: {app.queryTopic}</strong>
                      <p className="query-details-text">{app.queryDetails}</p>
                    </div>

                    {/* Faculty preparation feedback if any */}
                    {app.facultyFeedback && (
                      <div className="faculty-feedback-box">
                        <strong>Faculty Note:</strong>
                        <p>{app.facultyFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Concurrency-Safe Booking Modal with Mandatory Pre-Submission */}
      {bookingModalOpen && selectedSlot && (
        <div className="modal-overlay" onClick={() => setBookingModalOpen(false)}>
          <div className="modal-card modal-card--lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MessageSquare size={22} style={{ color: 'var(--accent)' }} />
                <h3>Book Faculty Consultation</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setBookingModalOpen(false)}>×</button>
            </div>

            <div className="slot-modal-info">
              <strong>{selectedSlot.teacherName} ({selectedSlot.department})</strong>
              <span>{selectedSlot.dayOfWeek}, {selectedSlot.slotDate} • {selectedSlot.startTime} - {selectedSlot.endTime} • {selectedSlot.roomNumber}</span>
            </div>

            <div className="query-pre-submission-callout">
              <Info size={17} />
              <div>
                <strong>Mandatory Query Pre-Submission Requirement</strong>
                <p>
                  To ensure an efficient consultation, you must formulate your question or topic in advance. The instructor will review this prior to your meeting.
                </p>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="modal-form">
              <div className="form-group">
                <label>Query / Discussion Category *</label>
                <select
                  value={bookingForm.queryCategory}
                  onChange={(e) => setBookingForm({ ...bookingForm, queryCategory: e.target.value })}
                >
                  {QUERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Specific Discussion Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concurrency deadlocks in Project 1 / Understanding polymorphic dispatch in Java"
                  value={bookingForm.queryTopic}
                  onChange={(e) => setBookingForm({ ...bookingForm, queryTopic: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Detailed Question / Problem Context & What You've Tried *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide precise details: code snippet context, textbook theorem doubts, or assignment roadblock so the instructor can prepare solutions..."
                  value={bookingForm.queryDetails}
                  onChange={(e) => setBookingForm({ ...bookingForm, queryDetails: e.target.value })}
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
                  <Lock size={15} /> {submitting ? 'Acquiring Lock & Reserving...' : 'Confirm & Reserve Consultation Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
