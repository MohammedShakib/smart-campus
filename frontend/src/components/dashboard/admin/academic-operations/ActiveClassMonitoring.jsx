import React, { useState, useEffect } from 'react';
import {
  RadioTower,
  RefreshCw,
  Search,
  BookOpen,
  DoorOpen,
  User,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function ActiveClassMonitoring() {
  const [activeClasses, setActiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchActiveClasses = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/academic-operations/active-classes');
      setActiveClasses(dataOf(res));
      setError('');
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch active classes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveClasses();
    const interval = setInterval(() => {
      fetchActiveClasses();
    }, 15000); // 15s auto-polling
    return () => clearInterval(interval);
  }, []);

  const filteredClasses = activeClasses.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.courseCode && c.courseCode.toLowerCase().includes(q)) ||
      (c.courseTitle && c.courseTitle.toLowerCase().includes(q)) ||
      (c.teacherEmail && c.teacherEmail.toLowerCase().includes(q)) ||
      (c.roomNumber && c.roomNumber.toLowerCase().includes(q)) ||
      (c.sectionName && c.sectionName.toLowerCase().includes(q))
    );
  });

  const uniqueRoomsCount = new Set(activeClasses.map(c => c.roomNumber)).size;
  const uniqueTeachersCount = new Set(activeClasses.map(c => c.teacherEmail)).size;

  return (
    <div className="academic-subpage active-classes-view">
      {/* Live Stream Status Banner */}
      <div className="live-status-banner">
        <div className="live-status-left">
          <span className="live-pulse-dot" />
          <div>
            <strong>Live Class Signal Active</strong>
            <span className="live-subtext">
              Realtime telemetry polling • Last checked {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => fetchActiveClasses(true)}
          disabled={refreshing}
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Now'}</span>
        </button>
      </div>

      {/* Metric Grid */}
      <div className="metric-grid">
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>In Progress</span>
            <span className="metric-icon"><RadioTower size={20} /></span>
          </div>
          <strong>{activeClasses.length}</strong>
          <div className="metric-card-foot">
            <span className="live-dot" aria-hidden="true" />
            <span>Active lecture streams</span>
          </div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Occupied Venues</span>
            <span className="metric-icon"><DoorOpen size={20} /></span>
          </div>
          <strong>{uniqueRoomsCount}</strong>
          <div className="metric-card-foot"><span>Classrooms in session</span></div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Faculty Present</span>
            <span className="metric-icon"><User size={20} /></span>
          </div>
          <strong>{uniqueTeachersCount}</strong>
          <div className="metric-card-foot"><span>Conducting lectures</span></div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel title="Live Classroom Telemetry" tag={`${activeClasses.length} LIVE SESSIONS`}>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Filter active classes by course, room, or instructor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Connecting to live class signals...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              title="No classes currently in progress"
              message={activeClasses.length > 0 ? "No active sessions matched your filter." : "There are currently no active class sessions running in campus classrooms."}
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course & Title</th>
                    <th>Section</th>
                    <th>Instructor</th>
                    <th>Classroom</th>
                    <th>Scheduled Slot</th>
                    <th>Started At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map(session => (
                    <tr key={session.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <strong className="code-pill">{session.courseCode}</strong>
                          <span style={{ fontSize: '0.76rem', color: 'var(--tx-muted)' }}>
                            {session.courseTitle || 'Course Session'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="section-chip">{session.sectionName}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div className="mini-avatar">
                            {session.teacherEmail ? session.teacherEmail[0].toUpperCase() : 'T'}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{session.teacherEmail}</span>
                        </div>
                      </td>
                      <td>
                        <span className="room-pill room-pill--active">
                          <DoorOpen size={13} />
                          {session.roomNumber}
                        </span>
                      </td>
                      <td>
                        <span className="time-pill">
                          <Clock size={13} />
                          {session.scheduledStartTime ? session.scheduledStartTime.slice(0, 5) : ''} - {session.scheduledEndTime ? session.scheduledEndTime.slice(0, 5) : ''}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--tx-secondary)' }}>
                          {session.startedAt ? new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="admin-status-badge status-live">
                          <span className="live-pulse-dot" style={{ width: 6, height: 6 }} />
                          {session.status || 'IN_PROGRESS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
