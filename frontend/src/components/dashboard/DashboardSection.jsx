import React, { useState } from 'react';
import { Building2, BusFront, ClipboardCheck, Database, DoorOpen, Layers, RadioTower, RefreshCw, Server, ShieldCheck, UsersRound, Wrench, Zap } from 'lucide-react';
import { api, postAction } from '../../utils/api';
import { sampleClassrooms, roleSummary } from '../../utils/helpers';
import { SectionHeader, NoticeList, BusLocations, StatRow, Panel, Table, ActionButton } from '../shared/SharedComponents';
import {
  TeacherAttendanceSection,
  TeacherClassesSection,
  TeacherExcusesSection,
  TeacherNoticesSection,
  TeacherOfficeHoursSection,
  TeacherOverviewToday,
  TeacherReportIssueSection,
  TeacherReservationSection,
  TeacherScheduleSection,
  TeacherNotificationsSection
} from './TeacherSections';
import { TeacherStudentsSection } from './teacher/TeacherStudentsSection';
import { StudentAttendanceSection } from './student/StudentAttendanceSection';
import { StudentLostFoundSection } from './student/StudentLostFoundSection';
import { StudentLabEquipmentSection } from './student/StudentLabEquipmentSection';
import { StudentOfficeHoursSection } from './student/StudentOfficeHoursSection';
import { AdminEquipmentSection } from './admin/AdminEquipmentSection';
import { AdminUsersSection } from './admin/AdminUsersSection';

/* ─────────────────────────────────────────────────────────
   SECTION ROUTER
───────────────────────────────────────────────────────── */
export function DashboardSection({
  role,
  section,
  data,
  telemetry,
  auditLogs,
  reload,
  reloadLogs,
  setActiveSection,
  onNotificationRead,
  onAllNotificationsRead,
  refreshUnreadCount
}) {
  if (section === 'overview') {
    return (
      <>
        <WelcomeBanner data={data} telemetry={telemetry} role={role} />
        <MetricGrid telemetry={telemetry} data={data} role={role} />
        <div className="workspace-grid">
          <div className="primary-stack">
            <OverviewPrimaryPanel role={role} data={data} reload={reload} />
            {role === 'admin' && data.busLocations && (
              <Panel title="Bus Telemetry" tag="Live Socket">
                <BusLocations locations={data.busLocations} />
              </Panel>
            )}
          </div>
          <SideColumn data={data} showBusTelemetry={role !== 'admin'} />
        </div>
      </>
    );
  }

  if (role === 'admin') {
    if (section === 'users') return <AdminUsersSection />;
    if (section === 'equipment') return <AdminEquipmentSection />;
    if (section === 'classrooms') return <ClassroomsSection classrooms={sampleClassrooms()} />;
    if (section === 'transport') return <TransportSection data={data} />;
    if (section === 'maintenance') return <MaintenanceSection data={data} reload={reload} />;
    if (section === 'audit') return <AuditSection auditLogs={auditLogs} data={data} reload={reloadLogs} />;
  }

  if (role === 'teacher') {
    if (section === 'schedule') return <TeacherScheduleSection data={data} />;
    if (section === 'classes') return <TeacherClassesSection data={data} reload={reload} />;
    if (section === 'students') return <TeacherStudentsSection />;
    if (section === 'attendance') return <TeacherAttendanceSection data={data} reload={reload} />;
    if (section === 'excuses') return <TeacherExcusesSection />;
    if (section === 'officehours') return <TeacherOfficeHoursSection />;
    if (section === 'reservations') return <TeacherReservationSection data={data} reload={reload} />;
    if (section === 'notices') return <TeacherNoticesSection notices={data.notices || []} reload={reload} />;
    if (section === 'reportIssue') return <TeacherReportIssueSection data={data} reload={reload} />;
    if (section === 'notifications') {
      return (
        <TeacherNotificationsSection
          setActiveSection={setActiveSection}
          onNotificationRead={onNotificationRead}
          onAllNotificationsRead={onAllNotificationsRead}
          refreshUnreadCount={refreshUnreadCount}
        />
      );
    }
  }

  if (role === 'student') {
    if (section === 'attendance') return <StudentAttendanceSection />;
    if (section === 'lostfound') return <StudentLostFoundSection />;
    if (section === 'labequipment') return <StudentLabEquipmentSection />;
    if (section === 'officehours') return <StudentOfficeHoursSection />;
    if (section === 'schedule') return <StudentScheduleSection data={data} />;
    if (section === 'shuttle') return <ShuttleSection busLocations={data.busLocations || {}} />;
    if (section === 'tickets') return <TicketsSection data={data} reload={reload} />;
  }

  if (role === 'security') {
    if (section === 'gate') return <GateSection data={data} reload={reload} />;
    if (section === 'visitors') return <VisitorLogSection data={data} />;
    if (section === 'busfleet') return <ShuttleSection busLocations={data.busLocations || {}} />;
  }

  return <div className="empty-state"><p>Section not found.</p></div>;
}

/* ─────────────────────────────────────────────────────────
   OVERVIEW COMPONENTS
───────────────────────────────────────────────────────── */
function WelcomeBanner({ data, telemetry, role }) {
  return (
    <div className="welcome-card">
      <div>
        <span className="mini-pill"><RadioTower size={14} /> Live campus signal</span>
        <h2>Welcome, {data.user?.fullName || 'there'}</h2>
        <p>{roleSummary(role)}</p>
      </div>
      <div className="hero-numbers">
        <strong>{telemetry.activeStudents}</strong>
        <span>active students</span>
      </div>
    </div>
  );
}

function MetricGrid({ telemetry, data, role }) {
  const occupiedRooms = Number(telemetry.occupiedRooms || 0);
  const totalRooms = Number(telemetry.totalRooms || 0);
  const roomUtilization = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : null;
  const cards = role === 'student'
    ? [
        {
          label: 'Campus Buses',
          value: `${telemetry.activeBuses} running`,
          icon: BusFront,
          tone: 'buses',
          detail: 'Live fleet'
        },
        {
          label: 'My Tickets',
          value: data.myComplaints?.length || 0,
          icon: Wrench,
          tone: 'power',
          detail: 'Maintenance'
        }
      ]
    : [
        {
          label: 'Rooms Active',
          value: `${telemetry.occupiedRooms} / ${telemetry.totalRooms}`,
          icon: Building2,
          tone: 'rooms',
          detail: roomUtilization !== null ? `${roomUtilization}% utilized` : 'Classroom signal',
          progress: roomUtilization
        },
        {
          label: 'Campus Buses',
          value: `${telemetry.activeBuses} running`,
          icon: BusFront,
          tone: 'buses',
          detail: 'Live fleet'
        },
        {
          label: 'Power Load',
          value: `${telemetry.powerConsumptionKW} kW`,
          icon: Zap,
          tone: 'power',
          detail: 'Metered load'
        }
      ];
  if (role === 'admin')    cards.push({ label: 'Total Accounts', value: data.totalUsers, icon: UsersRound, tone: 'accounts', detail: 'Directory' });
  if (role === 'security') cards.push({ label: 'Unique Gate Passes', value: data.uniqueGatePassCount, icon: DoorOpen, tone: 'accounts', detail: 'Set collection' });
  if (role === 'teacher')  cards.push({ label: 'Faculty on Campus', value: telemetry.facultyOnCampus, icon: UsersRound, tone: 'accounts', detail: 'Presence' });

  return (
    <div className={`metric-grid${role === 'student' ? ' metric-grid--student' : ''}`}>
      {cards.map(({ label, value, icon: Icon, tone, detail, progress }) => (
        <div className={`metric-card metric-card--${tone}`} key={label}>
          <div className="metric-card-head">
            <span>{label}</span>
            <span className="metric-icon"><Icon size={21} /></span>
          </div>
          <strong>{value}</strong>
          <div className="metric-card-foot">
            {label === 'Campus Buses' && <span className="live-dot" aria-hidden="true" />}
            <span>{detail}</span>
          </div>
          {typeof progress === 'number' && (
            <div className="metric-progress" aria-label={`Room utilization ${progress}%`}>
              <span style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OverviewPrimaryPanel({ role, data, reload }) {
  if (role === 'admin')    return <AdminOverviewPanel data={data} reload={reload} />;
  if (role === 'teacher')  return <TeacherOverviewPanel data={data} />;
  if (role === 'security') return <SecurityOverviewPanel data={data} reload={reload} />;
  return <StudentOverviewPanel data={data} reload={reload} />;
}

function SideColumn({ data, showBusTelemetry = true }) {
  return (
    <div className="side-stack">
      <Panel title="Campus Notices" tag="Live">
        <NoticeList notices={(data.notices || []).slice(0, 4)} />
      </Panel>
      {showBusTelemetry && data.busLocations && (
        <Panel title="Bus Telemetry" tag="Socket">
          <BusLocations locations={data.busLocations} />
        </Panel>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ADMIN PANELS
───────────────────────────────────────────────────────── */
function AdminOverviewPanel({ data, reload }) {
  return (
    <Panel title="Operations Queue" tag="FIFO + Stack">
      <div className="action-row">
        <ActionButton label="Process next complaint" icon={ClipboardCheck} onClick={() => postAction('/api/campus/complaint/process-next', reload)} />
        <ActionButton label="Undo last action" icon={Layers} onClick={() => postAction('/api/campus/admin/undo', reload)} />
        <ActionButton label="Backup campus state" icon={Database} onClick={() => postAction('/api/campus/backup/save')} />
      </div>
      <Table
        headers={['Issue', 'Location', 'Priority', 'Status']}
        rows={(data.queuedComplaints || []).map((item) => [item.issueTitle, item.location, item.priority, item.status])}
        empty="No complaints waiting in queue."
      />
    </Panel>
  );
}

function MaintenanceSection({ data, reload }) {
  return (
    <div>
      <SectionHeader title="Maintenance Queue" subtitle="FIFO-based complaint management. Process tickets in order of submission." />
      <div className="section-grid">
        <Panel title="Pending Queue" tag={`${data.queueSize || 0} items`}>
          <div className="action-row" style={{ marginBottom: '1rem' }}>
            <ActionButton label="Process Next" icon={ClipboardCheck} onClick={() => postAction('/api/campus/complaint/process-next', reload)} />
            <ActionButton label="Undo Last Admin Action" icon={Layers} onClick={() => postAction('/api/campus/admin/undo', reload)} />
          </div>
          <Table
            headers={['Issue', 'Location', 'Priority', 'Status', 'Reported']}
            rows={(data.queuedComplaints || []).map((item) => [
              item.issueTitle, item.location, item.priority, item.status,
              item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : '-'
            ])}
            empty="Maintenance queue is empty."
          />
        </Panel>

        <Panel title="Account Statistics" tag="Users">
          <div className="stat-list">
            <StatRow label="Total Accounts" value={data.totalUsers} color="accent" />
            <StatRow label="Students"        value={data.totalStudents} color="emerald" />
            <StatRow label="Teachers"        value={data.totalTeachers} color="sky" />
            <StatRow label="Security Staff"  value={data.totalSecurity} color="violet" />
            <StatRow label="Unique Gate Passes" value={data.uniqueAttendeesCount} color="amber" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AuditSection({ auditLogs, data, reload }) {
  return (
    <div>
      <SectionHeader title="Audit Stack" subtitle="LIFO action log - file-backed audit trail of all admin operations." />
      <div className="section-grid">
        <Panel title="Audit Log Entries" tag={`${auditLogs.length} entries`}>
          <div className="action-row" style={{ marginBottom: '1rem' }}>
            <ActionButton label="Refresh Logs" icon={RefreshCw} onClick={reload} />
            <ActionButton label="Backup Campus State" icon={Database} onClick={() => postAction('/api/campus/backup/save')} />
            <ActionButton label="Restore Backup" icon={Server} onClick={() => postAction('/api/campus/backup/restore')} />
          </div>
          {auditLogs.length > 0 ? (
            <div className="audit-log-list">
              {auditLogs.map((line, i) => (
                <div key={i} className="audit-entry">
                  <span className="audit-index">{auditLogs.length - i}</span>
                  <code>{line}</code>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ padding: '1rem 0' }}>No audit entries yet. Actions will appear here.</p>
          )}
        </Panel>

        <Panel title="Action Stack History" tag="LIFO">
          <Table
            headers={['Action', 'Admin', 'Timestamp']}
            rows={(data.actionStackHistory || []).map((item) => [
              item.actionType,
              item.adminEmail,
              item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'
            ])}
            empty="No admin actions recorded yet."
          />
        </Panel>
      </div>
    </div>
  );
}

function TransportSection({ data }) {
  const [busId, setBusId] = useState('BUS-01');
  const [location, setLocation] = useState('Notun Bazar Junction');
  const [txResult, setTxResult] = useState(null);

  function transmit(e) {
    e.preventDefault();
    api(`/api/campus/bus/transmit?busId=${encodeURIComponent(busId)}&location=${encodeURIComponent(location)}`, { method: 'POST' })
      .then((res) => setTxResult({ type: 'success', text: res.message }))
      .catch((err) => setTxResult({ type: 'error', text: err.message }));
  }

  return (
    <div>
      <SectionHeader title="Transport Management" subtitle="Live bus GPS telemetry via TCP socket. Transmit, track, and monitor fleet routes." />
      <div className="section-grid">
        <Panel title="Live Bus Locations" tag="Socket">
          <BusLocations locations={data.busLocations || {}} />
        </Panel>
        <Panel title="Transmit Bus Update" tag="TCP Socket">
          <form className="ticket-form" onSubmit={transmit}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>Bus ID</label>
              <input value={busId} onChange={e => setBusId(e.target.value)} placeholder="BUS-01" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>GPS Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location string" />
            </div>
            <button className="primary-btn" type="submit" style={{ gridColumn: '1/-1' }}>
              <RadioTower size={16} /> Transmit Location
            </button>
          </form>
          {txResult && <div className={`notice ${txResult.type}`}>{txResult.text}</div>}
        </Panel>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHARED PANELS
───────────────────────────────────────────────────────── */
function ClassroomsSection({ classrooms }) {
  return (
    <div>
      <SectionHeader title="Smart Classroom Matrix" subtitle="Live room occupancy, power draw, and capacity sorted by comparable algorithm." />
      <div className="classroom-grid">
        {(classrooms || []).map((room, i) => (
          <div key={i} className={`room-card ${room.occupied ? 'room-card--active' : ''}`}>
            <div className="room-card-header">
              <Building2 size={16} />
              <span className={`room-badge ${room.occupied ? 'badge--occupied' : 'badge--free'}`}>
                {room.occupied ? 'Occupied' : 'Available'}
              </span>
            </div>
            <strong className="room-name">{room.roomNumber}</strong>
            <div className="room-stats">
              <div className="room-stat"><span>Floor</span><strong>{room.floor}</strong></div>
              <div className="room-stat"><span>Capacity</span><strong>{room.capacity}</strong></div>
              <div className="room-stat"><span>Power</span><strong>{room.powerKW} kW</strong></div>
            </div>
            <div className="power-bar">
              <div className="power-fill" style={{ width: `${Math.min((room.powerKW / 20) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {(!classrooms || classrooms.length === 0) && <p className="muted">No classroom data available.</p>}
    </div>
  );
}

function ShuttleSection({ busLocations }) {
  return (
    <div>
      <SectionHeader title="Shuttle GPS Tracker" subtitle="Real-time bus locations transmitted via UIU TCP socket network." />
      <Panel title="Active Bus Routes" tag="Socket Feed">
        <BusLocations locations={busLocations} />
      </Panel>
    </div>
  );
}

function NoticesSection({ notices }) {
  return (
    <div>
      <SectionHeader title="Campus Announcements" subtitle="Latest notices from university administration and departments." />
      <Panel title="All Notices" tag={`${notices.length} total`}>
        <NoticeList notices={notices} />
      </Panel>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STUDENT PANELS
───────────────────────────────────────────────────────── */
function StudentOverviewPanel({ data, reload }) {
  return (
    <Panel title="My Support Tickets" tag="Maintenance">
      <TicketForm data={data} reload={reload} />
      <Table
        headers={['Issue', 'Location', 'Priority', 'Status']}
        rows={(data.myComplaints || []).slice(0, 5).map((item) => [item.issueTitle, item.location, item.priority, item.status])}
        empty="No support tickets submitted yet."
      />
    </Panel>
  );
}

function StudentScheduleSection({ data }) {
  const classrooms = sampleClassrooms();
  return (
    <div>
      <SectionHeader title="Class Schedule" subtitle="Available and occupied rooms across campus." />
      <ClassroomsSection classrooms={classrooms} />
    </div>
  );
}

function TicketsSection({ data, reload }) {
  return (
    <div>
      <SectionHeader title="Support Tickets" subtitle="Submit and track your maintenance requests through the FIFO queue." />
      <div className="section-grid">
        <Panel title="Submit New Ticket" tag="FIFO Queue">
          <TicketForm data={data} reload={reload} />
        </Panel>
        <Panel title="My Ticket History" tag={`${data.myComplaints?.length || 0} total`}>
          <Table
            headers={['Issue', 'Location', 'Priority', 'Status']}
            rows={(data.myComplaints || []).map((item) => [item.issueTitle, item.location, item.priority, item.status])}
            empty="No support tickets submitted yet."
          />
        </Panel>
      </div>
    </div>
  );
}

function TicketForm({ data, reload }) {
  const [ticket, setTicket] = useState({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' });

  function submitTicket(event) {
    event.preventDefault();
    const payload = { ...ticket, studentName: data.user?.fullName || 'Student', studentId: data.user?.studentOrEmpId || '011211001' };
    api('/api/campus/complaint/submit', { method: 'POST', body: JSON.stringify(payload) })
      .then(() => { setTicket({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' }); reload(); })
      .catch((err) => alert(err.message));
  }

  return (
    <form className="ticket-form" onSubmit={submitTicket}>
      <input placeholder="Location (e.g. Room 524)" value={ticket.location} onChange={(e) => setTicket({ ...ticket, location: e.target.value })} required />
      <input placeholder="Issue title" value={ticket.issueTitle} onChange={(e) => setTicket({ ...ticket, issueTitle: e.target.value })} required />
      <select value={ticket.priority} onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}>
        <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
      </select>
      <textarea placeholder="Describe the issue..." value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} />
      <button className="primary-btn" type="submit" style={{ gridColumn: '1/-1' }}><Wrench size={17} /> Submit Ticket</button>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────
   TEACHER PANELS
───────────────────────────────────────────────────────── */
function TeacherOverviewPanel({ data }) {
  return (
    <div className="teacher-overview-stack">
      <TeacherOverviewToday nextClass={data.nextClass} />
      <Panel title="Smart Classroom Matrix" tag="Comparable Sort">
        <Table
          headers={['Room', 'Floor', 'Capacity', 'Power', 'Status']}
          rows={(data.classrooms || []).map((room) => [
            room.roomNumber, room.floor, room.capacity, `${room.powerKW} kW`,
            room.occupied ? 'Occupied' : 'Available'
          ])}
        />
      </Panel>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECURITY PANELS
───────────────────────────────────────────────────────── */
function SecurityOverviewPanel({ data, reload }) {
  const [studentId, setStudentId] = useState('011211001');
  const [message, setMessage] = useState(null);

  function scan(event) {
    event.preventDefault();
    fetch(`/api/campus/gate/checkin?studentId=${encodeURIComponent(studentId)}`, { method: 'POST', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((res) => { setMessage({ type: res.success ? 'success' : 'error', text: res.message }); reload(); });
  }

  return (
    <Panel title="Gate Access Validator" tag="Set Collection">
      <form className="scan-form" onSubmit={scan}>
        <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student or staff ID" />
        <button className="primary-btn" type="submit"><ShieldCheck size={17} /> Verify Access</button>
      </form>
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      <BusLocations locations={data.busLocations || {}} />
    </Panel>
  );
}

function GateSection({ data, reload }) {
  const [studentId, setStudentId] = useState('011211001');
  const [message, setMessage] = useState(null);

  function scan(event) {
    event.preventDefault();
    fetch(`/api/campus/gate/checkin?studentId=${encodeURIComponent(studentId)}`, { method: 'POST', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((res) => { setMessage({ type: res.success ? 'success' : 'error', text: res.message }); reload(); });
  }

  return (
    <div>
      <SectionHeader title="Gate Access Validator" subtitle="Set-based unique attendee tracking. Each ID can only check in once." />
      <div className="section-grid">
        <Panel title="Check-In Terminal" tag="Set Collection">
          <form className="scan-form" onSubmit={scan}>
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student or staff ID" />
            <button className="primary-btn" type="submit"><ShieldCheck size={17} /> Verify Access</button>
          </form>
          {message && <div className={`notice ${message.type}`}>{message.text}</div>}
          <div className="stat-list" style={{ marginTop: '1rem' }}>
            <StatRow label="Unique Gate Passes Today" value={data.uniqueGatePassCount} color="emerald" />
          </div>
        </Panel>
        <Panel title="Campus Notices" tag="Live">
          <NoticeList notices={(data.notices || []).slice(0, 4)} />
        </Panel>
      </div>
    </div>
  );
}

function VisitorLogSection({ data }) {
  return (
    <div>
      <SectionHeader title="Visitor Log" subtitle="Unique campus entry records from the gate Set collection." />
      <Panel title="Access Statistics" tag="Set">
        <div className="stat-list">
          <StatRow label="Unique Check-ins (Set size)" value={data.uniqueGatePassCount} color="emerald" />
        </div>
        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.83rem' }}>
          The gate system uses a Java HashSet to guarantee uniqueness - no student ID can be recorded twice in a session.
        </p>
      </Panel>
    </div>
  );
}

