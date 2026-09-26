import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { api } from '../../../utils/api';
import { prettyRole } from '../../../utils/helpers';
import { SectionHeader, Panel, ActionButton, EmptyState } from '../../shared/SharedComponents';

export function AdminUsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (roleFilter) params.append('role', roleFilter);
    if (statusFilter !== '') params.append('status', statusFilter);

    api(`/api/admin/users?${params.toString()}`)
      .then(res => {
        setUsers(res || []);
        setMessage(null);
      })
      .catch(err => setMessage({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = (id, currentStatus) => {
    api(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !currentStatus })
    })
      .then(res => {
        setMessage({ type: 'success', text: res.message });
        fetchUsers();
      })
      .catch(err => setMessage({ type: 'error', text: err.message }));
  };

  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'ROLE_STUDENT').length;
  const totalTeachers = users.filter(u => u.role === 'ROLE_TEACHER').length;
  const totalDisabled = users.filter(u => !u.active).length;

  return (
    <div className="admin-management-page">
      <SectionHeader title="User Management" subtitle="Manage campus accounts, roles, and access status." />

      {message && <div className={`notice ${message.type}`} style={{ marginBottom: '1rem' }}>{message.text}</div>}

      <div className="metric-grid">
        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head"><span>Total Users</span></div>
          <strong>{totalUsers}</strong>
        </div>
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head"><span>Students</span></div>
          <strong>{totalStudents}</strong>
        </div>
        <div className="metric-card metric-card--buses">
          <div className="metric-card-head"><span>Teachers</span></div>
          <strong>{totalTeachers}</strong>
        </div>
        <div className="metric-card metric-card--power">
          <div className="metric-card-head"><span>Disabled</span></div>
          <strong>{totalDisabled}</strong>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
          {(isCreating || editingUser) && (
            <UserForm
              user={editingUser}
              onClose={() => { setIsCreating(false); setEditingUser(null); }}
              onSuccess={() => { setIsCreating(false); setEditingUser(null); fetchUsers(); setMessage({ type: 'success', text: 'User saved successfully.' }); }}
              onError={(err) => setMessage({ type: 'error', text: err })}
            />
          )}

          <Panel title="User Directory" tag={`${users.length} ACCOUNTS`}>
            <div className="admin-toolbar">
              <div className="admin-toolbar-left" style={{ flex: 1 }}>
                <div className="admin-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, login, or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="admin-filter-group">
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="ROLE_ADMIN">Admin</option>
                    <option value="ROLE_TEACHER">Teacher</option>
                    <option value="ROLE_STUDENT">Student</option>
                    <option value="ROLE_SECURITY">Security</option>
                  </select>
                </div>
                <div className="admin-filter-group">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="admin-toolbar-right">
                <ActionButton label="Add User" icon={Plus} onClick={() => { setIsCreating(true); setEditingUser(null); }} />
              </div>
            </div>

            {loading ? (
              <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading users...</p>
            ) : users.length === 0 ? (
              <EmptyState title="No users found" message="Try changing the search or filter criteria." />
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const roleClass = user.role.toLowerCase().replace('role_', 'role-');
                      return (
                        <tr key={user.id}>
                          <td><strong>{user.fullName}</strong></td>
                          <td>{user.studentOrEmpId || '-'}</td>
                          <td>{user.email}</td>
                          <td><span className={`admin-role-badge ${roleClass}`}>{prettyRole(user.role)}</span></td>
                          <td>
                            <span className={`admin-status-badge ${user.active ? 'status-active' : 'status-disabled'}`}>
                              {user.active ? 'ACTIVE' : 'DISABLED'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button className="icon-btn" title="Edit" onClick={() => setEditingUser(user)}><Edit2 size={15} /></button>
                            {user.active ? (
                              <button className="icon-btn text-danger" title="Disable" onClick={() => toggleStatus(user.id, user.active)}><XCircle size={15} /></button>
                            ) : (
                              <button className="icon-btn text-success" title="Enable" onClick={() => toggleStatus(user.id, user.active)}><CheckCircle size={15} /></button>
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

function UserForm({ user, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState(user ? {
    fullName: user.fullName || '',
    email: user.email || '',
    studentOrEmpId: user.studentOrEmpId || '',
    department: user.department || '',
    role: user.role || 'ROLE_STUDENT',
  } : {
    fullName: '',
    email: '',
    studentOrEmpId: '',
    department: '',
    role: 'ROLE_STUDENT',
    password: ''
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const isEdit = !!user;
    const endpoint = isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    api(endpoint, {
      method,
      body: JSON.stringify(formData)
    })
      .then(() => onSuccess())
      .catch(err => onError(err.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{user ? "Edit User" : "Add New User"}</h3>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>Full Name *</label>
            <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="admin-form-group">
            <label>Login Identifier *</label>
            <input type="text" required disabled={!!user} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. teacher-demo" />
          </div>
          <div className="admin-form-group">
            <label>University / Employee ID</label>
            <input disabled={!!user} value={formData.studentOrEmpId} onChange={e => setFormData({...formData, studentOrEmpId: e.target.value})} placeholder="e.g. 011211001" />
          </div>
          <div className="admin-form-group">
            <label>Role *</label>
            <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="ROLE_STUDENT">Student</option>
              <option value="ROLE_TEACHER">Teacher</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_SECURITY">Security</option>
            </select>
          </div>
          <div className="admin-form-group" style={{ gridColumn: '1/-1' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--tx-muted)' }}>
              Note: Login Identifier and ID are immutable. Role changes for accounts with existing academic/operational data will be blocked by the backend to prevent data corruption.
            </span>
          </div>
          <div className="admin-form-group">
            <label>Department</label>
            <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
          </div>
          {!user && (
            <div className="admin-form-group">
              <label>Temporary Password *</label>
              <input type="password" required={!user} minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" />
            </div>
          )}
        </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="ghost-btn" onClick={onClose} disabled={saving}><X size={16} /> Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
