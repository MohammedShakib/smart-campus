import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, Bell, BookOpen, Bus, Building2, CalendarCheck, CalendarDays,
  Camera, Car, ChevronRight, ClipboardCheck, Cpu, DoorOpen, FileText, FileWarning,
  GraduationCap, IdCard, KeyRound, LogOut, Mail, MapPin, MessageSquare, Presentation, QrCode,
  RadioTower, Save, Search, ShieldCheck, Upload, UsersRound, Wrench, X
} from 'lucide-react';
import { api } from '../utils/api';
import { initials, prettyRole } from '../utils/helpers';
import { ErrorState, LoadingState } from '../components/shared/SharedComponents';
import { DashboardSection } from '../components/dashboard/DashboardSection';
import smartCampusLogo from '../assets/smart-campus-logo.png';
import '../styles/dashboard.css';

const dashboardConfig = {
  admin: {
    label: 'Control Center',
    path: '/dashboard/admin',
    sections: [
      { key: 'overview',    label: 'Overview',          icon: Activity },
      { key: 'users',       label: 'Users',             icon: UsersRound },
      { key: 'students',    label: 'Students',          icon: GraduationCap },
      { key: 'teachers',    label: 'Teachers',          icon: Presentation },
      { key: 'equipment',   label: 'Lab & Equipment',   icon: Cpu },
      { key: 'classrooms',  label: 'Smart Classrooms',  icon: Building2 },
      { key: 'transport',   label: 'Transport',         icon: Bus },
      { key: 'maintenance', label: 'Maintenance',       icon: Wrench },
      { key: 'audit',       label: 'Audit Stack',       icon: FileText },
    ]
  },
  teacher: {
    label: 'Faculty Desk',
    path: '/dashboard/teacher',
    sections: [
      { key: 'overview',     label: 'Overview',              icon: Activity },
      { key: 'schedule',     label: 'My Schedule',           icon: CalendarDays },
      { key: 'classes',      label: 'My Classes',            icon: BookOpen },
      { key: 'students',     label: 'Students',              icon: GraduationCap },
      { key: 'attendance',   label: 'Attendance',            icon: ClipboardCheck },
      { key: 'excuses',      label: 'Absence Excuses',       icon: FileText },
      { key: 'officehours',  label: 'Office Hours & Queries', icon: MessageSquare },
      { key: 'reservations', label: 'Reserve Room',          icon: CalendarCheck },
      { key: 'notices',      label: 'Announcements',         icon: RadioTower },
      { key: 'reportIssue',  label: 'Report Issue',          icon: Wrench },
      { key: 'notifications',label: 'Notifications',         icon: Bell },
    ]
  },
  student: {
    label: 'Student Portal',
    path: '/dashboard/student',
    sections: [
      { key: 'overview',     label: 'Overview',             icon: Activity },
      { key: 'attendance',   label: 'Attendance & Excuses', icon: CalendarCheck },
      { key: 'lostfound',    label: 'Lost & Found Board',   icon: Search },
      { key: 'labequipment', label: 'Hardware & Lab',       icon: Cpu },
      { key: 'officehours',  label: 'Faculty Office Hours', icon: MessageSquare },
      { key: 'schedule',     label: 'Class Schedule',       icon: ClipboardCheck },
      { key: 'shuttle',      label: 'Shuttle Fleet',        icon: Bus },
      { key: 'tickets',      label: 'Support Tickets',      icon: Wrench },
    ]
  },
  security: {
    label: 'Security Command',
    path: '/dashboard/security',
    sections: [
      { key: 'overview',   label: 'Security Desk',       icon: ShieldCheck },
      { key: 'visitors',   label: 'Visitors & Passes',   icon: UsersRound },
      { key: 'scanner',    label: 'QR Pass Scanner',     icon: QrCode },
      { key: 'gate',       label: 'Gate Terminal',       icon: DoorOpen },
      { key: 'parking',    label: 'Parking Control',     icon: Car },
      { key: 'emergency',  label: 'Emergency Command',   icon: AlertTriangle },
      { key: 'incidents',  label: 'Incident Log',        icon: FileWarning },
      { key: 'campusmap',  label: 'Security Map',        icon: MapPin },
      { key: 'busfleet',   label: 'Bus Fleet',           icon: Bus },
    ]
  }
};

export function DashboardPage() {
  const role = window.location.pathname.split('/').pop() || 'student';
  const config = dashboardConfig[role] || dashboardConfig.student;
  const [activeSection, setActiveSection] = useState('overview');
  const [data, setData] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [error, setError] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  const loadDashboard = useCallback(() => {
    api(`/api/dashboard/${role}`)
      .then((res) => { setData(res.data); setTelemetry(res.data.telemetry); setError(null); })
      .catch((err) => { if (err.message === 'SESSION_REQUIRED') { window.location.href = '/login'; return; } setError(err.message); });
  }, [role]);

  const loadAuditLogs = useCallback(() => {
    api('/api/campus/logs?limit=20').then((res) => setAuditLogs(res?.data || [])).catch(() => {});
  }, []);

  const loadUnreadCount = useCallback(() => {
    if (role === 'teacher') {
      api('/api/teacher/notifications/unread-count').then((res) => {
        setUnreadNotifications(res.data?.count || 0);
      }).catch(() => {});
    }
  }, [role]);

  const decrementUnreadNotifications = useCallback((amount = 1) => {
    setUnreadNotifications((current) => Math.max(current - amount, 0));
  }, []);

  const clearUnreadNotifications = useCallback(() => {
    setUnreadNotifications(0);
  }, []);

  useEffect(() => {
    loadDashboard();
    if (role === 'admin') loadAuditLogs();
    if (role === 'teacher') loadUnreadCount();
    
    const telemetryTimer = setInterval(() => {
      api('/api/campus/telemetry').then((res) => setTelemetry(res.data)).catch(() => {});
    }, 4000);
    
    let notifTimer;
    if (role === 'teacher') {
      notifTimer = setInterval(() => {
        loadUnreadCount();
      }, 25000);
    }
    
    return () => {
      clearInterval(telemetryTimer);
      if (notifTimer) clearInterval(notifTimer);
    };
  }, [role, loadDashboard, loadAuditLogs, loadUnreadCount]);

  if (error) return <ErrorState error={error} />;
  if (!data || !telemetry) return <LoadingState />;

  const userName = data.user?.fullName || 'Smart Campus User';
  const displayName = userName.replace(/\s*\((Admin|Teacher|Student|Security)\)\s*$/i, '');
  const userRole = prettyRole(data.user?.role);
  const roleLabel = userRole === 'Admin' ? 'Administrator' : userRole;
  const profileImageUrl = data.user?.profileImageUrl;

  function updateUserPayload(userPayload) {
    setData((current) => current ? { ...current, user: { ...current.user, ...userPayload } } : current);
  }

  async function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileBusy(true);
    setProfileMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });
      const uploadPayload = await uploadResponse.json();
      if (!uploadPayload.success || !uploadPayload.data) {
        throw new Error(uploadPayload.message || 'Photo upload failed.');
      }
      const profilePayload = await api('/api/auth/profile', {
        method: 'POST',
        body: JSON.stringify({ profileImageUrl: uploadPayload.data })
      });
      updateUserPayload(profilePayload.data);
      setProfileMessage({ type: 'success', text: 'Profile photo updated.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileBusy(false);
      event.target.value = '';
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage(null);
    try {
      await api('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify(passwordForm)
      });
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setProfileMessage({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={smartCampusLogo} alt="Smart Campus" className="dashboard-brand-logo" />
          <div>
            <span>{config.label}</span>
          </div>
        </div>

        <nav>
          {config.sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`nav-item${activeSection === key ? ' active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <Icon size={18} />
              {label}
              {activeSection === key && <ChevronRight size={14} className="nav-chevron" />}
            </button>
          ))}
        </nav>

        <div className="user-card user-card--student">
          <button type="button" className="user-card-main user-card-trigger" onClick={() => setProfileOpen(true)}>
            <div className="avatar">
              {profileImageUrl ? <img src={profileImageUrl} alt="" /> : initials(displayName)}
            </div>
            <div>
              <strong>{displayName}</strong>
              <span>{roleLabel}</span>
            </div>
          </button>
          <a className="profile-logout" href="/logout" title="Logout" aria-label="Logout"><LogOut size={17} /></a>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              <span>{config.label}</span>
              <ChevronRight size={13} />
              <span className="breadcrumb-active">{config.sections.find(s => s.key === activeSection)?.label}</span>
            </div>
            <h1>{config.sections.find(s => s.key === activeSection)?.label}</h1>
          </div>
          <div className="topbar-actions">
            {role === 'teacher' && (
              <button className="topbar-bell" onClick={() => setActiveSection('notifications')} aria-label="Notifications">
                <Bell size={18} />
                {unreadNotifications > 0 && <span className="topbar-badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
              </button>
            )}
          </div>
        </header>

        <div className="content">
          <DashboardSection
            role={role} section={activeSection}
            data={data} telemetry={telemetry} auditLogs={auditLogs}
            reload={loadDashboard} reloadLogs={loadAuditLogs}
            setActiveSection={setActiveSection}
            onNotificationRead={decrementUnreadNotifications}
            onAllNotificationsRead={clearUnreadNotifications}
            refreshUnreadCount={loadUnreadCount}
          />
        </div>
      </section>

      {profileOpen && (
        <ProfileDialog
          user={data.user}
          displayName={displayName}
          roleLabel={roleLabel}
          profileImageUrl={profileImageUrl}
          busy={profileBusy}
          message={profileMessage}
          passwordForm={passwordForm}
          onClose={() => setProfileOpen(false)}
          onPhotoChange={handleProfilePhotoChange}
          onPasswordChange={handlePasswordChange}
          onPasswordFormChange={setPasswordForm}
        />
      )}
    </main>
  );
}

function ProfileDialog({
  user,
  displayName,
  roleLabel,
  profileImageUrl,
  busy,
  message,
  passwordForm,
  onClose,
  onPhotoChange,
  onPasswordChange,
  onPasswordFormChange
}) {
  return (
    <div className="profile-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="profile-modal-head">
          <div>
            <span>Smart Campus Profile</span>
            <h2 id="profile-title">Profile settings</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close profile settings">
            <X size={16} />
          </button>
        </header>

        <div className="profile-identity">
          <div className="profile-avatar-large">
            {profileImageUrl ? <img src={profileImageUrl} alt="" /> : initials(displayName)}
          </div>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
          <label className="profile-photo-btn">
            <Camera size={16} />
            <span>Change Photo</span>
            <input type="file" accept="image/*" onChange={onPhotoChange} disabled={busy} />
          </label>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <Mail size={15} />
            <div>
              <span>Email</span>
              <strong>{user?.email || '-'}</strong>
            </div>
          </div>
          <div className="profile-info-item">
            <IdCard size={15} />
            <div>
              <span>ID</span>
              <strong>{user?.studentOrEmpId || '-'}</strong>
            </div>
          </div>
          <div className="profile-info-item profile-info-item--wide">
            <Upload size={15} />
            <div>
              <span>Department</span>
              <strong>{user?.department || '-'}</strong>
            </div>
          </div>
        </div>

        <form className="profile-password-form" onSubmit={onPasswordChange}>
          <div className="profile-section-title">
            <KeyRound size={16} />
            <span>Password</span>
          </div>
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(event) => onPasswordFormChange({ ...passwordForm, currentPassword: event.target.value })}
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.newPassword}
            onChange={(event) => onPasswordFormChange({ ...passwordForm, newPassword: event.target.value })}
            minLength={6}
            required
          />
          <div className="profile-actions">
            <a className="ghost-btn" href="/login?forgot=true">
              Forgot password
            </a>
            <button className="primary-btn" type="submit" disabled={busy}>
              <Save size={16} /> Save Password
            </button>
          </div>
        </form>

        {message && <div className={`profile-message profile-message--${message.type}`}>{message.text}</div>}
      </section>
    </div>
  );
}
