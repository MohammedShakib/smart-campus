import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  GraduationCap,
  Settings2,
  UserCog,
  CheckCircle2,
  Ban,
  Eye,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Mail,
  CalendarDays,
  Activity,
  X
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel, LoadingState, ErrorState, EmptyState } from '../../shared/SharedComponents';
import { initials } from '../../../utils/helpers';
import '../../../styles/dashboard.css';

export function AdminStudentsSection() {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
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
      const [summaryData, departmentData, studentData] = await Promise.all([
        api('/api/admin/students/summary'),
        api('/api/admin/students/departments'),
        api(`/api/admin/students${query ? `?${query}` : ''}`)
      ]);

      setSummary(summaryData);
      setDepartments(departmentData || []);
      setStudents(studentData || []);
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

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [message]);

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

  const viewStudentDetails = async (id) => {
    setDetailLoading(true);
    setMessage(null);
    try {
      const detail = await api(`/api/admin/students/${id}`);
      setSelectedStudent(detail);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleStudentStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enabled' : 'disabled';
    setStatusBusyId(id);
    setMessage(null);
    try {
      await api(`/api/admin/students/${id}/status?active=${newStatus}`, { method: 'PATCH' });
      await loadData();
      if (selectedStudent?.id === id) {
        const detail = await api(`/api/admin/students/${id}`);
        setSelectedStudent(detail);
      }
      setMessage({ type: 'success', text: `Student account ${action}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStatusBusyId(null);
    }
  };

  if (selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        message={message}
        onBack={() => setSelectedStudent(null)}
        onToggleStatus={() => toggleStudentStatus(selectedStudent.id, selectedStudent.active)}
        onMessage={setMessage}
        onStudentUpdated={setSelectedStudent}
        statusBusy={statusBusyId === selectedStudent.id}
      />
    );
  }

  return (
    <div className="admin-management-page">
      <SectionHeader title="Student Management" subtitle="Manage ROLE_STUDENT accounts, view enrollments and monitor academic attendance." />
      <StudentMessage message={message} onDismiss={() => setMessage(null)} />

      {summary && (
        <div className="metric-grid admin-students-summary">
          <StudentMetric title="Total Students" value={summary.totalStudents} note="All registered accounts" icon={GraduationCap} cardClass="metric-card--accounts" />
          <StudentMetric title="Active Accounts" value={summary.activeStudents} note="Currently enabled" icon={CheckCircle2} cardClass="metric-card--rooms" />
          <StudentMetric title="Disabled Accounts" value={summary.disabledStudents} note="Suspended or inactive" icon={Ban} cardClass="metric-card--power" />
          <StudentMetric title="Enrolled Students" value={summary.enrolledStudents} note="Has active enrollments" icon={Activity} cardClass="metric-card--buses" />
        </div>
      )}

      <Panel title="Student Directory" tag={`${students.length} found`}>
        <div className="admin-toolbar">
          <div className="admin-toolbar-left" style={{ flex: 1 }}>
            <form className="admin-search" onSubmit={handleSearch}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, ID or email..."
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
        ) : students.length === 0 ? (
          <EmptyState title="No students found" message="Try changing the search or filter criteria." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>ID & Dept</th>
                  <th>Sem</th>
                  <th>Enrollments</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className={!student.active ? 'row-disabled' : ''}>
                    <td>
                      <div className="admin-student-person">
                        <div className="avatar avatar-sm">{initials(student.fullName)}</div>
                        <div>
                          <div className="admin-student-name">{student.fullName}</div>
                          <div className="muted admin-student-subtext">{student.loginIdentifier}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-student-id">{student.studentId || '-'}</div>
                      <div className="muted admin-student-subtext">{student.department || '-'}</div>
                    </td>
                    <td>{student.semester || '-'}</td>
                    <td>{student.enrolledCourseCount}</td>
                    <td><AttendanceBadge percentage={student.attendancePercentage} /></td>
                    <td><StatusBadge active={student.active} /></td>
                    <td>
                      <div className="admin-student-row-actions">
                        <button className="icon-btn" onClick={() => viewStudentDetails(student.id)} title="View Profile" disabled={detailLoading} type="button">
                          <Eye size={16} />
                        </button>
                        <button
                          className={`icon-btn ${student.active ? 'text-danger' : 'text-success'}`}
                          onClick={() => toggleStudentStatus(student.id, student.active)}
                          title={student.active ? 'Disable Account' : 'Enable Account'}
                          disabled={statusBusyId === student.id}
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

function StudentMetric({ title, value, note, icon: Icon, cardClass }) {
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

function StudentDetailView({ student, message, onBack, onToggleStatus, onMessage, onStudentUpdated, statusBusy }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: student.fullName || '',
    department: student.department || '',
    semester: student.semester || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      fullName: student.fullName || '',
      department: student.department || '',
      semester: student.semester || ''
    });
  }, [student]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [message, onMessage]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    onMessage(null);

    const payload = {
      ...formData,
      semester: formData.semester ? parseInt(formData.semester, 10) : null
    };

    try {
      const updated = await api(`/api/admin/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      onStudentUpdated(updated);
      setEditMode(false);
      onMessage({ type: 'success', text: 'Student profile updated.' });
    } catch (err) {
      onMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const attendance = student.attendanceSummary || {};

  return (
    <div className="admin-student-detail">
      <div className="admin-student-detail-head">
        <button className="icon-btn" onClick={onBack} title="Back to Directory" type="button">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>Student Profile</h2>
          <span className="muted">Detailed view & management</span>
        </div>
      </div>

      <StudentMessage message={message} onDismiss={() => onMessage(null)} />

      <div className="section-grid admin-student-detail-grid">
        <Panel title="Identity & Profile" tag={student.active ? 'Active' : 'Disabled'}>
          {!editMode ? (
            <div className="admin-student-profile">
              <div className="admin-student-profile-hero">
                <div className="avatar admin-student-avatar">{initials(student.fullName)}</div>
                <div>
                  <h3>{student.fullName}</h3>
                  <div className="admin-student-profile-meta">
                    <StatusBadge active={student.active} />
                    <span className="muted admin-student-joined">
                      <CalendarDays size={14} /> Joined {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-info-grid">
                <ProfileInfo icon={Mail} label="Login / Email (Read-only)" value={student.loginIdentifier} />
                <ProfileInfo icon={UserCog} label="Student ID (Read-only)" value={student.studentId || '-'} />
                <ProfileInfo icon={Activity} label="Department" value={student.department || '-'} />
                <ProfileInfo icon={GraduationCap} label="Semester" value={student.semester || '-'} />
              </div>

              <div className="action-row admin-student-actions">
                <button className="primary-btn" onClick={() => setEditMode(true)} type="button">
                  <Settings2 size={16} /> Edit Profile
                </button>
                <button className={`secondary-btn ${student.active ? 'btn-danger' : 'btn-success'}`} onClick={onToggleStatus} disabled={statusBusy} type="button">
                  {student.active ? <><Ban size={16} /> Disable Account</> : <><CheckCircle2 size={16} /> Enable Account</>}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="ticket-form admin-student-form">
              <div className="admin-student-form-wide">
                <label className="form-label">Full Name</label>
                <input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <input value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} />
              </div>
              <div>
                <label className="form-label">Semester (Numeric)</label>
                <input type="number" min="1" max="20" value={formData.semester} onChange={(event) => setFormData({ ...formData, semester: event.target.value })} />
              </div>
              <div className="admin-student-identity-note">
                <ShieldAlert size={16} />
                <strong>Note:</strong> Email and Student ID fields cannot be modified because they map to existing academic records, attendances, and logs.
              </div>
              <div className="action-row admin-student-form-actions">
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="ghost-btn" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
              </div>
            </form>
          )}
        </Panel>

        <div className="side-stack">
          <Panel title="Academic Enrollments" tag={`${student.enrollments.length} active`}>
            {student.enrollments.length > 0 ? (
              <div className="audit-log-list">
                {student.enrollments.map((enrollment, index) => (
                  <div key={`${enrollment.courseCode}-${enrollment.sectionName}-${index}`} className="audit-entry admin-student-enrollment">
                    <div>
                      <strong>{enrollment.courseCode}</strong>
                      <span className="muted admin-student-subtext">{enrollment.sectionName}</span>
                    </div>
                    <div className="admin-student-enrollment-teacher">
                      <span className="muted admin-student-subtext">Instructor</span>
                      <span>{enrollment.teacherName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted admin-student-empty-note">No active course enrollments.</p>
            )}
          </Panel>

          <Panel title="Global Attendance Summary" tag="All Courses">
            <div className="stat-list admin-student-attendance">
              <div className="stat-row">
                <span>Overall Percentage</span>
                <AttendanceBadge percentage={attendance.attendancePercentage} large />
              </div>
              <StatCount label="Total Present" value={attendance.presentCount} className="admin-student-count-present" />
              <StatCount label="Total Late" value={attendance.lateCount} className="admin-student-count-late" />
              <StatCount label="Total Absent" value={attendance.absentCount} className="admin-student-count-absent" />
            </div>
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

function AttendanceBadge({ percentage, large = false }) {
  if (percentage == null) {
    return <span className={`badge badge--neutral${large ? ' admin-student-attendance-badge' : ''}`}>N/A</span>;
  }

  const tone = percentage >= 80 ? 'badge--success' : percentage >= 60 ? 'badge--warning' : 'badge--danger';
  return <span className={`badge ${tone}${large ? ' admin-student-attendance-badge' : ''}`}>{percentage}%</span>;
}

function StatCount({ label, value, className }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong className={className}>{value || 0}</strong>
    </div>
  );
}

function StudentMessage({ message, onDismiss }) {
  if (!message) return null;
  const Icon = message.type === 'error' ? ShieldAlert : CheckCircle2;
  return (
    <div className={`admin-toast admin-toast--${message.type}`} role="status" aria-live="polite">
      <Icon size={18} />
      <span>{message.text}</span>
      <button type="button" className="admin-toast-close" onClick={onDismiss} title="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}
