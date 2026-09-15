import React, { useState, useEffect, useCallback } from 'react';
import { Search, Presentation, Settings2, UserCog, CheckCircle2, Ban, Eye, Check, X, ShieldAlert, ArrowLeft, RefreshCw, Mail, Activity, MapPin, Building2, CalendarDays, Clock, Users } from 'lucide-react';
import { api, postAction } from '../../../utils/api';
import { SectionHeader, Panel, ActionButton, LoadingState, ErrorState } from '../../shared/SharedComponents';
import { initials } from '../../../utils/helpers';
import '../../../styles/dashboard.css';

export function AdminTeachersSection() {
  const [teachers, setTeachers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    
    // Load summary
    api('/api/admin/teachers/summary')
      .then(res => setSummary(res))
      .catch(err => console.error("Failed to load summary", err));
      
    // Load list
    let query = '?';
    if (search) query += `search=${encodeURIComponent(search)}&`;
    if (statusFilter) query += `active=${statusFilter === 'active'}&`;
    if (departmentFilter) query += `department=${encodeURIComponent(departmentFilter)}&`;
    
    api(`/api/admin/teachers${query}`)
      .then(res => {
        setTeachers(res);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, departmentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };
  
  const viewTeacherDetails = (id) => {
    setDetailLoading(true);
    api(`/api/admin/teachers/${id}`)
      .then(res => setSelectedTeacher(res))
      .catch(err => alert("Failed to load teacher details: " + err.message))
      .finally(() => setDetailLoading(false));
  };
  
  const toggleTeacherStatus = (id, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enable' : 'disable';
    if (confirm(`Are you sure you want to ${action} this teacher account?`)) {
      postAction(`/api/admin/teachers/${id}/status?active=${newStatus}`, () => {
        loadData();
        if (selectedTeacher && selectedTeacher.id === id) {
          viewTeacherDetails(id);
        }
      });
    }
  };

  if (selectedTeacher) {
    return (
      <TeacherDetailView 
        teacher={selectedTeacher} 
        onBack={() => setSelectedTeacher(null)} 
        onToggleStatus={() => toggleTeacherStatus(selectedTeacher.id, selectedTeacher.active)}
        onProfileUpdate={() => viewTeacherDetails(selectedTeacher.id)}
      />
    );
  }

  return (
    <div className="admin-teachers-page">
      <SectionHeader title="Teacher Management" subtitle="Manage faculty profiles, teaching assignments, schedules and account access." />
      
      {summary && (
        <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="metric-card metric-card--accounts">
            <div className="metric-card-head">
              <span>Total Teachers</span>
              <span className="metric-icon"><Presentation size={21} /></span>
            </div>
            <strong>{summary.totalTeachers}</strong>
            <div className="metric-card-foot"><span>All registered accounts</span></div>
          </div>
          <div className="metric-card metric-card--rooms">
            <div className="metric-card-head">
              <span>Active Accounts</span>
              <span className="metric-icon"><CheckCircle2 size={21} /></span>
            </div>
            <strong>{summary.activeTeachers}</strong>
            <div className="metric-card-foot"><span>Currently enabled</span></div>
          </div>
          <div className="metric-card metric-card--power">
            <div className="metric-card-head">
              <span>Disabled Accounts</span>
              <span className="metric-icon"><Ban size={21} /></span>
            </div>
            <strong>{summary.disabledTeachers}</strong>
            <div className="metric-card-foot"><span>Suspended or inactive</span></div>
          </div>
          <div className="metric-card metric-card--buses">
            <div className="metric-card-head">
              <span>Teachers With Classes</span>
              <span className="metric-icon"><Activity size={21} /></span>
            </div>
            <strong>{summary.teachersWithClasses}</strong>
            <div className="metric-card-foot"><span>Currently assigned courses</span></div>
          </div>
        </div>
      )}

      <Panel title="Teacher Directory" tag={teachers.length + " found"}>
        <div className="admin-students-toolbar">
          <form className="student-search-bar" onSubmit={handleSearch}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name, ID or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="primary-btn">Search</button>
            {(search || statusFilter || departmentFilter) && (
              <button type="button" className="ghost-btn" onClick={() => {
                setSearch(''); setStatusFilter(''); setDepartmentFilter('');
              }}>Clear</button>
            )}
          </form>
          <div className="student-filters">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
            <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Electrical & Electronic Engineering">EEE</option>
              <option value="Business Administration">BBA</option>
            </select>
            <button className="icon-btn" onClick={loadData} title="Refresh"><RefreshCw size={18} /></button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
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
                {teachers.map(teacher => (
                  <tr key={teacher.id} className={!teacher.active ? 'row-disabled' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar avatar-sm">{initials(teacher.fullName)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{teacher.fullName}</div>
                          <div className="muted" style={{ fontSize: '0.8rem' }}>{teacher.loginIdentifier}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{teacher.employeeId || '-'}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>{teacher.department || '-'}</div>
                    </td>
                    <td>{teacher.designation || '-'}</td>
                    <td>{teacher.classCount}</td>
                    <td>{teacher.studentCount}</td>
                    <td>
                      {teacher.active 
                        ? <span className="status-badge status-active"><CheckCircle2 size={12}/> Active</span> 
                        : <span className="status-badge status-disabled"><Ban size={12}/> Disabled</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="icon-btn" onClick={() => viewTeacherDetails(teacher.id)} title="View Profile" disabled={detailLoading}>
                          <Eye size={16} />
                        </button>
                        <button 
                          className={`icon-btn ${teacher.active ? 'text-danger' : 'text-success'}`} 
                          onClick={() => toggleTeacherStatus(teacher.id, teacher.active)}
                          title={teacher.active ? 'Disable Account' : 'Enable Account'}
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-cell">No teachers found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function TeacherDetailView({ teacher, onBack, onToggleStatus, onProfileUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: teacher.fullName || '',
    department: teacher.department || '',
    designation: teacher.designation || '',
    officeRoom: teacher.officeRoom || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    
    api(`/api/admin/teachers/${teacher.id}`, {
      method: 'PUT',
      body: JSON.stringify(formData)
    })
    .then(() => {
      setEditMode(false);
      onProfileUpdate();
    })
    .catch(err => alert(err.message))
    .finally(() => setSaving(false));
  };

  return (
    <div className="admin-teacher-detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="icon-btn" onClick={onBack} title="Back to Directory"><ArrowLeft size={20} /></button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--tx-primary)' }}>Teacher Profile</h2>
          <span className="muted" style={{ fontSize: '0.9rem' }}>Detailed view & management</span>
        </div>
      </div>

      <div className="section-grid admin-teacher-profile-grid">
        <Panel title="Identity & Profile" tag={teacher.active ? 'Active' : 'Disabled'}>
          {!editMode ? (
            <div className="student-profile-view">
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                  {initials(teacher.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{teacher.fullName}</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className={`status-badge ${teacher.active ? 'status-active' : 'status-disabled'}`}>
                      {teacher.active ? <><CheckCircle2 size={12}/> Active</> : <><Ban size={12}/> Disabled</>}
                    </span>
                    <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                      <CalendarDays size={14} /> Joined {new Date(teacher.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <Mail size={15} />
                  <div>
                    <span>Login / Email (Read-only)</span>
                    <strong>{teacher.loginIdentifier}</strong>
                  </div>
                </div>
                <div className="profile-info-item">
                  <UserCog size={15} />
                  <div>
                    <span>Employee ID (Read-only)</span>
                    <strong>{teacher.employeeId || '-'}</strong>
                  </div>
                </div>
                <div className="profile-info-item">
                  <Activity size={15} />
                  <div>
                    <span>Department</span>
                    <strong>{teacher.department || '-'}</strong>
                  </div>
                </div>
                <div className="profile-info-item">
                  <Presentation size={15} />
                  <div>
                    <span>Designation</span>
                    <strong>{teacher.designation || '-'}</strong>
                  </div>
                </div>
                <div className="profile-info-item">
                  <Building2 size={15} />
                  <div>
                    <span>Office Room</span>
                    <strong>{teacher.officeRoom || '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="action-row admin-teacher-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <ActionButton label="Edit Profile" icon={Settings2} onClick={() => setEditMode(true)} />
                <button className={`secondary-btn ${teacher.active ? 'btn-danger' : 'btn-success'}`} onClick={onToggleStatus}>
                  {teacher.active ? <><Ban size={16} /> Disable Account</> : <><CheckCircle2 size={16} /> Enable Account</>}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="ticket-form">
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Full Name</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Designation</label>
                <input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Office Room</label>
                <input value={formData.officeRoom} onChange={e => setFormData({...formData, officeRoom: e.target.value})} />
              </div>
              <div style={{ gridColumn: '1/-1', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <ShieldAlert size={16} style={{ color: 'var(--tx-warning)', marginBottom: '0.5rem', display: 'block' }} />
                <strong>Note:</strong> Email and Employee ID fields cannot be modified directly from this form to prevent breaking history and authentication logic.
              </div>
              <div className="action-row" style={{ gridColumn: '1/-1', marginTop: '1rem' }}>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="ghost-btn" onClick={() => setEditMode(false)} disabled={saving}>Cancel</button>
              </div>
            </form>
          )}
        </Panel>

        <div className="side-stack">
          <Panel title="Teaching Classes" tag={`${teacher.teachingAssignments.length} Assigned`}>
            {teacher.teachingAssignments.length > 0 ? (
              <div className="audit-log-list admin-teacher-teaching-list">
                {teacher.teachingAssignments.map((enr, i) => (
                  <div key={i} className="audit-entry" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{enr.courseCode}</strong>
                      <span className="muted" style={{ fontSize: '0.8rem' }}>{enr.courseTitle}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge--info">{enr.sectionName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ padding: '1rem 0' }}>No active class assignments.</p>
            )}
          </Panel>
          
          <Panel title="Weekly Schedule" tag={`${teacher.schedules.length} Slots`}>
            {teacher.schedules.length > 0 ? (
              <div className="audit-log-list admin-teacher-schedule">
                {teacher.schedules.map((slot, i) => (
                  <div key={i} className="audit-entry" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{slot.courseCode}</strong>
                      <span className="muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12}/> {slot.dayOfWeek} {slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={12}/> {slot.roomNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ padding: '1rem 0' }}>No weekly schedule found.</p>
            )}
          </Panel>

          <Panel title="Operations Summary">
            <div className="stat-list">
              <div className="stat-row">
                <span>Unique Enrolled Students</span>
                <strong style={{ color: 'var(--tx-primary)' }}>{teacher.studentCount}</strong>
              </div>
              <div className="stat-row">
                <span>Attendance Sessions Conducted</span>
                <strong style={{ color: 'var(--tx-success)' }}>{teacher.attendanceSummary.sessionsConducted}</strong>
              </div>
              <div className="stat-row">
                <span>Total Completed Sessions</span>
                <strong style={{ color: 'var(--tx-info)' }}>{teacher.attendanceSummary.completedSessions}</strong>
              </div>
            </div>
          </Panel>

          <Panel title="Office Hours" tag={`${teacher.officeHourSummary.upcomingSlotCount} Upcoming`}>
            {teacher.officeHourSummary.nextSlots.length > 0 ? (
              <div className="audit-log-list admin-teacher-office-hours">
                {teacher.officeHourSummary.nextSlots.map((slot, i) => (
                  <div key={i} className="audit-entry" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>{slot.date}</strong>
                      <span className="muted" style={{ fontSize: '0.8rem' }}>{slot.start} - {slot.end}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${slot.bookingStatus === 'AVAILABLE' ? 'badge--success' : 'badge--warning'}`}>{slot.bookingStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ padding: '1rem 0' }}>No upcoming office hours.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
