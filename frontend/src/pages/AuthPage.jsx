import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Bus,
  ChevronDown,
  Crown,
  DoorOpen,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  Presentation,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import campusVisual from '../assets/smart-campus-visual.png';
import smartCampusLogo from '../assets/smart-campus-logo.png';
import { api } from '../utils/api';
import { demoAccounts } from '../utils/helpers';
import '../styles/auth.css';

const campusMetrics = [
  { value: '42', label: 'Connected Rooms', icon: Building2 },
  { value: '6', label: 'Live Shuttles', icon: Bus },
  { value: '12', label: 'Active Gates', icon: DoorOpen },
];

const demoMeta = {
  admin: { label: 'Admin', icon: Crown },
  teacher: { label: 'Teacher', icon: Presentation },
  student: { label: 'Student', icon: GraduationCap },
  security: { label: 'Security', icon: ShieldCheck },
};

export function AuthPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [activeTab, setActiveTab] = useState('login');
  const [roles, setRoles] = useState([]);
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    studentOrEmpId: '',
    department: 'Computer Science & Engineering',
    role: 'ROLE_STUDENT',
  });
  const [registerMessage, setRegisterMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
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
    const emailEl = document.getElementById('loginEmail');
    const passEl = document.getElementById('loginPassword');
    if (emailEl && passEl) {
      emailEl.value = email;
      passEl.value = password;
    }
  }

  function submitRegister(event) {
    event.preventDefault();
    setRegisterMessage(null);
    setIsSubmitting(true);
    api('/api/auth/register', { method: 'POST', body: JSON.stringify(registerForm) })
      .then((res) => {
        setIsSubmitting(false);
        if (!res.success) {
          setRegisterMessage({ type: 'error', text: res.message });
          return;
        }
        setActiveTab('login');
        setRegisterMessage({ type: 'success', text: res.message });
      })
      .catch((error) => {
        setIsSubmitting(false);
        setRegisterMessage({ type: 'error', text: error.message });
      });
  }

  return (
    <div className="auth-page">
      <main className="auth-shell" aria-label="Smart Campus authentication">
        <section className="auth-brand-panel" aria-label="Smart Campus overview">
          <div className="brand-header">
            <img src={smartCampusLogo} alt="Smart Campus" className="auth-brand-logo" />
            <span className="brand-text-small">United International University</span>
          </div>

          <div className="auth-hero">
            <div className="auth-status-badge">
              <span className="auth-status-dot" aria-hidden="true"></span>
              <span>Campus systems online</span>
            </div>

            <h1>
              One campus.
              <br />
              One <span>intelligent</span> system.
            </h1>

            <p>
              Classrooms, shuttle GPS, gate access and campus operations - connected
              through one secure platform.
            </p>
          </div>

          <div className="auth-campus-visual">
            <img
              src={campusVisual}
              alt="UIU Smart Campus connected campus system"
              className="auth-campus-image"
            />
          </div>

          <div className="auth-metrics" aria-label="Smart Campus live metrics">
            {campusMetrics.map(({ value, label, icon: Icon }) => (
              <div className="metric-item" key={label}>
                <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
                <div>
                  <span className="metric-value">{value}</span>
                  <span className="metric-label">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`auth-form-panel ${activeTab === 'register' ? 'register-mode' : ''}`}>
          <div className="auth-form-content">
            <header className="form-header">
              <h2>{activeTab === 'login' ? 'Welcome back' : 'Create an account'}</h2>
              <p>
                {activeTab === 'login'
                  ? 'Sign in with your university credentials to continue.'
                  : 'Join Smart Campus to access your role-specific dashboard.'}
              </p>
            </header>

            <div className="segment-control" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                className={`segment-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                className={`segment-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>

            {status && <div className={`auth-alert ${status.type}`} role="alert">{status.text}</div>}

            {activeTab === 'login' ? (
              <form className="login-form" action="/login" method="post" onSubmit={() => setIsSubmitting(true)}>
                <div className="field-wrap">
                  <label htmlFor="loginEmail">University Email or ID</label>
                  <div className="input-container">
                    <UserRound size={18} className="input-icon-left" aria-hidden="true" />
                    <input
                      id="loginEmail"
                      name="email"
                      className="input-field"
                      autoComplete="username"
                      defaultValue="admin-demo"
                      placeholder="your-id@uiu.ac.bd"
                      required
                    />
                  </div>
                </div>

                <div className="field-wrap">
                  <label htmlFor="loginPassword">Password</label>
                  <div className="input-container">
                    <LockKeyhole size={18} className="input-icon-left" aria-hidden="true" />
                    <input
                      id="loginPassword"
                      name="password"
                      className="input-field input-with-action"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      defaultValue="demo-admin-pass"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-icon" aria-hidden="true" />
                      Signing in
                    </>
                  ) : 'Sign In'}
                </button>

                <div className="form-subtext">
                  New to Smart Campus?{' '}
                  <button type="button" className="text-btn" onClick={() => setActiveTab('register')}>
                    Create an account
                  </button>
                </div>
              </form>
            ) : (
              <form className="login-form register-form" onSubmit={submitRegister}>
                <div className="field-wrap">
                  <label htmlFor="registerFullName">Full Name</label>
                  <div className="input-container">
                    <UserRound size={18} className="input-icon-left" aria-hidden="true" />
                    <input
                      id="registerFullName"
                      className="input-field"
                      required
                      placeholder="Your full name"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="login-form-row">
                  <div className="field-wrap">
                    <label htmlFor="registerEmail">UIU Email</label>
                    <div className="input-container">
                      <Mail size={18} className="input-icon-left" aria-hidden="true" />
                      <input
                        id="registerEmail"
                        className="input-field"
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="you@uiu.ac.bd"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="registerId">Student / Employee ID</label>
                    <div className="input-container">
                      <IdCard size={18} className="input-icon-left" aria-hidden="true" />
                      <input
                        id="registerId"
                        className="input-field"
                        required
                        placeholder="011XXXXXX"
                        value={registerForm.studentOrEmpId}
                        onChange={(e) => setRegisterForm({ ...registerForm, studentOrEmpId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="login-form-row">
                  <div className="field-wrap">
                    <label htmlFor="registerDepartment">Department</label>
                    <div className="input-container select-container">
                      <Landmark size={18} className="input-icon-left" aria-hidden="true" />
                      <select
                        id="registerDepartment"
                        className="input-field select-field"
                        value={registerForm.department}
                        onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                      >
                        <option>Computer Science &amp; Engineering</option>
                        <option>Electrical &amp; Electronic Engineering</option>
                        <option>School of Business &amp; Economics</option>
                        <option>Civil Engineering</option>
                        <option>Campus Administration &amp; Operations</option>
                      </select>
                      <ChevronDown size={16} className="select-icon" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="registerRole">Role</label>
                    <div className="input-container select-container">
                      <ShieldCheck size={18} className="input-icon-left" aria-hidden="true" />
                      <select
                        id="registerRole"
                        className="input-field select-field"
                        value={registerForm.role}
                        onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                      >
                        {(roles.length ? roles : [{ value: 'ROLE_STUDENT', label: 'Student / Learner' }]).map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="select-icon" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div className="field-wrap">
                  <label htmlFor="registerPassword">Password</label>
                  <div className="input-container">
                    <LockKeyhole size={18} className="input-icon-left" aria-hidden="true" />
                    <input
                      id="registerPassword"
                      className="input-field input-with-action"
                      required
                      type={showRegisterPassword ? 'text' : 'password'}
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowRegisterPassword((value) => !value)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin-icon" aria-hidden="true" />
                      Creating account
                    </>
                  ) : 'Create Account'}
                </button>

                <div className="form-subtext">
                  Already have an account?{' '}
                  <button type="button" className="text-btn" onClick={() => setActiveTab('login')}>
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'login' && (
              <div className="demo-area">
                <div className="demo-divider"><span>Demo access</span></div>
                <div className="demo-grid">
                  {Object.keys(demoAccounts).map((role) => {
                    const DemoIcon = demoMeta[role]?.icon || UserRound;
                    return (
                      <button
                        type="button"
                        key={role}
                        className="demo-btn"
                        onClick={() => {
                          setActiveTab('login');
                          fillDemo(role);
                        }}
                      >
                        <DemoIcon size={15} strokeWidth={2} aria-hidden="true" />
                        {demoMeta[role]?.label || role}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
