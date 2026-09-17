import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  DoorOpen,
  User,
  BookOpen,
  X,
  Save,
  CheckCircle2,
  XCircle,
  Building2,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../../../../utils/api';
import { Panel, ActionButton, EmptyState } from '../../../shared/SharedComponents';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    courseId: '',
    teacherId: '',
    classroomId: '',
    sectionName: 'Section A',
    dayOfWeek: 'Sunday',
    startTime: '10:30',
    endTime: '12:00'
  });

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [schedulesRes, coursesRes, teachersRes, classroomsRes] = await Promise.all([
        api('/api/admin/schedules'),
        api('/api/admin/courses'),
        api('/api/admin/teachers'),
        api('/api/admin/classrooms')
      ]);
      setSchedules(dataOf(schedulesRes));
      setCourses(dataOf(coursesRes));
      setTeachers(dataOf(teachersRes));
      setClassrooms(dataOf(classroomsRes));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    const defaultCourseId = courses[0]?.id || '';
    const defaultTeacherId = teachers[0]?.id || '';
    const defaultClassroomId = classrooms[0]?.id || '';

    setFormData({
      id: null,
      courseId: defaultCourseId,
      teacherId: defaultTeacherId,
      classroomId: defaultClassroomId,
      sectionName: 'Section A',
      dayOfWeek: 'Sunday',
      startTime: '10:30',
      endTime: '12:00'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (schedule) => {
    const matchedTeacher = teachers.find(t =>
      (schedule.teacherId && Number(t.id) === Number(schedule.teacherId)) ||
      (schedule.teacherEmail && (t.loginIdentifier === schedule.teacherEmail || t.email === schedule.teacherEmail)) ||
      (schedule.teacherName && t.fullName === schedule.teacherName)
    );

    const matchedCourse = courses.find(c =>
      (schedule.courseId && Number(c.id) === Number(schedule.courseId)) ||
      (schedule.courseCode && c.courseCode === schedule.courseCode) ||
      (schedule.courseTitle && c.courseName === schedule.courseTitle)
    );

    const matchedRoom = classrooms.find(r =>
      (schedule.classroomId && Number(r.id) === Number(schedule.classroomId)) ||
      (schedule.roomNumber && r.roomNumber === schedule.roomNumber) ||
      (schedule.roomNumber && r.roomNumber && (
        r.roomNumber.toLowerCase().includes(schedule.roomNumber.toLowerCase()) ||
        schedule.roomNumber.toLowerCase().includes(r.roomNumber.toLowerCase())
      ))
    );

    const fallbackCourseId = courses[0]?.id || '';
    const fallbackTeacherId = teachers[0]?.id || '';
    const fallbackClassroomId = classrooms[0]?.id || '';

    setFormData({
      id: schedule.id,
      courseId: matchedCourse ? matchedCourse.id : (schedule.courseId || fallbackCourseId),
      teacherId: matchedTeacher ? matchedTeacher.id : (schedule.teacherId || fallbackTeacherId),
      classroomId: matchedRoom ? matchedRoom.id : (schedule.classroomId || fallbackClassroomId),
      sectionName: schedule.sectionName || 'Section A',
      dayOfWeek: schedule.dayOfWeek || 'Sunday',
      startTime: schedule.startTime ? schedule.startTime.slice(0, 5) : '10:30',
      endTime: schedule.endTime ? schedule.endTime.slice(0, 5) : '12:00'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);

    try {
      const courseId = Number(formData.courseId);
      const teacherId = Number(formData.teacherId);
      const classroomId = Number(formData.classroomId);

      if (!courseId || !teacherId || !classroomId) {
        throw new Error('Please select a valid Course, Instructor, and Classroom.');
      }

      const formattedStart = formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime;
      const formattedEnd = formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime;

      const payload = {
        courseId,
        teacherId,
        classroomId,
        sectionName: (formData.sectionName || 'Section A').trim(),
        dayOfWeek: formData.dayOfWeek || 'Sunday',
        startTime: formattedStart,
        endTime: formattedEnd
      };

      if (formData.id) {
        await api(`/api/admin/schedules/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: 'Class schedule updated successfully.' });
      } else {
        await api('/api/admin/schedules', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToastMessage({ type: 'success', text: 'New class schedule created successfully.' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to save schedule.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete or cancel this schedule?')) {
      return;
    }
    try {
      await api(`/api/admin/schedules/${id}`, { method: 'DELETE' });
      setToastMessage({ type: 'success', text: 'Schedule deleted/cancelled successfully.' });
      fetchData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete schedule.' });
    }
  };

  const filteredSchedules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schedules.filter(s => {
      const matchSearch = !q ||
        (s.courseCode && s.courseCode.toLowerCase().includes(q)) ||
        (s.courseTitle && s.courseTitle.toLowerCase().includes(q)) ||
        (s.teacherEmail && s.teacherEmail.toLowerCase().includes(q)) ||
        (s.teacherName && s.teacherName.toLowerCase().includes(q)) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q)) ||
        (s.sectionName && s.sectionName.toLowerCase().includes(q));

      const matchDay = dayFilter === 'ALL' || s.dayOfWeek === dayFilter;
      const matchStatus = statusFilter === 'ALL' || (s.status && s.status.toUpperCase() === statusFilter);

      return matchSearch && matchDay && matchStatus;
    });
  }, [schedules, search, dayFilter, statusFilter]);

  const uniqueCoursesCount = new Set(schedules.map(s => s.courseCode)).size;
  const uniqueTeachersCount = new Set(schedules.map(s => s.teacherEmail)).size;
  const uniqueRoomsCount = new Set(schedules.map(s => s.roomNumber)).size;

  const formatTimeSlot = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  };

  const getDayBadgeClass = (day) => {
    switch (day) {
      case 'Sunday': return 'day-badge day-sunday';
      case 'Monday': return 'day-badge day-monday';
      case 'Tuesday': return 'day-badge day-tuesday';
      case 'Wednesday': return 'day-badge day-wednesday';
      case 'Thursday': return 'day-badge day-thursday';
      case 'Friday': return 'day-badge day-friday';
      case 'Saturday': return 'day-badge day-saturday';
      default: return 'day-badge';
    }
  };

  return (
    <div className="academic-management-page">
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

      {/* Subview Metric Grid */}
      <div className="metric-grid">
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Total Schedules</span>
            <span className="metric-icon"><CalendarDays size={20} /></span>
          </div>
          <strong>{schedules.length}</strong>
          <div className="metric-card-foot">
            <span>{uniqueCoursesCount} Active Courses</span>
          </div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Faculty Assigned</span>
            <span className="metric-icon"><User size={20} /></span>
          </div>
          <strong>{uniqueTeachersCount}</strong>
          <div className="metric-card-foot">
            <span>Teaching Routine</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Rooms Utilized</span>
            <span className="metric-icon"><DoorOpen size={20} /></span>
          </div>
          <strong>{uniqueRoomsCount}</strong>
          <div className="metric-card-foot">
            <span>Smart Classrooms</span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div style={{ marginTop: '1.25rem' }}>
        <Panel
          title="Class Teaching Schedules"
          tag={`${filteredSchedules.length} SLOTS`}
          action={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            </div>
          }
        >
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <div className="admin-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search course code, title, instructor, or room..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                  <option value="ALL">All Days</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ACTIVE">Live / Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-toolbar-right">
              <ActionButton
                label="Create Schedule"
                icon={Plus}
                onClick={openCreateModal}
              />
            </div>
          </div>

          {loading ? (
            <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading schedule database...</p>
          ) : error ? (
            <div className="notice error">{error}</div>
          ) : filteredSchedules.length === 0 ? (
            <EmptyState
              title="No schedules found"
              message={search || dayFilter !== 'ALL' || statusFilter !== 'ALL' ? "No classes match your active filters." : "Create your first class schedule using the button above."}
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course Code & Title</th>
                    <th>Section</th>
                    <th>Faculty Instructor</th>
                    <th>Classroom</th>
                    <th>Day</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => {
                    const statusLower = (schedule.status || 'SCHEDULED').toLowerCase();
                    return (
                      <tr key={schedule.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <strong className="code-pill">{schedule.courseCode}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--tx-secondary)' }}>
                              {schedule.courseTitle}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="section-chip">{schedule.sectionName || 'Section A'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User size={14} style={{ color: 'var(--tx-muted)' }} />
                            <div>
                              <strong style={{ fontSize: '0.84rem' }}>{schedule.teacherName || schedule.teacherEmail}</strong>
                              {schedule.teacherName && (
                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--tx-muted)' }}>
                                  {schedule.teacherEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="room-pill">
                            <DoorOpen size={13} />
                            {schedule.roomNumber}
                          </span>
                        </td>
                        <td>
                          <span className={getDayBadgeClass(schedule.dayOfWeek)}>
                            {schedule.dayOfWeek}
                          </span>
                        </td>
                        <td>
                          <span className="time-pill">
                            <Clock size={12} />
                            {formatTimeSlot(schedule.startTime, schedule.endTime)}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-status-badge status-${statusLower}`}>
                            {schedule.status || 'SCHEDULED'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Edit Schedule"
                              onClick={() => handleEdit(schedule)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Delete Schedule"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash2 size={15} color="var(--rose)" />
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

      {/* Modal Dialog for Create/Edit */}
      {isModalOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={() => setIsModalOpen(false)}>
          <div
            className="profile-modal schedule-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="profile-modal-head">
              <div>
                <span>Academic Planning</span>
                <h2 id="modal-title">{formData.id ? 'Edit Class Schedule' : 'Create New Class Schedule'}</h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="standard-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Course *</label>
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} - {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Instructor / Teacher *</label>
                  <select
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.loginIdentifier || t.employeeId || 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Classroom *</label>
                  <select
                    name="classroomId"
                    value={formData.classroomId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Room...</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.roomNumber} ({c.roomType || ('Capacity: ' + (c.capacity || 40))})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Section Name *</label>
                  <input
                    type="text"
                    name="sectionName"
                    placeholder="e.g. Section A"
                    value={formData.sectionName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Day of Week *</label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                    required
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label>End Time *</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="profile-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  <Save size={16} /> {formData.id ? 'Update Schedule' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
