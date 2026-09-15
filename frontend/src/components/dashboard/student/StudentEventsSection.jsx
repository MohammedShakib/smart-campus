import React, { useState, useEffect } from 'react';
import { SectionHeader, Table } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';

export function StudentEventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  function fetchEvents() {
    api('/api/student/events')
      .then((res) => {
        setEvents(res.data || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <div className="loading-spinner">Loading events...</div>;

  return (
    <div>
      <SectionHeader title="Campus Events" subtitle="Discover and participate in upcoming campus activities." />
      <div className="section-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Upcoming Events</h3>
            <span className="panel-tag">{events.length} upcoming</span>
          </div>
          <div className="panel-body">
            {error && <div className="error-message">{error}</div>}
            <Table
              headers={['Date', 'Time', 'Event', 'Location', 'Organizer']}
              rows={events.map(e => [
                new Date(e.eventDate).toLocaleDateString(),
                e.startTime ? `${e.startTime} - ${e.endTime || '?'}` : '-',
                e.title,
                e.location,
                e.organizerName
              ])}
              empty="No upcoming events found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
