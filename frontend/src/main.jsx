import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Bus,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Database,
  DoorOpen,
  FileText,
  Layers,
  Loader2,
  LockKeyhole,
  LogOut,
  RadioTower,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench
} from 'lucide-react';
import './styles.css';

const projectName = 'Smart Campus';

const demoAccounts = {
  admin: ['admin-demo', 'demo-admin-pass'],
  teacher: ['teacher-demo', 'demo-teacher-pass'],
  student: ['student-demo', 'demo-student-pass'],
  security: ['security-demo', 'demo-security-pass']
};

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

function api(path, options = {}) {
  return fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  }).then(async (response) => {
    if (response.status === 401 || response.status === 403) throw new Error('SESSION_REQUIRED');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  });
}

function App() {
  const path = window.location.pathname;
  if (path.startsWith('/dashboard')) return <DashboardApp />;
  return <AuthPage />;
}

/* ─────────────────────────────────────────────────────────
   CAMPUS NETWORK SVG
───────────────────────────────────────────────────────── */
function CampusGraph() {
  const nodes = [
    { id: 'hub',  x: 248, y: 148, r: 11, type: 'hub',  label: 'Campus Core' },
    { id: 'rA',   x: 82,  y: 62,  r: 6,  type: 'room', label: 'Block A' },
    { id: 'rB',   x: 92,  y: 225, r: 6,  type: 'room', label: 'Library' },
    { id: 'rC',   x: 168, y: 42,  r: 5,  type: 'room', label: 'Lab 3' },
    { id: 'b1',   x: 402, y: 68,  r: 6,  type: 'bus',  label: 'Bus Depot' },
    { id: 'b2',   x: 432, y: 162, r: 6,  type: 'bus',  label: 'Route 02' },
    { id: 'gA',   x: 360, y: 252, r: 6,  type: 'gate', label: 'Main Gate' },
    { id: 'gB',   x: 148, y: 258, r: 6,  type: 'gate', label: 'East Gate' },
    { id: 'tech', x: 375, y: 112, r: 5,  type: 'room', label: 'Tech Hub' },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[1,2],[4,8],[4,5]];
  const colors = { hub: '#818cf8', room: '#10b981', bus: '#0ea5e9', gate: '#a78bfa' };

  return (
    <svg viewBox="0 0 520 310" className="campus-graph-svg" aria-hidden="true">
      <defs>
        {edges.map(([ai, bi], i) => {
          const a = nodes[ai], b = nodes[bi];
          return <path key={i} id={`ep${i}`} d={`M${a.x},${a.y} L${b.x},${b.y}`} fill="none" />;
        })}
        <filter id="glow-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-lg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="248" cy="148" rx="200" ry="150" fill="url(#bgGrad)" />
      <g opacity="0.06">
        {Array.from({length: 11}, (_, row) =>
          Array.from({length: 19}, (_, col) => (
            <circle key={`${row}-${col}`} cx={col * 28 + 14} cy={row * 28 + 14} r="1.2" fill="#e2e8f0" />
          ))
        )}
      </g>
      {edges.map(([ai, bi], i) => {
        const a = nodes[ai], b = nodes[bi];
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(99,102,241,0.35)" strokeWidth="1" strokeDasharray="3 7" className="graph-edge" />;
      })}
      {edges.map(([ai, bi], i) => (
        <circle key={`pkt${i}`} r="2.2" fill={colors.hub} filter="url(#glow-sm)">
          <animate attributeName="opacity" values="0;0.9;0.9;0" dur={`${1.7 + i * 0.22}s`} repeatCount="indefinite" begin={`${i * 0.38}s`} />
          <animateMotion dur={`${1.7 + i * 0.22}s`} repeatCount="indefinite" begin={`${i * 0.38}s`}>
            <mpath href={`#ep${i}`} />
          </animateMotion>
        </circle>
      ))}
      {nodes.map((node) => {
        const color = colors[node.type];
        const isHub = node.type === 'hub';
        const labelRight = node.x > 260;
        const isCenter = node.id === 'hub';
        return (
          <g key={node.id}>
            {isHub && (
              <>
                <circle cx={node.x} cy={node.y} r="30" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3" className="pulse-ring-1" />
                <circle cx={node.x} cy={node.y} r="21" fill="none" stroke={color} strokeWidth="1" opacity="0.5" className="pulse-ring-2" />
              </>
            )}
            <circle cx={node.x} cy={node.y} r={isHub ? 11 : node.r} fill={color} opacity="0.88"
              filter={`url(#glow-${isHub ? 'lg' : 'sm'})`}
              className={isHub ? 'hub-node' : 'leaf-node'}
            />
            <circle cx={node.x} cy={node.y} r={isHub ? 4.5 : 2.2} fill="white" opacity="0.75" />
            <text
              x={isCenter ? node.x : (labelRight ? node.x + node.r + 7 : node.x - node.r - 7)}
              y={isCenter ? node.y + node.r + 14 : node.y + 3.5}
              textAnchor={isCenter ? 'middle' : (labelRight ? 'start' : 'end')}
              fill="#475569"
              fontSize={isHub ? '9.5' : '8'}
              fontFamily="Inter, sans-serif"
              fontWeight={isHub ? '600' : '500'}
            >{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   AUTH PAGE
───────────────────────────────────────────────────────── */
function AuthPage() {
  const query = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState('login');
  const [roles, setRoles] = useState([]);
  const [registerForm, setRegisterForm] = useState({
    fullName: '', email: '', password: '', studentOrEmpId: '',
    department: 'Computer Science & Engineering', role: 'ROLE_STUDENT'
  });
  const [registerMessage, setRegisterMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api('/api/auth/me').then((res) => setRoles(res?.data?.roles || [])).catch(() => setRoles([]));
  }, []);

  const status = useMemo(() => {
    if (query.get('error')) return { type: 'error', text: 'Invalid email/ID or password. Use a demo account or try again.' };
    if (query.get('logout')) return { type: 'success', text: 'You have been logged out securely from Smart Campus.' };
    if (query.get('registered')) return { type: 'success', text: 'Account created! You can now sign in.' };
    return registerMessage;
  }, [query, registerMessage]);

  function fillDemo(role) {
    const [email, password] = demoAccounts[role];
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
  }

  function submitRegister(event) {
    event.preventDefault();
    setRegisterMessage(null);
    setIsSubmitting(true);
    api('/api/auth/register', { method: 'POST', body: JSON.stringify(registerForm) })
      .then((res) => {
        setIsSubmitting(false);
        if (!res.success) { setRegisterMessage({ type: 'error', text: res.message }); return; }
        setActiveTab('login');
        setRegisterMessage({ type: 'success', text: res.message });
      })
      .catch((error) => { setIsSubmitting(false); setRegisterMessage({ type: 'error', text: error.message }); });
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-panel-inner">
          <div className="brand-top">
            <div className="brand-mark">SC</div>
            <div>
              <p className="eyebrow">United International University</p>
              <h1>{projectName}</h1>
            </div>
          </div>
          <div className="campus-viz-wrap"><CampusGraph /></div>
          <div className="brand-message">
            <span className="system-pill"><Activity size={13} /> Online &amp; synchronized</span>
            <h2>One campus.<br />One intelligent system.</h2>
            <p>Classrooms, shuttle GPS, gate access and maintenance — all in one secure portal.</p>
          </div>
          <div className="stat-row">
            <div className="stat-chip"><Building2 size={13} /><strong>42</strong><span>Rooms</span></div>
            <div className="stat-chip stat-chip--bus"><Bus size={13} /><strong>6</strong><span>Buses Live</span></div>
            <div className="stat-chip stat-chip--gate"><DoorOpen size={13} /><strong>12</strong><span>Gates Active</span></div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="mini-pill"><Sparkles size={13} /> ReactJS Frontend</span>
            <h2>{activeTab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{activeTab === 'login' ? 'Access your campus dashboard with your university credentials.' : 'Join Smart Campus and access your role-specific dashboard.'}</p>
          </div>

          <div className="demo-bar">
            <span className="demo-label"><span className="demo-dot" />Quick demo access</span>
            <div className="demo-actions">
              {Object.keys(demoAccounts).map((role) => (
                <button type="button" key={role} className="demo-btn"
                  onClick={() => { setActiveTab('login'); fillDemo(role); }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="tabs">
            <button type="button" className={activeTab === 'login' ? 'active' : ''} onClick={() => setActiveTab('login')}>Sign In</button>
            <button type="button" className={activeTab === 'register' ? 'active' : ''} onClick={() => setActiveTab('register')}>Register</button>
          </div>

          {status && <div className={`notice ${status.type}`} role="alert">{status.text}</div>}

          {activeTab === 'login' ? (
            <form className="form-stack" action="/login" method="post" onSubmit={() => setIsSubmitting(true)}>
              <div className="field-group">
                <label htmlFor="loginEmail">University Email or ID</label>
                <div className="input-wrap">
                  <UserRound size={15} className="input-icon" />
                  <input id="loginEmail" name="email" autoComplete="username" defaultValue="admin-demo" placeholder="your-id@uiu.ac.bd" required />
                </div>
              </div>
              <div className="field-group">
                <div className="label-row">
                  <label htmlFor="loginPassword">Password</label>
                  <button type="button" className="show-hide-btn" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                <div className="input-wrap">
                  <LockKeyhole size={15} className="input-icon" />
                  <input id="loginPassword" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" defaultValue="demo-admin-pass" placeholder="••••••••" required />
                </div>
              </div>
              <button className="primary-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={16} className="spin" /> Signing in…</> : <><LockKeyhole size={16} /> Sign In</>}
              </button>
              <p className="form-footer">New to Smart Campus?{' '}<button type="button" className="text-link" onClick={() => setActiveTab('register')}>Create an account</button></p>
            </form>
          ) : (
            <form className="form-stack" onSubmit={submitRegister}>
              <div className="field-group">
                <label>Full Name</label>
                <div className="input-wrap">
                  <UserRound size={15} className="input-icon" />
                  <input required placeholder="Your full name" value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="field-group">
                  <label>UIU Email</label>
                  <div className="input-wrap">
                    <input required type="email" placeholder="you@uiu.ac.bd" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="field-group">
                  <label>Student / Employee ID</label>
                  <div className="input-wrap">
                    <input required placeholder="011XXXXXX" value={registerForm.studentOrEmpId} onChange={(e) => setRegisterForm({ ...registerForm, studentOrEmpId: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="field-group">
                  <label>Department</label>
                  <div className="input-wrap">
                    <select value={registerForm.department} onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}>
                      <option>Computer Science &amp; Engineering</option>
                      <option>Electrical &amp; Electronic Engineering</option>
                      <option>School of Business &amp; Economics</option>
                      <option>Civil Engineering</option>
                      <option>Campus Administration &amp; Operations</option>
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label>Role</label>
                  <div className="input-wrap">
                    <select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                      {(roles.length ? roles : [{ value: 'ROLE_STUDENT', label: 'Student / Learner' }]).map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label>Password</label>
                <div className="input-wrap">
                  <LockKeyhole size={15} className="input-icon" />
                  <input required type="password" minLength={6} placeholder="Min. 6 characters" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
                </div>
              </div>
              <button className="primary-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={16} className="spin" /> Creating account…</> : <><UserRound size={16} /> Create Account</>}
              </button>
              <p className="form-footer">Already have an account?{' '}<button type="button" className="text-link" onClick={() => setActiveTab('login')}>Sign in</button></p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
   DASHBOARD APP — with full section-based navigation
───────────────────────────────────────────────────────── */
function DashboardApp() {
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

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">SC</div>
          <div>
            <strong>{projectName}</strong>
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
              <Icon size={16} />
              {label}
              {activeSection === key && <ChevronRight size={14} className="nav-chevron" />}
            </button>
          ))}
        </nav>

        <div className="user-card">
          <div className="avatar">{initials(data.user?.fullName)}</div>
          <div>
            <strong>{data.user?.fullName || 'Smart Campus User'}</strong>
            <span>{prettyRole(data.user?.role)}</span>
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
            <button type="button" className="icon-btn" onClick={loadDashboard} title="Refresh"><RefreshCw size={15} /></button>
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

/* ─────────────────────────────────────────────────────────
   SECTION ROUTER — renders correct section per role
───────────────────────────────────────────────────────── */
function DashboardSection({ role, section, data, telemetry, auditLogs, reload, reloadLogs }) {
  /* SHARED: Overview for all roles */
  if (section === 'overview') {
    return (
      <>
        <WelcomeBanner data={data} telemetry={telemetry} role={role} />
        <MetricGrid telemetry={telemetry} data={data} role={role} />
        <div className="workspace-grid">
          <OverviewPrimaryPanel role={role} data={data} reload={reload} />
          <SideColumn data={data} />
        </div>
      </>
    );
  }

  /* ADMIN SECTIONS */
  if (role === 'admin') {
    if (section === 'classrooms') return <ClassroomsSection classrooms={sampleClassrooms()} />;
    if (section === 'transport') return <TransportSection data={data} />;
    if (section === 'maintenance') return <MaintenanceSection data={data} reload={reload} />;
    if (section === 'audit') return <AuditSection auditLogs={auditLogs} data={data} reload={reloadLogs} />;
  }

  /* TEACHER SECTIONS */
  if (role === 'teacher') {
    if (section === 'classrooms') return <ClassroomsSection classrooms={data.classrooms || []} />;
    if (section === 'notices') return <NoticesSection notices={data.notices || []} />;
  }

  /* STUDENT SECTIONS */
  if (role === 'student') {
    if (section === 'schedule') return <StudentScheduleSection data={data} />;
    if (section === 'shuttle') return <ShuttleSection busLocations={data.busLocations || {}} />;
    if (section === 'tickets') return <TicketsSection data={data} reload={reload} />;
  }

  /* SECURITY SECTIONS */
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
  const cards = [
    { label: 'Rooms Active', value: `${telemetry.occupiedRooms} / ${telemetry.totalRooms}`, icon: Building2 },
    { label: 'Campus Buses', value: `${telemetry.activeBuses} running`, icon: Bus },
    { label: 'Power Load',   value: `${telemetry.powerConsumptionKW} kW`, icon: Activity }
  ];
  if (role === 'admin')    cards.push({ label: 'Total Accounts', value: data.totalUsers, icon: UsersRound });
  if (role === 'security') cards.push({ label: 'Unique Gate Passes', value: data.uniqueGatePassCount, icon: DoorOpen });
  if (role === 'student')  cards.push({ label: 'My Tickets', value: data.myComplaints?.length || 0, icon: Wrench });
  if (role === 'teacher')  cards.push({ label: 'Faculty on Campus', value: telemetry.facultyOnCampus, icon: UsersRound });

  return (
    <div className="metric-grid">
      {cards.map(({ label, value, icon: Icon }) => (
        <div className="metric-card" key={label}>
          <div><span>{label}</span><Icon size={20} /></div>
          <strong>{value}</strong>
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

function SideColumn({ data }) {
  return (
    <div className="side-stack">
      <Panel title="Campus Notices" tag="Live">
        <NoticeList notices={(data.notices || []).slice(0, 4)} />
      </Panel>
      {data.busLocations && (
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
              item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : '—'
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
      <SectionHeader title="Audit Stack" subtitle="LIFO action log — file-backed audit trail of all admin operations." />
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
              item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'
            ])}
            empty="No admin actions recorded yet."
          />
        </Panel>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CLASSROOMS SECTION (shared Admin + Teacher)
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

/* ─────────────────────────────────────────────────────────
   TRANSPORT SECTION (Admin)
───────────────────────────────────────────────────────── */
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
   SHUTTLE SECTION (Student + Security)
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   NOTICES SECTION
───────────────────────────────────────────────────────── */
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
   GATE SECTION (Security)
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   VISITOR LOG SECTION (Security)
───────────────────────────────────────────────────────── */
function VisitorLogSection({ data }) {
  return (
    <div>
      <SectionHeader title="Visitor Log" subtitle="Unique campus entry records from the gate Set collection." />
      <Panel title="Access Statistics" tag="Set">
        <div className="stat-list">
          <StatRow label="Unique Check-ins (Set size)" value={data.uniqueGatePassCount} color="emerald" />
        </div>
        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.83rem' }}>
          The gate system uses a Java HashSet to guarantee uniqueness — no student ID can be recorded twice in a session.
        </p>
      </Panel>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STUDENT SECTIONS
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
    <Panel title="Smart Classroom Matrix" tag="Comparable Sort">
      <Table
        headers={['Room', 'Floor', 'Capacity', 'Power', 'Status']}
        rows={(data.classrooms || []).map((room) => [
          room.roomNumber, room.floor, room.capacity, `${room.powerKW} kW`,
          room.occupied ? 'Occupied' : 'Available'
        ])}
      />
    </Panel>
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

/* ─────────────────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function NoticeList({ notices }) {
  if (!notices?.length) return <p className="muted">No notices available.</p>;
  return (
    <div className="notice-list">
      {notices.map((notice) => (
        <article key={notice.id}>
          <span>{notice.category || 'General'}</span>
          <strong>{notice.title}</strong>
          <p>{notice.content}</p>
        </article>
      ))}
    </div>
  );
}

function BusLocations({ locations }) {
  const entries = Object.entries(locations || {});
  if (!entries.length) return <p className="muted">No bus socket transmissions yet.</p>;
  return (
    <div className="bus-list">
      {entries.map(([bus, location]) => (
        <div key={bus}><Bus size={16} /><strong>{bus}</strong><span>{location}</span></div>
      ))}
    </div>
  );
}

function StatRow({ label, value, color = 'accent' }) {
  return (
    <div className={`stat-row-item stat-row-item--${color}`}>
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </div>
  );
}

function Panel({ title, tag, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {tag && <span>{tag}</span>}
      </div>
      {children}
    </section>
  );
}

function Table({ headers, rows, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows?.length ? rows.map((row, index) => (
            <tr key={index}>{row.map((cell, i) => <td key={`${index}-${i}`}>{String(cell ?? '—')}</td>)}</tr>
          )) : (
            <tr><td colSpan={headers.length}>{empty || 'No records available.'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick }) {
  return <button className="ghost-btn" type="button" onClick={onClick}><Icon size={16} /> {label}</button>;
}

function LoadingState() {
  return (
    <div className="center-state">
      <Loader2 className="spin" size={32} />
      <p>Loading Smart Campus…</p>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="center-state">
      <p>{error}</p>
      <a className="primary-btn" href="/login">Back to login</a>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */
function sampleClassrooms() {
  return [
    { roomNumber: 'Room 524 (CSE Lab 4)', capacity: 60, floor: 5, occupied: true,  powerKW: 3.8 },
    { roomNumber: 'Room 522 (Theory)',     capacity: 55, floor: 5, occupied: false, powerKW: 0.4 },
    { roomNumber: 'Room 412 (Multimedia)',capacity: 70, floor: 4, occupied: true,  powerKW: 4.2 },
    { roomNumber: 'Room 301 (Auditorium)',capacity: 250,floor: 3, occupied: true,  powerKW: 18.5 },
    { roomNumber: 'Room 608 (Seminar)',    capacity: 45, floor: 6, occupied: false, powerKW: 0.2 },
    { roomNumber: 'Room 210 (Theory B)',  capacity: 60, floor: 2, occupied: false, powerKW: 0.3 },
  ];
}

function postAction(path, reload) {
  fetch(path, { method: 'POST', credentials: 'same-origin' })
    .then((res) => res.json())
    .then((res) => { alert(res.message); if (reload) reload(); })
    .catch((err) => alert(err.message));
}

function initials(name = 'SC') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function prettyRole(role = '') {
  return role.replace('ROLE_', '').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function roleSummary(role) {
  const copy = {
    admin: 'Monitor accounts, telemetry, queues, logs, and service operations from one control room.',
    teacher: 'See live classroom allocation, notices, and active campus resources for teaching flow.',
    student: 'Check transport status, campus notices, and submit support tickets from your dashboard.',
    security: 'Validate gate access and observe bus telemetry for campus safety operations.'
  };
  return copy[role] || copy.student;
}

createRoot(document.getElementById('root')).render(<App />);
