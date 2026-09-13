import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Bus, Building2, ChevronRight, ClipboardCheck, DoorOpen, FileText, LogOut, RadioTower, RefreshCw, UsersRound, Wrench } from 'lucide-react';
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
      { key: 'overview',    label: 'Overview',         icon: Activity },
      { key: 'classrooms',  label: 'Smart Classrooms', icon: Building2 },
      { key: 'transport',   label: 'Transport',        icon: Bus },
      { key: 'maintenance', label: 'Maintenance',      icon: Wrench },
      { key: 'audit',       label: 'Audit Stack',      icon: FileText },
    ]
  },
  teacher: {
    label: 'Faculty Desk',
    path: '/dashboard/teacher',
    sections: [
      { key: 'overview',     label: 'Overview',       icon: Activity },
      { key: 'classrooms',   label: 'Classrooms',     icon: Building2 },
      { key: 'notices',      label: 'Announcements',  icon: RadioTower },
    ]
  },
  student: {
    label: 'Student Portal',
    path: '/dashboard/student',
    sections: [
      { key: 'overview', label: 'Overview',        icon: Activity },
      { key: 'schedule', label: 'Schedule',        icon: ClipboardCheck },
      { key: 'shuttle',  label: 'Shuttle',         icon: Bus },
      { key: 'tickets',  label: 'Support Tickets', icon: Wrench },
    ]
  },
  security: {
    label: 'Security Post',
    path: '/dashboard/security',
    sections: [
      { key: 'overview',  label: 'Overview',    icon: Activity },
      { key: 'gate',      label: 'Gate Access', icon: DoorOpen },
      { key: 'visitors',  label: 'Visitor Log', icon: UsersRound },
      { key: 'busfleet',  label: 'Bus Fleet',   icon: Bus },
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
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(() => {
    api(`/api/dashboard/${role}`)
      .then((res) => { setData(res.data); setTelemetry(res.data.telemetry); setError(null); })
      .catch((err) => { if (err.message === 'SESSION_REQUIRED') { window.location.href = '/login'; return; } setError(err.message); });
  }, [role]);

  const loadAuditLogs = useCallback(() => {
    api('/api/campus/logs?limit=20').then((res) => setAuditLogs(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboard();
    if (role === 'admin') loadAuditLogs();
    const timer = setInterval(() => {
      api('/api/campus/telemetry').then((res) => setTelemetry(res.data)).catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [role, loadDashboard, loadAuditLogs]);

  if (error) return <ErrorState error={error} />;
  if (!data || !telemetry) return <LoadingState />;

  const userName = data.user?.fullName || 'Smart Campus User';
  const displayName = userName.replace(/\s*\((Admin|Teacher|Student|Security)\)\s*$/i, '');
  const userRole = prettyRole(data.user?.role);
  const roleLabel = userRole === 'Admin' ? 'Administrator' : userRole;

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

        <div className="user-card">
          <div className="avatar">{initials(displayName)}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
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
            <span className="health"><Activity size={15} /> {telemetry.systemStatus}</span>
            <button type="button" className="icon-btn" onClick={loadDashboard} title="Refresh" aria-label="Refresh dashboard"><RefreshCw size={15} /></button>
            <a className="logout" href="/logout"><LogOut size={16} /> Logout</a>
          </div>
        </header>

        <div className="content">
          <DashboardSection
            role={role} section={activeSection}
            data={data} telemetry={telemetry} auditLogs={auditLogs}
            reload={loadDashboard} reloadLogs={loadAuditLogs}
          />
        </div>
      </section>
    </main>
  );
}
