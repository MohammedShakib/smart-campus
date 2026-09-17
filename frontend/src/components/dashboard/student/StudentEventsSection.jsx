import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  UsersRound,
  Search,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  RotateCw,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Share2,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';
import { SectionHeader, EmptyState } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';

const TABS = [
  { id: 'ALL', label: 'All Events' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'TODAY', label: "Today's Events" },
  { id: 'SAVED', label: 'Saved / Interested' },
  { id: 'PAST', label: 'Past & Completed' }
];

export function StudentEventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [savedEvents, setSavedEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('smartcampus_saved_events') || '[]');
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState(null);

  const fetchEvents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/student/events');
      const items = Array.isArray(res) ? res : (res?.data || []);
      setEvents(items);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSaveEvent = (e, evId) => {
    e.stopPropagation();
    setSavedEvents(prev => {
      let updated;
      if (prev.includes(evId)) {
        updated = prev.filter(id => id !== evId);
        showToast('Event removed from your saved list.');
      } else {
        updated = [...prev, evId];
        showToast('Event saved to your personal schedule!');
      }
      localStorage.setItem('smartcampus_saved_events', JSON.stringify(updated));
      return updated;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const todayCount = events.filter(e => e.eventDate === todayStr).length;
  const upcomingCount = events.filter(e => e.eventDate >= todayStr && e.status !== 'COMPLETED').length;
  const pastCount = events.filter(e => e.eventDate < todayStr || e.status === 'COMPLETED').length;

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(ev => {
      const title = (ev.title || '').toLowerCase();
      const org = (ev.organizer || '').toLowerCase();
      const loc = (ev.location || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();

      const matchesSearch = !q || title.includes(q) || org.includes(q) || loc.includes(q) || desc.includes(q);

      let matchesTab = true;
      if (activeTab === 'TODAY') {
        matchesTab = ev.eventDate === todayStr;
      } else if (activeTab === 'UPCOMING') {
        matchesTab = ev.eventDate >= todayStr && ev.status !== 'COMPLETED';
      } else if (activeTab === 'SAVED') {
        matchesTab = savedEvents.includes(ev.id);
      } else if (activeTab === 'PAST') {
        matchesTab = ev.eventDate < todayStr || ev.status === 'COMPLETED';
      }

      return matchesSearch && matchesTab;
    });
  }, [events, search, activeTab, savedEvents, todayStr]);

  const formatDateDetails = (dateStr) => {
    if (!dateStr) return { day: '00', month: '---', weekday: '---', isToday: false };
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const weekday = d.toLocaleString('en-US', { weekday: 'short' });
    const isToday = dateStr === todayStr;
    return { day, month, weekday, isToday };
  };

  if (loading) {
    return (
      <div className="campus-subpage" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
        <p className="muted">Fetching university campus events...</p>
      </div>
    );
  }

  return (
    <div className="campus-subpage student-events-container">
      {/* Toast */}
      {toast && (
        <div
          className="admin-status-badge status-active"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '0.85rem 1.35rem',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.88rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={16} color="var(--emerald)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <SectionHeader
            title="University Campus Events"
            subtitle="Discover student club workshops, guest tech talks, hackathons, and cultural festivities."
          />
        </div>
        <button
          type="button"
          className="icon-btn"
          title="Refresh Events"
          onClick={() => fetchEvents(true)}
          disabled={refreshing}
          style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem' }}
        >
          <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Refresh</span>
        </button>
      </div>

      {/* Metric Grid */}
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>All Events</span>
            <span className="metric-icon"><CalendarDays size={20} /></span>
          </div>
          <strong>{events.length}</strong>
          <div className="metric-card-foot">
            <span>Campus wide calendar</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Upcoming Programs</span>
            <span className="metric-icon"><Sparkles size={20} /></span>
          </div>
          <strong style={{ color: '#047857' }}>{upcomingCount}</strong>
          <div className="metric-card-foot">
            <span>Open for participation</span>
          </div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Today's Highlights</span>
            <span className="metric-icon"><Clock size={20} /></span>
          </div>
          <strong style={{ color: 'var(--brand-orange, #f97316)' }}>{todayCount}</strong>
          <div className="metric-card-foot">
            <span>Happening today</span>
          </div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Saved in Schedule</span>
            <span className="metric-icon"><BookmarkCheck size={20} /></span>
          </div>
          <strong>{savedEvents.length}</strong>
          <div className="metric-card-foot">
            <span>Personal bookmarks</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="academic-tabs" style={{ marginBottom: '1.25rem', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`academic-tab${activeTab === tab.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.id === 'SAVED' && savedEvents.length > 0 && (
              <span className="section-chip" style={{ marginLeft: '0.35rem', padding: '0.1rem 0.45rem', fontSize: '0.72rem' }}>
                {savedEvents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Layout Controls */}
      <div className="admin-toolbar" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-toolbar-left" style={{ flex: 1 }}>
          <div className="admin-search" style={{ flex: 1, maxWidth: '420px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by event title, organizer, location, speaker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-toolbar-right" style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            className={`icon-btn${viewMode === 'grid' ? ' is-active' : ''}`}
            title="Card Grid View"
            onClick={() => setViewMode('grid')}
            style={{ padding: '0.5rem', background: viewMode === 'grid' ? 'var(--bg-card-hover, #f1f5f9)' : 'transparent' }}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`icon-btn${viewMode === 'table' ? ' is-active' : ''}`}
            title="Table View"
            onClick={() => setViewMode('table')}
            style={{ padding: '0.5rem', background: viewMode === 'table' ? 'var(--bg-card-hover, #f1f5f9)' : 'transparent' }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {error && <div className="notice error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No campus events found"
          message={activeTab === 'SAVED' ? "You haven't saved any events yet. Click the bookmark icon on any event to track it." : "Adjust your filters or check back later for upcoming announcements."}
        />
      ) : viewMode === 'grid' ? (
        /* Event Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.35rem'
        }}>
          {filteredEvents.map(ev => {
            const isSaved = savedEvents.includes(ev.id);
            const dateInfo = formatDateDetails(ev.eventDate);
            const isPast = ev.eventDate < todayStr || ev.status === 'COMPLETED';

            return (
              <div
                key={ev.id}
                className="panel"
                onClick={() => setSelectedEvent(ev)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                  border: dateInfo.isToday ? '2px solid var(--brand-orange, #ea580c)' : '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  padding: '1.35rem',
                  background: 'var(--bg-surface, #ffffff)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.04)'; }}
              >
                <div>
                  {/* Top Row: Date Pill & Bookmark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Date Badge Box */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '52px',
                          height: '56px',
                          borderRadius: '12px',
                          background: dateInfo.isToday ? 'linear-gradient(135deg, #ea580c, #f97316)' : 'var(--bg-main, #f1f5f9)',
                          color: dateInfo.isToday ? '#ffffff' : 'var(--tx-primary, #0f172a)',
                          boxShadow: dateInfo.isToday ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none',
                          flexShrink: 0
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>{dateInfo.month}</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{dateInfo.day}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.85 }}>{dateInfo.weekday}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="section-chip" style={{ fontSize: '0.72rem', alignSelf: 'flex-start' }}>
                          {ev.organizer || 'UIU Authority'}
                        </span>
                        {dateInfo.isToday && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--brand-orange, #ea580c)', fontWeight: 700, marginTop: '2px' }}>
                            ● TODAY
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bookmark icon */}
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => toggleSaveEvent(e, ev.id)}
                      title={isSaved ? "Remove from saved" : "Save event to schedule"}
                      style={{ color: isSaved ? 'var(--brand-orange, #ea580c)' : 'var(--tx-muted, #94a3b8)' }}
                    >
                      {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                  </div>

                  {/* Event Title */}
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    color: 'var(--tx-primary, #0f172a)',
                    lineHeight: '1.35'
                  }}>
                    {ev.title}
                  </h3>

                  {/* Description preview */}
                  <p style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.82rem',
                    color: 'var(--tx-secondary, #64748b)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.45rem'
                  }}>
                    {ev.description || 'Join your fellow campus peers and faculty for this event.'}
                  </p>
                </div>

                {/* Event meta footer */}
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color, #f1f5f9)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--tx-secondary, #64748b)' }}>
                      <Clock size={13} color="var(--brand-orange, #ea580c)" />
                      <span>{ev.startTime ? ev.startTime.slice(0, 5) : '10:00'} - {ev.endTime ? ev.endTime.slice(0, 5) : '12:00'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--tx-secondary, #64748b)' }}>
                      <MapPin size={13} color="#047857" />
                      <span>{ev.location || 'Campus Auditorium'}</span>
                    </div>

                    {ev.capacity && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--tx-secondary, #64748b)' }}>
                        <UsersRound size={13} color="#6366f1" />
                        <span>Up to {ev.capacity} Attendees</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`admin-status-badge ${isPast ? 'status-disabled' : 'status-active'}`} style={{ fontSize: '0.72rem' }}>
                      {isPast ? 'COMPLETED' : (ev.status || 'PUBLISHED')}
                    </span>

                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-orange, #ea580c)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      Details <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Title & Organizer</th>
                  <th>Date & Day</th>
                  <th>Time Slot</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(ev => {
                  const isSaved = savedEvents.includes(ev.id);
                  const dateInfo = formatDateDetails(ev.eventDate);
                  const isPast = ev.eventDate < todayStr || ev.status === 'COMPLETED';

                  return (
                    <tr key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '0.9rem' }}>{ev.title}</strong>
                          <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>{ev.organizer || 'UIU Authority'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{ev.eventDate}</span>{' '}
                        <span style={{ fontSize: '0.74rem', color: 'var(--tx-muted)' }}>({dateInfo.weekday})</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem' }}>
                          {ev.startTime ? ev.startTime.slice(0, 5) : ''} - {ev.endTime ? ev.endTime.slice(0, 5) : ''}
                        </span>
                      </td>
                      <td>
                        <span className="room-pill">
                          <MapPin size={12} /> {ev.location || 'Auditorium'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${isPast ? 'status-disabled' : 'status-active'}`}>
                          {isPast ? 'COMPLETED' : (ev.status || 'PUBLISHED')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => toggleSaveEvent(e, ev.id)}
                          title={isSaved ? "Remove from saved" : "Save event"}
                          style={{ color: isSaved ? 'var(--brand-orange, #ea580c)' : 'var(--tx-muted)' }}
                        >
                          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setSelectedEvent(null)}>
          <div className="profile-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <header className="profile-modal-head">
              <div>
                <span>Campus Event Details</span>
                <h2>{selectedEvent.title}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedEvent(null)}><X size={16} /></button>
            </header>

            <div className="standard-form-content" style={{ padding: '1.25rem' }}>
              {/* Highlights bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--tx-muted)', fontWeight: 600 }}>EVENT DATE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx-primary)' }}>{selectedEvent.eventDate}</div>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--tx-muted)', fontWeight: 600 }}>TIME SLOT</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx-primary)' }}>
                    {selectedEvent.startTime ? selectedEvent.startTime.slice(0, 5) : ''} - {selectedEvent.endTime ? selectedEvent.endTime.slice(0, 5) : ''}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--tx-muted)', fontWeight: 600 }}>VENUE</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx-primary)' }}>{selectedEvent.location || 'Auditorium'}</div>
                </div>
              </div>

              {/* Organizer & Capacity */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--tx-secondary)' }}>Host:</span>
                  <span className="section-chip" style={{ fontWeight: 700 }}>{selectedEvent.organizer || 'UIU Authority'}</span>
                </div>
                {selectedEvent.capacity && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--tx-secondary)' }}>
                    Max Capacity: <strong>{selectedEvent.capacity} Guests</strong>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 700, color: 'var(--tx-primary)' }}>About This Event</h4>
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'var(--bg-main, #f8fafc)',
                  fontSize: '0.86rem',
                  lineHeight: '1.6',
                  color: 'var(--tx-secondary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedEvent.description || 'No detailed agenda provided. Please attend the event venue on time.'}
                </div>
              </div>

              {/* Actions */}
              <div className="profile-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={(e) => toggleSaveEvent(e, selectedEvent.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {savedEvents.includes(selectedEvent.id) ? (
                    <>
                      <BookmarkCheck size={16} color="var(--brand-orange, #ea580c)" /> Saved in Schedule
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} /> Save to My Schedule
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
