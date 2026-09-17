import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  UsersRound,
  Save,
  X,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle,
  Check,
  Ban,
  Edit2
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [eventForm, setEventForm] = useState({
    id: null,
    title: '',
    description: '',
    organizer: '',
    location: '',
    capacity: 100,
    eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    status: 'PUBLISHED'
  });

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/campus-operations/events');
      setEvents(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);
    try {
      const payload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        organizer: eventForm.organizer.trim(),
        location: eventForm.location.trim(),
        capacity: Number(eventForm.capacity || 0),
        eventDate: eventForm.eventDate,
        startTime: eventForm.startTime.length === 5 ? `${eventForm.startTime}:00` : eventForm.startTime,
        endTime: eventForm.endTime.length === 5 ? `${eventForm.endTime}:00` : eventForm.endTime,
        status: eventForm.status || 'PUBLISHED'
      };

      if (eventForm.id) {
        await api(`/api/admin/campus-operations/events/${eventForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: `Event "${payload.title}" updated successfully.` });
      } else {
        await api('/api/admin/campus-operations/events', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: 'Campus event published successfully.' });
      }
      setIsCreateModalOpen(false);
      setEventForm({
        id: null,
        title: '', description: '', organizer: '', location: '', capacity: 100,
        eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '14:00', endTime: '16:00', status: 'PUBLISHED'
      });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save event.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api(`/api/admin/campus-operations/events/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setToastMessage({ type: 'success', text: `Event status changed to ${newStatus}.` });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to update event status.' });
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) {
      return;
    }
    try {
      await api(`/api/admin/campus-operations/events/${id}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: 'Event deleted successfully.' });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete event.' });
    }
  };

  const publishedCount = events.filter(e => e.status === 'PUBLISHED').length;
  const draftCount = events.filter(e => e.status === 'DRAFT').length;
  const completedCount = events.filter(e => e.status === 'COMPLETED').length;

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(e => {
      const matchSearch = !q ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.organizer && e.organizer.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [events, search, statusFilter]);

  return (
    <div className="campus-subpage event-management-view">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`status-badge ${toastMessage.type === 'error' ? 'badge--critical' : 'badge--occupied'}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            fontWeight: '600'
          }}
        >
          {toastMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Total Events</span>
            <span className="metric-icon"><CalendarDays size={20} /></span>
          </div>
          <strong>{events.length}</strong>
          <div className="metric-card-foot">
            <span>Campus Activities</span>
          </div>
        </div>

        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Published / Live</span>
            <span className="metric-icon"><Sparkles size={20} /></span>
          </div>
          <strong>{publishedCount}</strong>
          <div className="metric-card-foot">
            <span>Open for registration</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Drafts / Concluded</span>
            <span className="metric-icon"><CheckCircle2 size={20} /></span>
          </div>
          <strong>{draftCount + completedCount}</strong>
          <div className="metric-card-foot">
            <span>{draftCount} Drafts • {completedCount} Done</span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel
          title="Campus Events & Programs"
          tag={`${filteredEvents.length} EVENTS`}
          action={
            <button
              type="button"
              className="ghost-btn"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          }
        >
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by event title, organizer, or venue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-toolbar-right">
              <ActionButton
                label="Create Event"
                icon={Plus}
                onClick={() => {
                  setEventForm({
                    id: null,
                    title: '',
                    description: '',
                    organizer: '',
                    location: '',
                    capacity: 100,
                    eventDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    startTime: '14:00',
                    endTime: '16:00',
                    status: 'PUBLISHED'
                  });
                  setIsCreateModalOpen(true);
                }}
              />
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading campus events...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState title="No events found" message="Publish an event or adjust your search filters." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event Title & Organizer</th>
                    <th>Date & Time</th>
                    <th>Venue Location</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(ev => {
                    const statusClass = (ev.status || 'PUBLISHED').toLowerCase();
                    return (
                      <tr key={ev.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <strong style={{ fontSize: '0.88rem' }}>{ev.title}</strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>{ev.organizer || 'UIU Authority'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{ev.eventDate}</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>
                              <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                              {ev.startTime ? ev.startTime.slice(0, 5) : ''} - {ev.endTime ? ev.endTime.slice(0, 5) : ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="room-pill">
                            <MapPin size={13} />
                            {ev.location || 'Campus Auditorium'}
                          </span>
                        </td>
                        <td>
                          <span className="section-chip">
                            <UsersRound size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {ev.capacity || 100} Guests
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-badge status-${statusClass}`}>
                            {ev.status || 'PUBLISHED'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit Event"
                              onClick={() => {
                                setEventForm({
                                  id: ev.id,
                                  title: ev.title || '',
                                  description: ev.description || '',
                                  organizer: ev.organizer || '',
                                  location: ev.location || '',
                                  capacity: ev.capacity || 100,
                                  eventDate: ev.eventDate || '',
                                  startTime: ev.startTime ? ev.startTime.slice(0, 5) : '14:00',
                                  endTime: ev.endTime ? ev.endTime.slice(0, 5) : '16:00',
                                  status: ev.status || 'PUBLISHED'
                                });
                                setIsCreateModalOpen(true);
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            {ev.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                className="icon-btn"
                                title="Cancel Event"
                                onClick={() => handleStatusChange(ev.id, 'CANCELLED')}
                              >
                                <Ban size={14} color="var(--rose)" />
                              </button>
                            )}
                            {ev.status === 'CANCELLED' && (
                              <button
                                type="button"
                                className="icon-btn"
                                title="Reactivate / Publish Event"
                                onClick={() => handleStatusChange(ev.id, 'PUBLISHED')}
                              >
                                <Check size={14} color="var(--emerald)" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="icon-btn"
                              title="Delete Event"
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            >
                              <Trash2 size={14} color="var(--rose)" />
                            </button>
                          </div>
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

      {/* Modal: Create/Edit Event */}
      {isCreateModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setIsCreateModalOpen(false)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="profile-modal-head">
              <div>
                <span>Campus Calendar</span>
                <h2>{eventForm.id ? 'Edit Campus Event' : 'Create Campus Event'}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setIsCreateModalOpen(false)}><X size={16} /></button>
            </header>
            <form onSubmit={handleEventSubmit} className="standard-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Tech Fest 2026"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Organizer / Club *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UIU Computer Club"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Venue Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 301 (Auditorium)"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                  />
                </div>

                <div className="admin-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>Start Time *</label>
                    <input
                      type="time"
                      required
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>End Time *</label>
                    <input
                      type="time"
                      required
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Capacity (Max Attendees) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                  >
                    <option value="PUBLISHED">Published (Open)</option>
                    <option value="DRAFT">Draft</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Description & Agenda</label>
                  <textarea
                    rows={3}
                    placeholder="Describe event details, guest speakers, rules, and entry guidelines..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="ghost-btn" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <Save size={16} /> {submitting ? 'Saving...' : eventForm.id ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
