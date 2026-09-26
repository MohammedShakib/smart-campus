import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BookOpen, CalendarCheck, ClipboardCheck, History, RadioTower, Wrench } from 'lucide-react';
import { api } from '../../utils/api';
import { SectionHeader, NoticeList, Panel, Table, StatRow } from '../shared/SharedComponents';

function formatTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 5);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function classRows(schedule = []) {
  return schedule.map((item) => [
    item.courseCode,
    item.courseTitle,
    item.sectionName,
    item.roomNumber,
    item.dayOfWeek,
    `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
    item.status
  ]);
}

function classStatus(item) {
  return item?.status || item?.session?.status || item?.schedule?.status || 'SCHEDULED';
}

function Feedback({ result }) {
  if (!result) return null;
  return <div className={`notice ${result.type}`}>{result.text}</div>;
}

function pctDisplay(val) {
  if (val === null || val === undefined) return '-';
  return `${Number(val).toFixed(1)}%`;
}

// ─────────────────────────────────────────────────────────
// SCHEDULE SECTION
// ─────────────────────────────────────────────────────────
export function TeacherScheduleSection({ data }) {
  const schedule = data.schedule || [];
  const nextClass = data.nextClass || schedule.find((item) => item.status !== 'COMPLETED');

  return (
    <div>
      <SectionHeader title="My Schedule" subtitle="Your teaching schedule and current class status." />
      <div className="section-grid">
        <Panel title="Today and Upcoming" tag={`${schedule.length} classes`}>
          <Table
            headers={['Code', 'Course', 'Section', 'Room', 'Day', 'Time', 'Status']}
            rows={classRows(schedule)}
            empty="No classes scheduled."
          />
        </Panel>
        <Panel title="Next Class" tag={nextClass?.status || 'Schedule'}>
          {nextClass ? (
            <div className="teacher-focus">
              <span>{nextClass.courseCode}</span>
              <strong>{nextClass.courseTitle}</strong>
              <p>{nextClass.dayOfWeek} - {formatTime(nextClass.startTime)} to {formatTime(nextClass.endTime)} - {nextClass.roomNumber}</p>
            </div>
          ) : (
            <p className="muted">No upcoming class is available.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CLASSES SECTION
// ─────────────────────────────────────────────────────────
export function TeacherClassesSection({ data, reload }) {
  const [result, setResult] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const classes = data.classes || [];

  function updateClass(id, action) {
    setBusyId(`${action}-${id}`);
    setResult(null);
    api(`/api/teacher/classes/${id}/${action}`, { method: 'POST' })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        reload();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusyId(null));
  }

  return (
    <div>
      <SectionHeader title="My Classes" subtitle="Your assigned classes with matching smart classroom telemetry." />
      <Feedback result={result} />
      <div className="classroom-grid">
        {classes.map((item) => {
          const { schedule, room } = item;
          const status = classStatus(item);
          return (
          <div key={schedule.id} className={`room-card ${status === 'ACTIVE' ? 'room-card--active' : ''}`}>
            <div className="room-card-header">
              <BookOpen size={16} />
              <span className={`room-badge ${status === 'ACTIVE' ? 'badge--occupied' : 'badge--free'}`}>{status}</span>
            </div>
            <strong className="room-name">{schedule.courseCode} - {schedule.sectionName}</strong>
            <p className="teacher-card-copy">{schedule.courseTitle}</p>
            <div className="room-stats">
              <div className="room-stat"><span>Room</span><strong>{schedule.roomNumber}</strong></div>
              <div className="room-stat"><span>Capacity</span><strong>{room?.capacity ?? '-'}</strong></div>
              <div className="room-stat"><span>Power</span><strong>{room?.powerKW ?? '-'} kW</strong></div>
            </div>
            <div className="teacher-card-actions">
              <button className="ghost-btn" type="button" disabled={status === 'ACTIVE' || status === 'COMPLETED' || busyId === `start-${schedule.id}`} onClick={() => updateClass(schedule.id, 'start')}>
                Start Class
              </button>
              <button className="ghost-btn" type="button" disabled={status !== 'ACTIVE' || busyId === `end-${schedule.id}`} onClick={() => updateClass(schedule.id, 'end')}>
                End Class
              </button>
            </div>
          </div>
          );
        })}
      </div>
      {!classes.length && <p className="muted">No assigned classes found.</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ATTENDANCE HISTORY SUB-COMPONENT
// ─────────────────────────────────────────────────────────
function TeacherAttendanceHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api('/api/teacher/attendance/history')
      .then((res) => setHistory(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function viewDetail(sessionId) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(sessionId);
    setDetailLoading(true);
    api(`/api/teacher/attendance/history/${sessionId}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }

  // Summary metrics
  const completedCount = history.length;
  const avgRate = completedCount > 0
    ? (history.reduce((s, h) => s + (h.attendanceRate ?? 0), 0) / completedCount).toFixed(1)
    : null;

  if (loading) return <p className="muted">Loading history…</p>;
  if (error) return <div className="notice error">{error}</div>;
  if (!history.length) {
    return <p className="muted">No completed attendance sessions yet.</p>;
  }

  return (
    <div>
      {/* Summary stats */}
      <div className="stat-list attendance-stats">
        <StatRow label="Completed Sessions" value={completedCount} color="accent" />
        <StatRow label="Average Attendance" value={avgRate !== null ? `${avgRate}%` : '-'} color="emerald" />
      </div>

      {/* History table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Section</th>
              <th>Present</th>
              <th>Late</th>
              <th>Absent</th>
              <th>Rate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <React.Fragment key={h.sessionId}>
                <tr>
                  <td>{h.date ? new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                  <td>{h.courseCode}</td>
                  <td>{h.sectionName}</td>
                  <td><span className="cell-chip chip-status-success">{h.presentCount}</span></td>
                  <td><span className="cell-chip chip-priority-medium">{h.lateCount}</span></td>
                  <td><span className="cell-chip chip-status-critical">{h.absentCount}</span></td>
                  <td>{pctDisplay(h.attendanceRate)}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost-btn history-action-btn"
                      onClick={() => viewDetail(h.sessionId)}
                    >
                      {expandedId === h.sessionId ? 'Close' : 'View'}
                    </button>
                  </td>
                </tr>
                {expandedId === h.sessionId && (
                  <tr>
                    <td colSpan={8} className="history-detail-row">
                      {detailLoading ? (
                        <p className="muted">Loading session detail…</p>
                      ) : detail ? (
                        <div>
                          <div className="history-detail-meta">
                            {detail.courseCode} - {detail.sectionName} &nbsp;|&nbsp; {detail.date} &nbsp;|&nbsp; {detail.startedAt ? new Date(detail.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} – {detail.endedAt ? new Date(detail.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                          <table className="history-detail-table">
                            <thead>
                              <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Check-in Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detail.records || []).map((r, i) => (
                                <tr key={i}>
                                  <td>{r.studentId}</td>
                                  <td>{r.studentName || '-'}</td>
                                  <td>
                                    <span className={
                                      r.status === 'PRESENT' ? 'cell-chip chip-status-success'
                                      : r.status === 'LATE' ? 'cell-chip chip-priority-medium'
                                      : 'cell-chip chip-status-critical'
                                    }>
                                      {r.status}
                                    </span>
                                  </td>
                                  <td>{r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="muted">Could not load session detail.</p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ATTENDANCE SECTION (Current Session + History tabs)
// ─────────────────────────────────────────────────────────
export function TeacherAttendanceSection({ data, reload }) {
  const [mode, setMode] = useState('session'); // 'session' | 'history'
  const [selectedScheduleId, setSelectedScheduleId] = useState(data.schedule?.[0]?.id || '');
  const [sessions, setSessions] = useState(data.attendanceSessions || []);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [record, setRecord] = useState({ studentId: '', studentName: '', status: 'PRESENT' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSessions(data.attendanceSessions || []);
  }, [data.attendanceSessions]);

  const activeSession = sessions.find((item) => item.session?.active);
  const checkInUrl = activeSession?.session?.token
    ? `${window.location.origin}/attendance/checkin?token=${activeSession.session.token}`
    : '';

  // Load enrolled students when we have an active session
  useEffect(() => {
    if (!activeSession?.session?.id) {
      setEnrolledStudents([]);
      return;
    }
    api(`/api/teacher/roster/session/${activeSession.session.id}/students`)
      .then((res) => {
        const students = res.data || [];
        setEnrolledStudents(students);
        if (students.length > 0 && !record.studentId) {
          setRecord((prev) => ({ ...prev, studentId: students[0].studentId, studentName: students[0].name }));
        }
      })
      .catch(() => setEnrolledStudents([]));
  }, [activeSession?.session?.id]);

  function refreshAttendance() {
    return api('/api/teacher/attendance').then((res) => setSessions(res.data || []));
  }

  function startSession(event) {
    event.preventDefault();
    if (!selectedScheduleId) return;
    setBusy(true);
    setResult(null);
    api(`/api/teacher/attendance/start?scheduleId=${selectedScheduleId}`, { method: 'POST' })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        refreshAttendance();
        reload();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  function endSession() {
    if (!activeSession?.session?.id) return;
    setBusy(true);
    setResult(null);
    api(`/api/teacher/attendance/${activeSession.session.id}/end`, { method: 'POST' })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        refreshAttendance();
        reload();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  function markRecord(event) {
    event.preventDefault();
    if (!activeSession?.session?.id || !record.studentId) return;
    setBusy(true);
    setResult(null);
    api(`/api/teacher/attendance/${activeSession.session.id}/records`, {
      method: 'POST',
      body: JSON.stringify(record),
    })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setRecord((prev) => ({ ...prev, status: 'PRESENT' }));
        refreshAttendance();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  return (
    <div>
      <SectionHeader title="Attendance" subtitle="Start a secure QR attendance session and manage records." />

      {/* Mode switcher */}
      <div className="attendance-mode-switcher">
        <button
          type="button"
          className={mode === 'session' ? 'primary-btn' : 'ghost-btn'}
          onClick={() => setMode('session')}
        >
          <ClipboardCheck size={15} /> Current Session
        </button>
        <button
          type="button"
          className={mode === 'history' ? 'primary-btn' : 'ghost-btn'}
          onClick={() => setMode('history')}
        >
          <History size={15} /> History
        </button>
      </div>

      {mode === 'history' ? (
        <Panel title="Attendance History" tag="Completed Sessions">
          <TeacherAttendanceHistory />
        </Panel>
      ) : (
        <>
          <Feedback result={result} />
          <div className="section-grid">
            {/* Current session panel */}
            <Panel title="Attendance Session" tag={activeSession?.session?.active ? 'Live' : 'Ready'}>
              <form className="ticket-form teacher-attendance-form" onSubmit={startSession}>
                <select value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)} required>
                  {(data.schedule || []).map((item) => (
                    <option value={item.id} key={item.id}>{item.courseCode} - {item.sectionName} - {item.dayOfWeek}</option>
                  ))}
                </select>
                <button className="primary-btn" type="submit" disabled={busy || !selectedScheduleId}>
                  <ClipboardCheck size={17} /> Start Attendance
                </button>
              </form>

              {activeSession ? (
                <div className="attendance-session">
                  <div className="teacher-focus">
                    <span>{activeSession.schedule?.courseCode}</span>
                    <strong>{activeSession.schedule?.courseTitle}</strong>
                    <p>{activeSession.schedule?.roomNumber} - Started {new Date(activeSession.session.startedAt).toLocaleTimeString()}</p>
                  </div>
                  {activeSession.session.active && (
                    <div className="qr-box">
                      <QRCodeSVG value={checkInUrl} size={154} />
                      <code>{activeSession.session.token}</code>
                    </div>
                  )}
                  <div className="stat-list attendance-stats">
                    <StatRow label="Present" value={activeSession.presentCount || 0} color="emerald" />
                    <StatRow label="Late" value={activeSession.lateCount || 0} color="amber" />
                    <StatRow label="Absent" value={activeSession.absentCount || 0} color="rose" />
                  </div>
                  {activeSession.session.active && (
                    <button className="ghost-btn" type="button" onClick={endSession} disabled={busy}>
                      End Attendance
                    </button>
                  )}
                </div>
              ) : (
                <p className="muted">No active attendance session.</p>
              )}
            </Panel>

            {/* Manual attendance panel */}
            <Panel title="Manual Attendance" tag="Teacher">
              <form className="ticket-form teacher-report-form" onSubmit={markRecord}>
                <select
                  value={record.studentId}
                  onChange={(e) => {
                    const student = enrolledStudents.find((s) => s.studentId === e.target.value);
                    setRecord({ ...record, studentId: e.target.value, studentName: student?.name || '' });
                  }}
                  disabled={!activeSession?.session?.active || enrolledStudents.length === 0}
                  required
                >
                  <option value="">
                    {enrolledStudents.length > 0 ? '- Select Student -' : '- No Active Session -'}
                  </option>
                  {enrolledStudents.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.studentId} - {s.name}
                    </option>
                  ))}
                </select>
                <select value={record.status} onChange={(e) => setRecord({ ...record, status: e.target.value })}>
                  <option>PRESENT</option><option>LATE</option><option>ABSENT</option>
                </select>
                <button className="primary-btn" type="submit" disabled={busy || !activeSession?.session?.active || !record.studentId}>
                  <ClipboardCheck size={17} /> Mark Attendance
                </button>
              </form>
              <Table
                headers={['Student ID', 'Name', 'Status', 'Check-in']}
                rows={(activeSession?.records || []).map((item) => [
                  item.studentId,
                  item.studentName || '-',
                  item.status,
                  item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : '-'
                ])}
                empty="No attendance records yet."
              />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RESERVATION SECTION
// ─────────────────────────────────────────────────────────
export function TeacherReservationSection({ data, reload }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ roomNumber: 'Room 524 (CSE Lab 4)', reservationDate: today, startTime: '10:00', endTime: '11:00', purpose: '' });
  const [availableRooms, setAvailableRooms] = useState(data.classrooms || []);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!form.reservationDate || !form.startTime || !form.endTime) return;
    api(`/api/teacher/rooms/available?date=${form.reservationDate}&startTime=${form.startTime}&endTime=${form.endTime}`)
      .then((res) => setAvailableRooms(res.data || []))
      .catch(() => setAvailableRooms(data.classrooms || []));
  }, [form.reservationDate, form.startTime, form.endTime, data.classrooms]);

  function reserve(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    api('/api/teacher/reservations', { method: 'POST', body: JSON.stringify(form) })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setForm({ ...form, purpose: '' });
        reload();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  return (
    <div>
      <SectionHeader title="Reserve Room" subtitle="Reserve available classrooms with server-side conflict checking." />
      <Feedback result={result} />
      <div className="section-grid">
        <Panel title="Available Rooms" tag={`${availableRooms.length} rooms`}>
          <div className="teacher-room-list">
            {availableRooms.map((room) => (
              <button
                type="button"
                key={room.roomNumber}
                className={`teacher-room-option${form.roomNumber === room.roomNumber ? ' is-selected' : ''}`}
                onClick={() => setForm({ ...form, roomNumber: room.roomNumber })}
              >
                <strong>{room.roomNumber}</strong>
                <span>Capacity {room.capacity} - Floor {room.floor}</span>
              </button>
            ))}
          </div>
          {!availableRooms.length && <p className="muted">No rooms available for this time.</p>}
        </Panel>
        <Panel title="Reservation Form" tag="Room">
          <form className="ticket-form teacher-reservation-form" onSubmit={reserve}>
            <select value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}>
              {(data.classrooms || []).map((room) => <option key={room.roomNumber}>{room.roomNumber}</option>)}
            </select>
            <input type="date" value={form.reservationDate} onChange={(e) => setForm({ ...form, reservationDate: e.target.value })} required />
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            <input className="teacher-purpose-input" placeholder="Purpose or course" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
            <button className="primary-btn" type="submit" disabled={busy}><CalendarCheck size={17} /> Reserve Room</button>
          </form>
        </Panel>
      </div>
      <Panel title="My Reservations" tag={`${data.reservations?.length || 0} total`}>
        <Table
          headers={['Room', 'Date', 'Time', 'Purpose', 'Status']}
          rows={(data.reservations || []).map((item) => [item.roomNumber, formatDate(item.reservationDate), `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`, item.purpose, item.status])}
          empty="No reservations yet."
        />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// NOTICES SECTION
// ─────────────────────────────────────────────────────────
export function TeacherNoticesSection({ notices, data = {}, reload }) {
  const classOptions = Array.from(
    new Map((data.schedule || [])
      .map((item) => [`${item.courseCode}__${item.sectionName}`, item]))
  ).map(([, item]) => item);
  const firstClass = classOptions[0];
  const [form, setForm] = useState({
    title: '',
    content: '',
    courseCode: firstClass?.courseCode || '',
    sectionName: firstClass?.sectionName || ''
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!form.courseCode && !form.sectionName && firstClass) {
      setForm((current) => ({
        ...current,
        courseCode: firstClass.courseCode,
        sectionName: firstClass.sectionName
      }));
    }
  }, [firstClass, form.courseCode, form.sectionName]);

  function publish(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    api('/api/teacher/announcements', { method: 'POST', body: JSON.stringify(form) })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setForm((current) => ({ ...current, title: '', content: '' }));
        reload();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  return (
    <div>
      <SectionHeader title="Campus Announcements" subtitle="Academic notices and teacher-published class updates." />
      <Feedback result={result} />
      <div className="section-grid">
        <Panel title="Publish Academic Announcement" tag="ACADEMIC">
          <form className="ticket-form teacher-notice-form" onSubmit={publish}>
            <select
              value={`${form.courseCode}__${form.sectionName}`}
              onChange={(e) => {
                const selected = classOptions.find((item) => `${item.courseCode}__${item.sectionName}` === e.target.value);
                setForm({
                  ...form,
                  courseCode: selected?.courseCode || '',
                  sectionName: selected?.sectionName || ''
                });
              }}
              required
            >
              {classOptions.map((item) => (
                <option key={`${item.courseCode}__${item.sectionName}`} value={`${item.courseCode}__${item.sectionName}`}>
                  {item.courseCode} - {item.sectionName}
                </option>
              ))}
            </select>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Message" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
            <button className="primary-btn" type="submit" disabled={busy}><RadioTower size={17} /> Publish Announcement</button>
          </form>
        </Panel>
        <Panel title="All Notices" tag={`${notices.length} total`}>
          <NoticeList notices={notices} />
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REPORT ISSUE SECTION
// ─────────────────────────────────────────────────────────
export function TeacherReportIssueSection({ data, reload }) {
  const [ticket, setTicket] = useState({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [issuesError, setIssuesError] = useState(null);
  const [expandedIssueId, setExpandedIssueId] = useState(null);

  const loadIssues = () => {
    setLoadingIssues(true);
    setIssuesError(null);
    api('/api/teacher/issues')
      .then((res) => {
        setIssues(res.data || []);
      })
      .catch((err) => {
        setIssuesError(err.message);
      })
      .finally(() => {
        setLoadingIssues(false);
      });
  };

  useEffect(() => {
    loadIssues();
  }, []);

  function submit(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    api('/api/campus/complaint/submit', { method: 'POST', body: JSON.stringify(ticket) })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setTicket({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' });
        reload();
        loadIssues(); // Refresh history immediately
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  return (
    <div>
      <SectionHeader title="Report Issue" subtitle="Submit classroom or campus issues into the existing maintenance FIFO queue." />
      <div className="section-grid">
        <Panel title="New Issue" tag="Maintenance">
          <form className="ticket-form teacher-report-form" onSubmit={submit}>
            <input placeholder="Issue title" value={ticket.issueTitle} onChange={(e) => setTicket({ ...ticket, issueTitle: e.target.value })} required />
            <input placeholder="Location / Room" value={ticket.location} onChange={(e) => setTicket({ ...ticket, location: e.target.value })} required />
            <select value={ticket.priority} onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
            </select>
            <textarea placeholder="Description" value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} />
            <button className="primary-btn" type="submit" disabled={busy}><Wrench size={17} /> Report Issue</button>
          </form>
          <Feedback result={result} />
        </Panel>
        <Panel title="How It Routes" tag="FIFO Queue">
          <div className="teacher-focus">
            <span>Maintenance Queue</span>
            <strong>Shared Admin workflow</strong>
            <p>Your report enters the same queue that Admin processes in first-in, first-out order.</p>
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Panel title="My Reported Issues" tag="History">
          {loadingIssues ? (
            <p className="muted" style={{ padding: '1.5rem 0' }}>Loading issue history...</p>
          ) : issuesError ? (
            <p className="error-text" style={{ padding: '1.5rem 0', color: 'var(--tx-danger)' }}>Failed to load history: {issuesError}</p>
          ) : issues.length === 0 ? (
            <p className="muted" style={{ padding: '1.5rem 0' }}>No issues reported yet. Submitted classroom or campus issues will appear here.</p>
          ) : (
            <div className="table-wrapper">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reported</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <React.Fragment key={issue.id}>
                      <tr>
                        <td><strong>{issue.issueTitle}</strong></td>
                        <td>{issue.location}</td>
                        <td>
                          <span className={`badge badge--${issue.priority === 'HIGH' ? 'danger' : issue.priority === 'LOW' ? 'neutral' : 'warning'}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge--${issue.status === 'RESOLVED' || issue.status === 'COMPLETED' ? 'success' : issue.status === 'PENDING' ? 'warning' : 'primary'}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td>{new Date(issue.reportedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                        <td>
                          <button className="icon-btn" onClick={() => setExpandedIssueId(expandedIssueId === issue.id ? null : issue.id)} title="View Details">
                            {expandedIssueId === issue.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expandedIssueId === issue.id && (
                        <tr>
                          <td colSpan="6" style={{ padding: '1rem', backgroundColor: 'var(--bg-card-alt)' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tx-secondary)' }}>
                              <strong>Description:</strong> {issue.description || 'No description provided.'}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

// ─────────────────────────────────────────────────────────
// OVERVIEW WIDGET
// ─────────────────────────────────────────────────────────
export function TeacherOverviewToday({ nextClass }) {
  if (!nextClass) return null;
  return (
    <div className="teacher-today-card">
      <span>Next Class</span>
      <strong>{nextClass.courseCode}</strong>
      <p>{formatTime(nextClass.startTime)} to {formatTime(nextClass.endTime)} - {nextClass.roomNumber}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ABSENCE EXCUSE REVIEWS
// ─────────────────────────────────────────────────────────
export function TeacherExcusesSection() {
  const [excuses, setExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExcuse, setSelectedExcuse] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const loadExcuses = () => {
    setLoading(true);
    api('/api/teacher/excuses')
      .then((res) => {
        setExcuses(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadExcuses();
  }, []);

  const handleReview = (excuseId, status, reviewRemarks = remarks) => {
    setBusy(true);
    api(`/api/teacher/excuses/${excuseId}/review?status=${status}&remarks=${encodeURIComponent(reviewRemarks)}`, { method: 'POST' })
      .then(() => {
        setBusy(false);
        setSelectedExcuse(null);
        setRemarks('');
        loadExcuses();
      })
      .catch((err) => {
        setBusy(false);
        alert(err.message);
      });
  };

  return (
    <div className="teacher-excuses-section">
      <SectionHeader
        title="Absence & Medical Leave Reviews"
        subtitle="Review student absence excuse submissions, doctor prescriptions, and official leave applications for your courses."
      />

      <Panel title="Submitted Excuses" tag={`${excuses.length} records`}>
        {loading ? (
          <p className="muted" style={{ padding: '1.5rem 0' }}>Loading student excuses...</p>
        ) : excuses.length === 0 ? (
          <p className="muted" style={{ padding: '1.5rem 0' }}>No absence excuse requests currently submitted.</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Absence Date</th>
                  <th>Reason Category</th>
                  <th>Explanation & Slip</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {excuses.map((exc) => (
                  <tr key={exc.id}>
                    <td>
                      <strong>{exc.studentName}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--tx-muted)' }}>ID: {exc.studentId}</span>
                    </td>
                    <td><strong>{exc.courseCode}</strong> ({exc.sectionName})</td>
                    <td>{exc.absenceDate}</td>
                    <td><span className="badge badge--neutral">{exc.reasonCategory}</span></td>
                    <td style={{ maxWidth: '280px' }}>
                      <p style={{ margin: 0, fontSize: '0.82rem' }}>{exc.explanation}</p>
                      {exc.documentUrl && <span className="doc-link-tag">📎 {exc.documentUrl}</span>}
                    </td>
                    <td>
                      <span className={`badge badge--${exc.status === 'APPROVED' ? 'emerald' : exc.status === 'REJECTED' ? 'rose' : 'amber'}`}>
                        {exc.status}
                      </span>
                    </td>
                    <td>
                      {exc.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                          <button
                            type="button"
                            className="action-pill-btn action-pill-btn--approve"
                            onClick={() => {
                              const r = prompt('Enter optional approval remarks for student:', 'Medical certificate accepted.');
                              if (r !== null) {
                                setRemarks(r);
                                handleReview(exc.id, 'APPROVED', r);
                              }
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            className="action-pill-btn action-pill-btn--reject"
                            onClick={() => {
                              const r = prompt('Enter rejection reason for student:', 'Insufficient medical documentation.');
                              if (r !== null) {
                                setRemarks(r);
                                handleReview(exc.id, 'REJECTED', r);
                              }
                            }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: '0.8rem' }}>Reviewed: {exc.teacherRemarks || 'Done'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FACULTY OFFICE HOURS & QUERY PRE-SUBMISSIONS
// ─────────────────────────────────────────────────────────
export function TeacherOfficeHoursSection() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    slotDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '14:30',
    roomNumber: 'Room 524 (Faculty Desk)',
    dayOfWeek: 'Monday'
  });
  const [busy, setBusy] = useState(false);

  const loadSlots = () => {
    setLoading(true);
    api('/api/teacher/office-hours/slots')
      .then((res) => {
        setSlots(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleCreateSlot = (e) => {
    e.preventDefault();
    setBusy(true);
    api('/api/teacher/office-hours/slots', {
      method: 'POST',
      body: JSON.stringify(newSlot)
    })
      .then(() => {
        setBusy(false);
        setModalOpen(false);
        loadSlots();
      })
      .catch((err) => {
        setBusy(false);
        alert(err.message);
      });
  };

  const handleComplete = (slotId) => {
    const feedback = prompt('Enter consultation notes/follow-up for student (optional):', 'Discussed problem solution.');
    if (feedback !== null) {
      api(`/api/teacher/office-hours/slots/${slotId}/status?status=COMPLETED&feedback=${encodeURIComponent(feedback)}`, { method: 'POST' })
        .then(() => loadSlots())
        .catch((err) => alert(err.message));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Faculty Office Hours & Consultation Manager"
        subtitle="Publish consultation slots, review pre-submitted student query topics in advance, and conduct safe one-on-one sessions."
      />

      <div className="section-grid">
        <Panel title="My Consultation Slots" tag={`${slots.length} total`}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="primary-btn" onClick={() => setModalOpen(true)}>
              + Add Office Hour Slot
            </button>
          </div>

          {loading ? (
            <p className="muted">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="muted">No office hour slots published yet. Click above to create one.</p>
          ) : (
            <div className="teacher-slots-list">
              {slots.map((s) => (
                <div key={s.id} className="teacher-slot-item" style={{
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  background: s.status === 'BOOKED' ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{s.dayOfWeek}, {s.slotDate}</strong> • <span>{s.startTime} - {s.endTime}</span> ({s.roomNumber})
                    </div>
                    <span className={`badge badge--${s.status === 'AVAILABLE' ? 'emerald' : s.status === 'BOOKED' ? 'accent' : 'neutral'}`}>
                      {s.status}
                    </span>
                  </div>

                  {s.status === 'BOOKED' && (
                    <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-glow)' }}>
                          Student: {s.bookedStudentName} (ID: {s.bookedStudentId})
                        </span>
                        <button
                          type="button"
                          className="inline-action-btn"
                          onClick={() => handleComplete(s.id)}
                        >
                          Mark Completed
                        </button>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <span className="badge badge--sky" style={{ marginRight: '0.5rem' }}>{s.queryCategory}</span>
                        <strong>Topic: {s.queryTopic}</strong>
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.83rem', color: 'var(--tx-muted)' }}>
                          <strong>Pre-submitted Query:</strong> {s.queryDetails}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Engine Specifications" tag="AOOP Safe">
          <div className="teacher-focus">
            <span>Concurrency-Safe Protocol</span>
            <strong>Thread & Isolation Locks</strong>
            <p>
              Students booking these slots go through `ReentrantLock` and Serializable Isolation to guarantee no double-booking race conditions.
            </p>
          </div>
        </Panel>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Office Hour Consultation Slot</h3>
              <button type="button" className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSlot} className="modal-form">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={newSlot.slotDate}
                  onChange={(e) => setNewSlot({ ...newSlot, slotDate: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time (HH:mm) *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Time (HH:mm) *</label>
                  <input
                    type="time"
                    required
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Room / Location *</label>
                <input
                  type="text"
                  required
                  value={newSlot.roomNumber}
                  onChange={(e) => setNewSlot({ ...newSlot, roomNumber: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={busy}>
                  {busy ? 'Creating...' : 'Publish Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// NOTIFICATIONS SECTION
// ─────────────────────────────────────────────────────────
export function TeacherNotificationsSection({
  setActiveSection,
  onNotificationRead,
  onAllNotificationsRead,
  refreshUnreadCount
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadNotifications = () => {
    setLoading(true);
    api('/api/notifications')
      .then((res) => {
        setNotifications(res.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = (id) => {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || target.read) return;

    api(`/api/notifications/${id}/read`, { method: 'POST' })
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        onNotificationRead?.(1);
      })
      .catch((err) => {
        console.error(err);
        refreshUnreadCount?.();
      });
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.targetSection && setActiveSection) {
      setActiveSection(notif.targetSection);
    }
  };

  const markAllAsRead = () => {
    api('/api/notifications/read-all', { method: 'POST' })
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onAllNotificationsRead?.();
      })
      .catch((err) => {
        console.error(err);
        refreshUnreadCount?.();
      });
  };

  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div>
      <SectionHeader title="Notifications" subtitle="Stay updated on classes, students, and campus events." />
      {error && <Feedback result={{ type: 'error', text: error }} />}

      <div className="notification-toolbar">
        <div className="notification-filters">
          <button className={filter === 'all' ? 'primary-btn' : 'ghost-btn'} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'unread' ? 'primary-btn' : 'ghost-btn'} onClick={() => setFilter('unread')}>Unread</button>
        </div>
        <button className="ghost-btn" onClick={markAllAsRead}>Mark all as read</button>
      </div>

      <div className="section-grid" style={{ gridTemplateColumns: '1fr' }}>
        <Panel title="Recent Notifications">
          {loading ? (
            <p className="muted">Loading notifications...</p>
          ) : filteredNotifications.length === 0 ? (
            <p className="muted">No notifications.</p>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'notification-item--unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-meta">
                    <strong>{notif.title}</strong>
                    <span className="notification-time">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="notification-message">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
