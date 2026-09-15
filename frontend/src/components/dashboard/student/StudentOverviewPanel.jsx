import React, { useState, useEffect } from 'react';
import { Panel, Table } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';
import { Calendar, CheckCircle, Clock, BookOpen, Truck, AlertTriangle } from 'lucide-react';

export function StudentOverviewPanel({ data, reload }) {
  const [schedule, setSchedule] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [events, setEvents] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/api/student/schedule').catch(() => ({ data: [] })),
      api('/api/student/attendance/summary').catch(() => ({ data: [] })),
      api('/api/student/office-hours/my-appointments').catch(() => ({ data: [] })),
      api('/api/student/equipment/my-bookings').catch(() => ({ data: [] })),
      api('/api/student/events').catch(() => ({ data: [] })),
      api('/api/student/emergencies/active').catch(() => ({ data: [] }))
    ]).then(([sched, att, appt, eq, ev, emerg]) => {
      setSchedule(sched.data || []);
      setAttendance(att.data || []);
      setAppointments(appt.data || []);
      setEquipment(eq.data || []);
      setEvents(ev.data || []);
      setEmergencies(emerg.data || []);
      setLoading(false);
    });
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const todayClasses = schedule.filter(s => s.dayOfWeek === todayStr);
  
  // Sort classes by start time
  todayClasses.sort((a, b) => {
    const timeA = a.startTime ? a.startTime[0] * 60 + a.startTime[1] : 0;
    const timeB = b.startTime ? b.startTime[0] * 60 + b.startTime[1] : 0;
    return timeA - timeB;
  });

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nextClass = null;
  for (let c of todayClasses) {
    const startMins = c.startTime ? c.startTime[0] * 60 + c.startTime[1] : 0;
    if (startMins >= currentMinutes) {
      nextClass = c;
      break;
    }
  }
  if (!nextClass && todayClasses.length > 0 && todayClasses[0].status === 'ACTIVE') {
      nextClass = todayClasses[0]; // Currently active
  }
  if (!nextClass && schedule.length > 0) {
      nextClass = schedule.find(s => s.status !== 'COMPLETED'); // Just pick the first non-completed one
  }

  const formatTime = (t) => {
    if (!t || t.length < 2) return '';
    const d = new Date(); d.setHours(t[0], t[1]);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const upcomingAppt = appointments.find(a => a.status === 'APPROVED' || a.status === 'PENDING') || appointments[0];
  const upcomingEq = equipment.find(e => e.status !== 'RETURNED' && e.status !== 'CANCELLED') || equipment[0];
  const nearestEvent = events[0];
  
  const totalClasses = attendance.reduce((sum, a) => sum + a.totalClasses, 0);
  const totalPresent = attendance.reduce((sum, a) => sum + a.presentCount + a.lateCount + a.excusedCount, 0);
  const avgAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;

  return (
    <div className="student-overview-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {emergencies.length > 0 && (
        <div className="emergency-banner" style={{ backgroundColor: 'var(--status-error)', color: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={24} />
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>EMERGENCY ALERT: {emergencies[0].severity}</strong>
            <span>{emergencies[0].message}</span>
            {emergencies[0].location && <span style={{ display: 'block', fontSize: '0.9rem', opacity: 0.9 }}>Location: {emergencies[0].location}</span>}
          </div>
        </div>
      )}

      <div className="section-grid">
        <Panel title="Next Class" tag={nextClass?.status || 'Schedule'}>
          {nextClass ? (
            <div className="teacher-focus">
              <span>{nextClass.courseCode} - {nextClass.sectionName}</span>
              <strong>{nextClass.courseTitle}</strong>
              <p>{nextClass.dayOfWeek} • {formatTime(nextClass.startTime)} to {formatTime(nextClass.endTime)}</p>
              <p>Room: {nextClass.roomNumber} • {nextClass.teacherEmail}</p>
            </div>
          ) : (
            <p className="muted">No upcoming class found.</p>
          )}
        </Panel>

        <Panel title="Attendance Summary" tag={`${avgAttendance}% Overall`}>
          <div className="teacher-focus" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <strong style={{ fontSize: '2.5rem', color: avgAttendance >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>
              {avgAttendance}%
            </strong>
            <p>Overall Attendance</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <span>Present: {totalPresent}</span>
                <span>Total: {totalClasses}</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="section-grid">
        <Panel title="Today's Classes" tag={`${todayClasses.length} today`}>
          <Table
            headers={['Course', 'Time', 'Room', 'Status']}
            rows={todayClasses.map(c => [
              `${c.courseCode} [${c.sectionName}]`,
              formatTime(c.startTime),
              c.roomNumber,
              c.status === 'ACTIVE' ? 'IN PROGRESS' : c.status
            ])}
            empty="No classes scheduled for today."
          />
        </Panel>

        <Panel title="Upcoming Appointments & Requests" tag="Status">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Clock size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <strong>Office Hour</strong>
                {upcomingAppt ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {upcomingAppt.teacherName} • {upcomingAppt.dayOfWeek} {formatTime(upcomingAppt.startTime)} ({upcomingAppt.status})
                    </p>
                ) : <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>No upcoming appointments</p>}
              </div>
            </li>
            
            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Truck size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <strong>Equipment Request</strong>
                {upcomingEq ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {upcomingEq.equipment.name} • Status: {upcomingEq.status}
                    </p>
                ) : <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>No active requests</p>}
              </div>
            </li>

            <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Calendar size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <strong>Next Campus Event</strong>
                {nearestEvent ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {nearestEvent.title} • {new Date(nearestEvent.eventDate).toLocaleDateString()}
                    </p>
                ) : <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>No upcoming events</p>}
              </div>
            </li>
          </ul>
        </Panel>
      </div>

    </div>
  );
}
