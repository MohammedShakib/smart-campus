import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { api } from '../../../utils/api';
import { prettyRole } from '../../../utils/helpers';
import { SectionHeader, Panel, ActionButton, StatRow } from '../../shared/SharedComponents';

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
    <div>
      <SectionHeader title="User Management" subtitle="Manage campus accounts, roles, and access status." />

      {message && <div className={`notice ${message.type}`} style={{ marginBottom: '1rem' }}>{message.text}</div>}

      <div className="section-grid">
        <Panel title="Account Statistics" tag="Overview">
          <div className="stat-list">
            <StatRow label="Total Users" value={totalUsers} color="accent" />
            <StatRow label="Students" value={totalStudents} color="emerald" />
            <StatRow label="Teachers" value={totalTeachers} color="sky" />
            <StatRow label="Disabled" value={totalDisabled} color="rose" />
          </div>
        </Panel>

        <div style={{ gridColumn: '1 / -1' }}>
          {(isCreating || editingUser) && (
            <UserForm
              user={editingUser}
              onClose={() => { setIsCreating(false); setEditingUser(null); }}
              onSuccess={() => { setIsCreating(false); setEditingUser(null); fetchUsers(); setMessage({ type: 'success', text: 'User saved successfully.' }); }}
              onError={(err) => setMessage({ type: 'error', text: err })}
            />
          )}

          <Panel title="User Directory" tag={`${users.length} accounts`}>
            <div className="toolbar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--tx-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by name, login, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '35px', width: '100%' }}
                />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
                <option value="">All Roles</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_TEACHER">Teacher</option>
                <option value="ROLE_STUDENT">Student</option>
                <option value="ROLE_SECURITY">Security</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
              <ActionButton label="Add User" icon={Plus} onClick={() => { setIsCreating(true); setEditingUser(null); }} />
            </div>

            {loading ? (
              <p className="muted">Loading users...</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
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
                    {users.length === 0 ? (
                      <tr><td colSpan="6" className="empty-cell">No users found. Try changing the search or filter.</td></tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id}>
                          <td><strong>{user.fullName}</strong></td>
                          <td>{user.studentOrEmpId || '-'}</td>
                          <td>{user.email}</td>
                          <td>{prettyRole(user.role)}</td>
                          <td>
                            <span className={`badge ${user.active ? 'badge--active' : 'badge--inactive'}`} style={user.active ? {backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)'} : {backgroundColor: 'rgba(244, 63, 94, 0.15)', color: 'var(--rose)'}}>
                              {user.active ? 'ACTIVE' : 'DISABLED'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button className="icon-btn" title="Edit" onClick={() => setEditingUser(user)}><Edit2 size={15} /></button>
                            {user.active ? (
                              <button className="icon-btn" title="Disable" onClick={() => toggleStatus(user.id, user.active)}><XCircle size={15} color="var(--rose)" /></button>
                            ) : (
                              <button className="icon-btn" title="Enable" onClick={() => toggleStatus(user.id, user.active)}><CheckCircle size={15} color="var(--emerald)" /></button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
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
    <Panel title={user ? "Edit User" : "Add New User"} tag="Form" style={{ marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
      <form onSubmit={handleSubmit} className="ticket-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', gridColumn: '1/-1' }}>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Full Name *</label>
            <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Login Identifier *</label>
            <input type="text" required disabled={!!user} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. teacher-demo" />
          </div>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>University / Employee ID</label>
            <input disabled={!!user} value={formData.studentOrEmpId} onChange={e => setFormData({...formData, studentOrEmpId: e.target.value})} placeholder="e.g. 011211001" />
          </div>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Role *</label>
            <select required disabled={!!user} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="ROLE_STUDENT">Student</option>
              <option value="ROLE_TEACHER">Teacher</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_SECURITY">Security</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Department</label>
            <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
          </div>
          {!user && (
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--tx-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Temporary Password *</label>
              <input type="password" required={!user} minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" />
            </div>
          )}
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="ghost-btn" onClick={onClose} disabled={saving}><X size={16} /> Cancel</button>
          <button type="submit" className="primary-btn" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save User'}</button>
        </div>
      </form>
    </Panel>
  );
}
