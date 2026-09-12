import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Bell,
  Bus,
  Building2,
  ClipboardCheck,
  Database,
  DoorOpen,
  Layers,
  LockKeyhole,
  LogOut,
  Menu,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench
} from 'lucide-react';
import './styles.css';

const projectName = 'Smart Campus';

const demoAccounts = {
  admin: ['admin@uiu.ac.bd', 'admin123'],
  teacher: ['teacher@uiu.ac.bd', 'teacher123'],
  student: ['student@uiu.ac.bd', 'student123'],
  security: ['security@uiu.ac.bd', 'security123']
};

const dashboardConfig = {
  admin: {
    label: 'Control Center',
    path: '/dashboard/admin',
    nav: ['Overview', 'Smart Classrooms', 'Transport', 'Maintenance', 'Audit Stack']
  },
  teacher: {
    label: 'Faculty Desk',
    path: '/dashboard/teacher',
    nav: ['Overview', 'Classrooms', 'Attendance', 'Announcements']
  },
  student: {
    label: 'Student Portal',
    path: '/dashboard/student',
    nav: ['Overview', 'Schedule', 'Shuttle', 'Support Tickets']
  },
  security: {
    label: 'Security Post',
    path: '/dashboard/security',
    nav: ['Overview', 'Gate Access', 'Visitor Log', 'Bus Fleet']
  }
};

function api(path, options = {}) {
  return fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  }).then(async (response) => {
    if (response.status === 401 || response.status === 403) {
      throw new Error('SESSION_REQUIRED');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  });
}

function App() {
  const path = window.location.pathname;
  if (path.startsWith('/dashboard')) {
    return <DashboardApp />;
  }
  return <AuthPage />;
}

function AuthPage() {
  const query = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState('login');
  const [roles, setRoles] = useState([]);
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    studentOrEmpId: '',
    department: 'Computer Science & Engineering',
    role: 'ROLE_STUDENT'
  });
  const [registerMessage, setRegisterMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api('/api/auth/me')
      .then((res) => setRoles(res?.data?.roles || []))
      .catch(() => setRoles([]));
  }, []);

  const status = useMemo(() => {
    if (query.get('error')) return { type: 'error', text: 'Invalid email/ID or password. Use a demo account or try again.' };
    if (query.get('logout')) return { type: 'success', text: 'You have been logged out securely from Smart Campus.' };
    if (query.get('registered')) return { type: 'success', text: 'Account created successfully. You can now sign in.' };
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
    api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerForm)
    })
      .then((res) => {
        if (!res.success) {
          setRegisterMessage({ type: 'error', text: res.message });
          return;
        }
        setActiveTab('login');
        setRegisterMessage({ type: 'success', text: res.message });
      })
      .catch((error) => setRegisterMessage({ type: 'error', text: error.message }));
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-top">
          <div className="brand-mark">SC</div>
          <div>
            <p className="eyebrow">United International University</p>
            <h1>{projectName}</h1>
          </div>
        </div>

        <div className="hero-copy">
          <span className="system-pill"><Activity size={15} /> Online and synchronized</span>
          <h2>Campus operations in one live command surface</h2>
          <p>
            Track classrooms, shuttle telemetry, maintenance queues, notices, and secure gate access from a single React-powered portal.
          </p>
        </div>

        <div className="ops-board" aria-hidden="true">
          <div className="ops-board-head">
            <span>Live Campus Grid</span>
            <strong>SMART-OPS</strong>
          </div>
          <div className="ops-grid">
            <span className="cell active"></span>
            <span className="cell"></span>
            <span className="cell bus"></span>
            <span className="cell gate"></span>
            <span className="cell active"></span>
            <span className="cell alert"></span>
            <span className="cell"></span>
            <span className="cell active"></span>
            <span className="cell bus"></span>
          </div>
          <div className="ops-stats">
            <span><strong>42</strong> rooms</span>
            <span><strong>6</strong> buses</span>
            <span><strong>12</strong> gates</span>
          </div>
        </div>

        <div className="feature-grid">
          <Feature icon={Building2} title="Smart Classrooms" text="Live room load and scheduling" />
          <Feature icon={Bus} title="Shuttle GPS" text="Socket-fed bus locations" />
          <Feature icon={DoorOpen} title="Gate Access" text="Set-based unique validation" />
          <Feature icon={Wrench} title="Maintenance" text="FIFO queue dispatch" />
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="mini-pill"><Sparkles size={14} /> ReactJS Frontend</span>
            <h2>{activeTab === 'login' ? 'Sign in to Smart Campus' : 'Create Smart Campus Account'}</h2>
            <p>Use your university account to access the right dashboard.</p>
          </div>

          <div className="demo-bar">
            <div>
              <strong>Quick demo sign-in</strong>
              <span>Click to autofill</span>
            </div>
            <div className="demo-actions">
              {Object.keys(demoAccounts).map((role) => (
                <button type="button" key={role} onClick={() => fillDemo(role)}>{role}</button>
              ))}
            </div>
          </div>

          <div className="tabs">
            <button type="button" className={activeTab === 'login' ? 'active' : ''} onClick={() => setActiveTab('login')}>Log In</button>
            <button type="button" className={activeTab === 'register' ? 'active' : ''} onClick={() => setActiveTab('register')}>Register</button>
          </div>

          {status && <div className={`notice ${status.type}`}>{status.text}</div>}

          {activeTab === 'login' ? (
            <form className="form-stack" action="/login" method="post">
              <label>
                University Email or ID
                <input id="loginEmail" name="email" defaultValue="admin@uiu.ac.bd" required />
              </label>
              <label>
                <span className="label-row">Password <button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</button></span>
                <input id="loginPassword" name="password" type={showPassword ? 'text' : 'password'} defaultValue="admin123" required />
              </label>
              <button className="primary-btn" type="submit"><LockKeyhole size={17} /> Sign In</button>
            </form>
          ) : (
            <form className="form-stack" onSubmit={submitRegister}>
              <label>Full Name<input required value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })} /></label>
              <label>UIU Email<input required type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} /></label>
              <label>Student / Employee ID<input required value={registerForm.studentOrEmpId} onChange={(e) => setRegisterForm({ ...registerForm, studentOrEmpId: e.target.value })} /></label>
              <label>
                Department
                <select value={registerForm.department} onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}>
                  <option>Computer Science & Engineering</option>
                  <option>Electrical & Electronic Engineering</option>
                  <option>School of Business & Economics</option>
                  <option>Civil Engineering</option>
                  <option>Campus Administration & Operations</option>
                </select>
              </label>
              <label>
                Role
                <select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                  {(roles.length ? roles : [{ value: 'ROLE_STUDENT', label: 'Student / Learner' }]).map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
              <label>Password<input required type="password" minLength={6} value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} /></label>
              <button className="primary-btn" type="submit"><UserRound size={17} /> Create Account</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function DashboardApp() {
  const role = window.location.pathname.split('/').pop() || 'student';
  const [data, setData] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [error, setError] = useState(null);
  const config = dashboardConfig[role] || dashboardConfig.student;

  function loadDashboard() {
    api(`/api/dashboard/${role}`)
      .then((res) => {
        setData(res.data);
        setTelemetry(res.data.telemetry);
        setError(null);
      })
      .catch((err) => {
        if (err.message === 'SESSION_REQUIRED') {
          window.location.href = '/login';
          return;
        }
        setError(err.message);
      });
  }

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => {
      api('/api/campus/telemetry')
        .then((res) => setTelemetry(res.data))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [role]);

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
          {config.nav.map((item, index) => (
            <a className={index === 0 ? 'active' : ''} key={item} href={config.path}>{item}</a>
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
            <span className="eyebrow">{projectName}</span>
            <h1>{config.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="health"><Activity size={15} /> {telemetry.systemStatus}</span>
            <a className="logout" href="/logout"><LogOut size={16} /> Logout</a>
          </div>
        </header>

        <section className="content">
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

          <Metrics telemetry={telemetry} data={data} role={role} />

          <div className="workspace-grid">
            <RolePrimaryPanel role={role} data={data} reload={loadDashboard} />
            <SidePanel role={role} data={data} telemetry={telemetry} />
          </div>
        </section>
      </section>
    </main>
  );
}

function Metrics({ telemetry, data, role }) {
  const cards = [
    { label: 'Rooms Active', value: `${telemetry.occupiedRooms} / ${telemetry.totalRooms}`, icon: Building2 },
    { label: 'Campus Buses', value: `${telemetry.activeBuses} running`, icon: Bus },
    { label: 'Power Load', value: `${telemetry.powerConsumptionKW} kW`, icon: Activity }
  ];
  if (role === 'admin') cards.push({ label: 'Accounts', value: data.totalUsers, icon: UsersRound });
  if (role === 'security') cards.push({ label: 'Unique Gate Passes', value: data.uniqueGatePassCount, icon: DoorOpen });
  if (role === 'student') cards.push({ label: 'My Tickets', value: data.myComplaints?.length || 0, icon: Wrench });

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

function RolePrimaryPanel({ role, data, reload }) {
  if (role === 'admin') return <AdminPanel data={data} reload={reload} />;
  if (role === 'teacher') return <TeacherPanel data={data} />;
  if (role === 'security') return <SecurityPanel data={data} reload={reload} />;
  return <StudentPanel data={data} reload={reload} />;
}

function AdminPanel({ data, reload }) {
  return (
    <Panel title="Operations Queue" tag="FIFO + Stack">
      <div className="action-row">
        <ActionButton label="Process next complaint" icon={ClipboardCheck} onClick={() => postAction('/api/campus/complaint/process-next', reload)} />
        <ActionButton label="Undo last admin action" icon={Layers} onClick={() => postAction('/api/campus/admin/undo', reload)} />
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

function TeacherPanel({ data }) {
  return (
    <Panel title="Smart Classroom Matrix" tag="Comparable Sort">
      <Table
        headers={['Room', 'Floor', 'Capacity', 'Power', 'Status']}
        rows={(data.classrooms || []).map((room) => [
          room.roomNumber,
          room.floor,
          room.capacity,
          `${room.powerKW} kW`,
          room.occupied ? 'Occupied' : 'Available'
        ])}
      />
    </Panel>
  );
}

function StudentPanel({ data, reload }) {
  const [ticket, setTicket] = useState({
    location: '',
    issueTitle: '',
    priority: 'MEDIUM',
    description: ''
  });

  function submitTicket(event) {
    event.preventDefault();
    const payload = {
      ...ticket,
      studentName: data.user?.fullName || 'Student',
      studentId: data.user?.studentOrEmpId || '011211001'
    };
    api('/api/campus/complaint/submit', { method: 'POST', body: JSON.stringify(payload) })
      .then(() => {
        setTicket({ location: '', issueTitle: '', priority: 'MEDIUM', description: '' });
        reload();
      })
      .catch((err) => alert(err.message));
  }

  return (
    <Panel title="Student Service Desk" tag="Maintenance">
      <form className="ticket-form" onSubmit={submitTicket}>
        <input placeholder="Location" value={ticket.location} onChange={(e) => setTicket({ ...ticket, location: e.target.value })} required />
        <input placeholder="Issue title" value={ticket.issueTitle} onChange={(e) => setTicket({ ...ticket, issueTitle: e.target.value })} required />
        <select value={ticket.priority} onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
        </select>
        <textarea placeholder="Details" value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} />
        <button className="primary-btn" type="submit"><Wrench size={17} /> Submit Ticket</button>
      </form>
      <Table
        headers={['Issue', 'Location', 'Priority', 'Status']}
        rows={(data.myComplaints || []).map((item) => [item.issueTitle, item.location, item.priority, item.status])}
        empty="No support tickets submitted yet."
      />
    </Panel>
  );
}

function SecurityPanel({ data, reload }) {
  const [studentId, setStudentId] = useState('011211001');
  const [message, setMessage] = useState(null);

  function scan(event) {
    event.preventDefault();
    fetch(`/api/campus/gate/checkin?studentId=${encodeURIComponent(studentId)}`, { method: 'POST', credentials: 'same-origin' })
      .then((res) => res.json())
      .then((res) => {
        setMessage(res.message);
        reload();
      });
  }

  return (
    <Panel title="Gate Access Validator" tag="Set Collection">
      <form className="scan-form" onSubmit={scan}>
        <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student or staff ID" />
        <button className="primary-btn" type="submit"><ShieldCheck size={17} /> Verify Access</button>
      </form>
      {message && <div className="notice success">{message}</div>}
      <BusLocations locations={data.busLocations} />
    </Panel>
  );
}

function SidePanel({ data }) {
  return (
    <div className="side-stack">
      <Panel title="Campus Notices" tag="Live">
        <div className="notice-list">
          {(data.notices || []).slice(0, 4).map((notice) => (
            <article key={notice.id}>
              <span>{notice.category || 'General'}</span>
              <strong>{notice.title}</strong>
              <p>{notice.content}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Bus Telemetry" tag="Socket">
        <BusLocations locations={data.busLocations} />
      </Panel>
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

function Panel({ title, tag, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        <span>{tag}</span>
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
            <tr key={index}>{row.map((cell, i) => <td key={`${index}-${i}`}>{String(cell ?? '-')}</td>)}</tr>
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

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="feature-card">
      <Icon size={20} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function LoadingState() {
  return <div className="center-state"><Activity className="spin" size={28} /><p>Loading Smart Campus...</p></div>;
}

function ErrorState({ error }) {
  return <div className="center-state"><p>{error}</p><a className="primary-btn" href="/login">Back to login</a></div>;
}

function postAction(path, reload) {
  fetch(path, { method: 'POST', credentials: 'same-origin' })
    .then((res) => res.json())
    .then((res) => {
      alert(res.message);
      if (reload) reload();
    })
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
