import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Percent,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

export default function AdminAttendanceMonitoring() {
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchAttendanceSessions = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/api/admin/academic-operations/attendance');
      setAttendanceSessions(dataOf(res));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSessions();
  }, []);

  const totalSessions = attendanceSessions.length;
  const totalPresent = attendanceSessions.reduce((acc, curr) => acc + (curr.presentCount || 0), 0);
  const totalLate = attendanceSessions.reduce((acc, curr) => acc + (curr.lateCount || 0), 0);
  const totalAbsent = attendanceSessions.reduce((acc, curr) => acc + (curr.absentCount || 0), 0);

  let avgRate = 0;
  if (totalSessions > 0) {
    const sumRates = attendanceSessions.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0);
    avgRate = (sumRates / totalSessions).toFixed(1);
  }

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendanceSessions;
    return attendanceSessions.filter(s =>
      (s.courseCode && s.courseCode.toLowerCase().includes(q)) ||
      (s.sectionName && s.sectionName.toLowerCase().includes(q)) ||
      (s.sessionDate && s.sessionDate.toLowerCase().includes(q))
    );
  }, [attendanceSessions, search]);

  return (
    <div className="academic-subpage attendance-monitoring-view">
      {/* Metric Grid */}
      <div className="metric-grid">
        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Sessions Recorded</span>
            <span className="metric-icon"><ClipboardCheck size={20} /></span>
          </div>
          <strong>{totalSessions}</strong>
          <div className="metric-card-foot"><span>Completed class rosters</span></div>
        </div>

        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Avg Attendance Rate</span>
            <span className="metric-icon"><TrendingUp size={20} /></span>
          </div>
          <strong style={{ color: Number(avgRate) >= 75 ? '#047857' : '#d97706' }}>
            {avgRate}%
          </strong>
          <div className="metric-card-foot"><span>Across all departments</span></div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Present Attendances</span>
            <span className="metric-icon"><UserCheck size={20} /></span>
          </div>
          <strong>{totalPresent}</strong>
          <div className="metric-card-foot"><span>Verified student presences</span></div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Late / Absent Total</span>
            <span className="metric-icon"><Clock size={20} /></span>
          </div>
          <strong>{totalLate + totalAbsent}</strong>
          <div className="metric-card-foot">
            <span>{totalLate} late, {totalAbsent} absent</span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel title="Attendance Registry & Performance" tag={`${filteredSessions.length} RECORDS`}>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left" style={{ flex: 1 }}>
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by course code, section, or session date..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-toolbar-right">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => fetchAttendanceSessions(true)}
                disabled={refreshing}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading attendance telemetry...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              title="No attendance records found"
              message={attendanceSessions.length > 0 ? "No records matched your search." : "No class attendance data has been logged yet."}
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Course Code</th>
                    <th>Section</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => {
                    const rate = session.attendancePercentage !== null ? Number(session.attendancePercentage) : null;
                    const rateTone = rate === null ? 'neutral' : rate >= 75 ? 'success' : rate >= 50 ? 'warning' : 'danger';
                    return (
                      <tr key={session.sessionId || `${session.courseCode}-${session.sectionName}-${session.sessionDate}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={14} style={{ color: 'var(--tx-muted)' }} />
                            <span style={{ fontWeight: 600 }}>{session.sessionDate}</span>
                          </div>
                        </td>
                        <td>
                          <span className="code-pill">{session.courseCode}</span>
                        </td>
                        <td>
                          <span className="section-chip">{session.sectionName}</span>
                        </td>
                        <td>
                          <span className="count-badge count-badge--present">
                            <CheckCircle2 size={12} />
                            {session.presentCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className="count-badge count-badge--late">
                            <Clock size={12} />
                            {session.lateCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className="count-badge count-badge--absent">
                            <XCircle size={12} />
                            {session.absentCount || 0}
                          </span>
                        </td>
                        <td>
                          {rate !== null ? (
                            <div className="rate-meter-container">
                              <div className="rate-meter-bar">
                                <div
                                  className={`rate-meter-fill rate-meter-fill--${rateTone}`}
                                  style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                                />
                              </div>
                              <span className={`rate-meter-text rate-meter-text--${rateTone}`}>
                                {rate}%
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--tx-muted)', fontSize: '0.8rem' }}>N/A</span>
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
    </div>
  );
}
