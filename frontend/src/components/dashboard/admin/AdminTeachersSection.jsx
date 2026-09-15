import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Presentation,
  Settings2,
  UserCog,
  CheckCircle2,
  Ban,
  Eye,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Mail,
  Activity,
  MapPin,
  Building2,
  CalendarDays,
  Clock
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel, LoadingState, ErrorState, EmptyState } from '../../shared/SharedComponents';
import { initials } from '../../../utils/helpers';
import '../../../styles/dashboard.css';

export function AdminTeachersSection() {
  const [teachers, setTeachers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('active', statusFilter === 'active');
      if (departmentFilter) params.set('department', departmentFilter);

      const query = params.toString();
      const [summaryData, departmentData, teacherData] = await Promise.all([
        api('/api/admin/teachers/summary'),
        api('/api/admin/teachers/departments'),
        api(`/api/admin/teachers${query ? `?${query}` : ''}`)
      ]);

      setSummary(summaryData);
      setDepartments(departmentData || []);
      setTeachers(teacherData || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, departmentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (event) => {
    event.preventDefault();
    setDebouncedSearch(search.trim());
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setMessage(null);
  };

  const viewTeacherDetails = async (id) => {
    setDetailLoading(true);
    setMessage(null);
    try {
      const detail = await api(`/api/admin/teachers/${id}`);
      setSelectedTeacher(detail);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleTeacherStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enabled' : 'disabled';
    setStatusBusyId(id);
    setMessage(null);
    try {
      await api(`/api/admin/teachers/${id}/status?active=${newStatus}`, { method: 'PATCH' });
      await loadData();
      if (selectedTeacher?.id === id) {
        const detail = await api(`/api/admin/teachers/${id}`);
        setSelectedTeacher(detail);
      }
      setMessage({ type: 'success', text: `Teacher account ${action}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStatusBusyId(null);
    }
  };

  if (selectedTeacher) {
    return (
      <TeacherDetailView
        teacher={selectedTeacher}
        message={message}
        onBack={() => setSelectedTeacher(null)}
        onToggleStatus={() => toggleTeacherStatus(selectedTeacher.id, selectedTeacher.active)}
        onMessage={setMessage}
        onTeacherUpdated={setSelectedTeacher}
        statusBusy={statusBusyId === selectedTeacher.id}
      />
    );
  }

  return (
    <div className="admin-management-page">
      <SectionHeader title="Teacher Management" subtitle="Manage faculty profiles, teaching assignments, schedules and account access." />
      <TeacherMessage message={message} />

      {summary && (
        <div className="metric-grid admin-teachers-summary">
          <TeacherMetric title="Total Teachers" value={summary.totalTeachers} note="All registered accounts" icon={Presentation} cardClass="metric-card--accounts" />
          <TeacherMetric title="Active Accounts" value={summary.activeTeachers} note="Currently enabled" icon={CheckCircle2} cardClass="metric-card--rooms" />
          <TeacherMetric title="Disabled Accounts" value={summary.disabledTeachers} note="Suspended or inactive" icon={Ban} cardClass="metric-card--power" />
          <TeacherMetric title="Teachers With Classes" value={summary.teachersWithClasses} note="Assigned active faculty" icon={Activity} cardClass="metric-card--buses" />
        </div>
      )}

      <Panel title="Teacher Directory" tag={`${teachers.length} found`}>
        <div className="admin-toolbar">
          <div className="admin-toolbar-left" style={{ flex: 1 }}>
            <form className="admin-search" onSubmit={handleSearch}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, ID or login..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" style={{ display: 'none' }}>Search</button>
            </form>
            <div className="admin-filter-group">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
            <div className="admin-filter-group">
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-toolbar-right">
            {(search || statusFilter || departmentFilter) && (
              <button type="button" className="ghost-btn" onClick={clearFilters}>Clear Filters</button>
            )}
            <button className="icon-btn" onClick={loadData} title="Refresh" type="button">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={loadData} />
        ) : teachers.length === 0 ? (
          <EmptyState title="No teachers found" message="Try changing the search or filter criteria." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teacher Info</th>
                  <th>ID & Dept</th>
                  <th>Designation</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className={!teacher.active ? 'row-disabled' : ''}>
                    <td>
                      <div className="admin-teacher-person">
                        <div className="avatar avatar-sm">{initials(teacher.fullName)}</div>
                        <div>
                          <div className="admin-teacher-name">{teacher.fullName}</div>
                          <div className="muted admin-teacher-subtext">{teacher.loginIdentifier}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-teacher-id">{teacher.employeeId || '-'}</div>
                      <div className="muted admin-teacher-subtext">{teacher.department || '-'}</div>
                    </td>
                    <td>{teacher.designation || '-'}</td>
                    <td>{teacher.classCount}</td>
                    <td>{teacher.studentCount}</td>
                    <td><StatusBadge active={teacher.active} /></td>
                    <td>
                      <div className="admin-teacher-row-actions">
                        <button className="icon-btn" onClick={() => viewTeacherDetails(teacher.id)} title="View Profile" disabled={detailLoading} type="button">
                          <Eye size={16} />
                        </button>
                        <button
                          className={`icon-btn ${teacher.active ? 'text-danger' : 'text-success'}`}
                          onClick={() => toggleTeacherStatus(teacher.id, teacher.active)}
                          title={teacher.active ? 'Disable Account' : 'Enable Account'}
                          disabled={statusBusyId === teacher.id}
                          type="button"
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </div>
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

function TeacherMetric({ title, value, note, icon: Icon, cardClass }) {
  return (
    <div className={`metric-card ${cardClass}`}>
      <div className="metric-card-head">
        <span>{title}</span>
        <span className="metric-icon"><Icon size={21} /></span>
      </div>
      <strong>{value}</strong>
      <div className="metric-card-foot"><span>{note}</span></div>
    </div>
  );
}

function TeacherDetailView({ teacher, message, onBack, onToggleStatus, onMessage, onTeacherUpdated, statusBusy }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: teacher.fullName || '',
    department: teacher.department || '',
    designation: teacher.designation || '',
    officeRoom: teacher.officeRoom || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      fullName: teacher.fullName || '',
      department: teacher.department || '',
      designation: teacher.designation || '',
      officeRoom: teacher.officeRoom || ''
    });
  }, [teacher]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    onMessage(null);
    try {
      const updated = await api(`/api/admin/teachers/${teacher.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      onTeacherUpdated(updated);
      setEditMode(false);
      onMessage({ type: 'success', text: 'Teacher profile updated.' });
    } catch (err) {
      onMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-teacher-detail">
      <div className="admin-teacher-detail-head">
        <button className="icon-btn" onClick={onBack} title="Back to Directory" type="button">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>Teacher Profile</h2>
          <span className="muted">Detailed view & management</span>
        </div>
      </div>

      <TeacherMessage message={message} />

      <div className="section-grid admin-teacher-detail-grid">
        <Panel title="Identity & Profile" tag={teacher.active ? 'Active' : 'Disabled'}>
          {!editMode ? (
            <div className="admin-teacher-profile">
              <div className="admin-teacher-profile-hero">
                <div className="avatar admin-teacher-avatar">{initials(teacher.fullName)}</div>
                <div>
                  <h3>{teacher.fullName}</h3>
                  <div className="admin-teacher-profile-meta">
                    <StatusBadge active={teacher.active} />
                    <span className="muted admin-teacher-joined">
                      <CalendarDays size={14} /> Joined {new Date(teacher.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-info-grid">
                <ProfileInfo icon={Mail} label="Login / Email (Read-only)" value={teacher.loginIdentifier} />
                <ProfileInfo icon={UserCog} label="Employee ID (Read-only)" value={teacher.employeeId || '-'} />
                <ProfileInfo icon={Activity} label="Department" value={teacher.department || '-'} />
                <ProfileInfo icon={Presentation} label="Designation" value={teacher.designation || '-'} />
                <ProfileInfo icon={Building2} label="Office Room" value={teacher.officeRoom || '-'} />
              </div>

              <div className="action-row admin-teacher-actions">
                <button className="primary-btn" onClick={() => setEditMode(true)} type="button">
                  <Settings2 size={16} /> Edit Profile
                </button>
                <button className={`secondary-btn ${teacher.active ? 'btn-danger' : 'btn-success'}`} onClick={onToggleStatus} disabled={statusBusy} type="button">
                  {teacher.active ? <><Ban size={16} /> Disable Account</> : <><CheckCircle2 size={16} /> Enable Account</>}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="ticket-form admin-teacher-form">
              <div className="admin-teacher-form-wide">
                <label className="form-label">Full Name</label>
                <input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <input value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Designation</label>
                <input value={formData.designation} onChange={(event) => setFormData({ ...formData, designation: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Office Room</label>
                <input value={formData.officeRoom} onChange={(event) => setFormData({ ...formData, officeRoom: event.target.value })} />
              </div>
              <div className="admin-teacher-identity-note">
                <ShieldAlert size={16} />
                <strong>Note:</strong> Login and Employee ID fields cannot be modified because they map to schedules, attendance, reservations, and logs.
              </div>
              <div className="action-row admin-teacher-form-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="ghost-btn" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
              </div>
            </form>
          )}
        </Panel>

        <div className="side-stack">
          <Panel title="Teaching Classes" tag={`${teacher.teachingAssignments.length} assigned`}>
            {teacher.teachingAssignments.length > 0 ? (
              <div className="audit-log-list admin-teacher-teaching-list">
                {teacher.teachingAssignments.map((assignment, index) => (
                  <div key={`${assignment.courseCode}-${assignment.sectionName}-${index}`} className="audit-entry admin-teacher-assignment">
                    <div>
                      <strong>{assignment.courseCode}</strong>
                      <span className="muted admin-teacher-subtext">{assignment.courseTitle}</span>
                    </div>
                    <span className="badge badge--info">{assignment.sectionName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted admin-teacher-empty-note">No active class assignments.</p>
            )}
          </Panel>

          <Panel title="Weekly Schedule" tag={`${teacher.schedules.length} slots`}>
            {teacher.schedules.length > 0 ? (
              <div className="audit-log-list admin-teacher-schedule">
                {teacher.schedules.map((slot, index) => (
                  <div key={`${slot.courseCode}-${slot.dayOfWeek}-${index}`} className="audit-entry admin-teacher-schedule-slot">
                    <div>
                      <strong>{slot.courseCode}</strong>
                      <span className="muted admin-teacher-subtext">
                        <Clock size={12} /> {slot.dayOfWeek} {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <span className="muted admin-teacher-subtext">
                      <MapPin size={12} /> {slot.roomNumber}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted admin-teacher-empty-note">No weekly schedule found.</p>
            )}
          </Panel>

          <Panel title="Operations Summary">
            <div className="stat-list">
              <StatCount label="Unique Enrolled Students" value={teacher.studentCount} className="admin-teacher-count-students" />
              <StatCount label="Attendance Sessions Conducted" value={teacher.attendanceSummary.sessionsConducted} className="admin-teacher-count-sessions" />
              <StatCount label="Total Completed Sessions" value={teacher.attendanceSummary.completedSessions} className="admin-teacher-count-completed" />
            </div>
          </Panel>

          <Panel title="Office Hours" tag={`${teacher.officeHourSummary.upcomingSlotCount} upcoming`}>
            {teacher.officeHourSummary.nextSlots.length > 0 ? (
              <div className="audit-log-list admin-teacher-office-hours">
                {teacher.officeHourSummary.nextSlots.map((slot, index) => (
                  <div key={`${slot.date}-${slot.start}-${index}`} className="audit-entry admin-teacher-office-slot">
                    <div>
                      <strong>{slot.date}</strong>
                      <span className="muted admin-teacher-subtext">{slot.start} - {slot.end}</span>
                    </div>
                    <span className={`badge ${slot.bookingStatus === 'AVAILABLE' ? 'badge--success' : 'badge--warning'}`}>{slot.bookingStatus}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted admin-teacher-empty-note">No upcoming office hours.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ProfileInfo({ icon: Icon, label, value }) {
  return (
    <div className="profile-info-item">
      <Icon size={15} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return active
    ? <span className="status-badge status-active"><CheckCircle2 size={12} /> Active</span>
    : <span className="status-badge status-disabled"><Ban size={12} /> Disabled</span>;
}

function StatCount({ label, value, className }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong className={className}>{value || 0}</strong>
    </div>
  );
}

function TeacherMessage({ message }) {
  if (!message) return null;
  return <div className={`admin-teacher-message admin-teacher-message--${message.type}`}>{message.text}</div>;
}
