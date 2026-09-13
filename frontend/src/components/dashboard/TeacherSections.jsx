import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BookOpen, CalendarCheck, ClipboardCheck, RadioTower, Wrench } from 'lucide-react';
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

export function TeacherAttendanceSection({ data, reload }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(data.schedule?.[0]?.id || '');
  const [sessions, setSessions] = useState(data.attendanceSessions || []);
  const [record, setRecord] = useState({ studentId: '', studentName: '', status: 'PRESENT' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSessions(data.attendanceSessions || []);
  }, [data.attendanceSessions]);

  const activeSession = sessions.find((item) => item.session?.active) || sessions[0];
  const checkInUrl = activeSession?.session?.token
    ? `${window.location.origin}/attendance/checkin?token=${activeSession.session.token}`
    : '';

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
    if (!activeSession?.session?.id) return;
    setBusy(true);
    setResult(null);
    api(`/api/teacher/attendance/${activeSession.session.id}/records`, { method: 'POST', body: JSON.stringify(record) })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setRecord({ studentId: '', studentName: '', status: 'PRESENT' });
        refreshAttendance();
      })
      .catch((err) => setResult({ type: 'error', text: err.message }))
      .finally(() => setBusy(false));
  }

  return (
    <div>
      <SectionHeader title="Attendance" subtitle="Start a secure QR attendance session and manage manual records." />
      <Feedback result={result} />
      <div className="section-grid">
        <Panel title="Attendance Session" tag={activeSession?.session?.active ? 'Live' : 'Ready'}>
          <form className="ticket-form teacher-attendance-form" onSubmit={startSession}>
            <select value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)} required>
              {(data.schedule || []).map((item) => (
                <option value={item.id} key={item.id}>{item.courseCode} - {item.sectionName} - {item.dayOfWeek}</option>
              ))}
            </select>
            <button className="primary-btn" type="submit" disabled={busy || !selectedScheduleId}><ClipboardCheck size={17} /> Start Attendance</button>
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
              {activeSession.session.active && <button className="ghost-btn" type="button" onClick={endSession} disabled={busy}>End Attendance</button>}
            </div>
          ) : (
            <p className="muted">No active attendance session.</p>
          )}
        </Panel>

        <Panel title="Manual Attendance" tag="Teacher">
          <form className="ticket-form teacher-report-form" onSubmit={markRecord}>
            <input placeholder="Student ID" value={record.studentId} onChange={(e) => setRecord({ ...record, studentId: e.target.value })} required />
            <input placeholder="Student name" value={record.studentName} onChange={(e) => setRecord({ ...record, studentName: e.target.value })} />
            <select value={record.status} onChange={(e) => setRecord({ ...record, status: e.target.value })}>
              <option>PRESENT</option><option>LATE</option><option>ABSENT</option>
            </select>
            <button className="primary-btn" type="submit" disabled={busy || !activeSession?.session?.active}><ClipboardCheck size={17} /> Mark Student</button>
          </form>
          <Table
            headers={['Student ID', 'Name', 'Status', 'Check-in']}
            rows={(activeSession?.records || []).map((item) => [item.studentId, item.studentName || '-', item.status, item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : '-'])}
            empty="No attendance records yet."
          />
        </Panel>
      </div>
    </div>
  );
}

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

export function TeacherNoticesSection({ notices, reload }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function publish(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    api('/api/teacher/announcements', { method: 'POST', body: JSON.stringify(form) })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setForm({ title: '', content: '' });
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

export function TeacherReportIssueSection({ data, reload }) {
  const [ticket, setTicket] = useState({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function submit(event) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    api('/api/campus/complaint/submit', { method: 'POST', body: JSON.stringify(ticket) })
      .then((res) => {
        setResult({ type: 'success', text: res.message });
        setTicket({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' });
        reload();
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
    </div>
  );
}

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
