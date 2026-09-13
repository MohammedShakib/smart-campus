import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from 'lucide-react';
import campusVisual from '../assets/smart-campus-visual.png';
import { api } from '../utils/api';
import { demoAccounts } from '../utils/helpers';
import '../styles/auth.css';

export function AuthPage() {
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
        if (!res.success) { setRegisterMessage({ type: 'error', text: res.message }); return; }
        setActiveTab('login');
        setRegisterMessage({ type: 'success', text: res.message });
      })
      .catch((error) => { setIsSubmitting(false); setRegisterMessage({ type: 'error', text: error.message }); });
  }

  return (
    <div className="auth-page-wrapper">
      <main className="auth-container">
        
        {/* LEFT PANEL */}
        <section className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="brand-header">
              <div className="brand-icon">SC</div>
              <div className="brand-text-group">
                <span className="brand-text-small">United International University</span>
                <span className="brand-text-large">Smart Campus</span>
              </div>
            </div>
            
            <div className="auth-hero">
              <div className="auth-status-badge">
                <div className="auth-status-dot"></div>
                <span>Campus systems online</span>
              </div>
              <h1>One campus.<br/>One <span className="highlight">intelligent</span> system.</h1>
              <p>Classrooms, shuttle GPS, gate access and campus operations — connected through one secure platform.</p>
            </div>
            
            <div className="auth-campus-visual">
              <img
                src={campusVisual}
                alt="UIU Smart Campus connected campus system"
                className="auth-campus-image"
              />
            </div>

            <div className="auth-metrics">
              <div className="metric-item">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10"/><path d="M2 14h20"/><path d="M12 14v7"/><path d="m2 10 10-7 10 7"/></svg>
                </div>
                <div className="metric-text">
                  <span className="metric-value">42</span>
                  <span className="metric-label">Connected Rooms</span>
                </div>
              </div>
              <div className="metric-separator"></div>
              <div className="metric-item">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M14 17H5"/><path d="M19 17v4"/><path d="M5 17v4"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>
                </div>
                <div className="metric-text">
                  <span className="metric-value">6</span>
                  <span className="metric-label">Live Shuttles</span>
                </div>
              </div>
              <div className="metric-separator"></div>
              <div className="metric-item">
                <div className="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <div className="metric-text">
                  <span className="metric-value">12</span>
                  <span className="metric-label">Active Gates</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="auth-form-panel">
          <div className="auth-form-content">
            <div className="form-header">
              <h2>{activeTab === 'login' ? 'Welcome back' : 'Create an account'}</h2>
              <p>{activeTab === 'login' ? 'Sign in with your university credentials to continue.' : 'Join Smart Campus to access your role-specific dashboard.'}</p>
            </div>

            <div className="segment-control">
              <button type="button" className={`segment-btn ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Sign In</button>
              <button type="button" className={`segment-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Register</button>
            </div>

            {status && <div className={`auth-alert ${status.type}`} role="alert">{status.text}</div>}

            {activeTab === 'login' ? (
              <form className="login-form" action="/login" method="post" onSubmit={() => setIsSubmitting(true)}>
                <div className="field-wrap">
                  <label htmlFor="loginEmail">University Email or ID</label>
                  <div className="input-container">
                    <UserRound size={18} className="input-icon-left" />
                    <input id="loginEmail" name="email" className="input-field" autoComplete="username" defaultValue="admin-demo" placeholder="your-id@uiu.ac.bd" required />
                  </div>
                </div>
                <div className="field-wrap">
                  <div className="label-between">
                    <label htmlFor="loginPassword">Password</label>
                  </div>
                  <div className="input-container">
                    <LockKeyhole size={18} className="input-icon-left" />
                    <input id="loginPassword" name="password" className="input-field" type={showPassword ? 'text' : 'password'} autoComplete="current-password" defaultValue="demo-admin-pass" placeholder="••••••••" required />
                    <button type="button" className="pw-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={18} className="spin-icon" /> Signing in…</> : 'Sign In'}
                </button>

                <div className="form-subtext">
                  New to Smart Campus? <button type="button" className="text-btn" onClick={() => setActiveTab('register')}>Create an account</button>
                </div>
              </form>
            ) : (
              <form className="login-form" onSubmit={submitRegister}>
                <div className="field-wrap">
                  <label>Full Name</label>
                  <div className="input-container">
                    <UserRound size={18} className="input-icon-left" />
                    <input className="input-field" required placeholder="Your full name" value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })} />
                  </div>
                </div>
                <div className="login-form-row">
                  <div className="field-wrap">
                    <label>UIU Email</label>
                    <div className="input-container">
                      <input className="input-field" required type="email" placeholder="you@uiu.ac.bd" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} style={{paddingLeft: '1rem'}} />
                    </div>
                  </div>
                  <div className="field-wrap">
                    <label>Student / Employee ID</label>
                    <div className="input-container">
                      <input className="input-field" required placeholder="011XXXXXX" value={registerForm.studentOrEmpId} onChange={(e) => setRegisterForm({ ...registerForm, studentOrEmpId: e.target.value })} style={{paddingLeft: '1rem'}} />
                    </div>
                  </div>
                </div>
                <div className="login-form-row">
                  <div className="field-wrap">
                    <label>Department</label>
                    <div className="input-container">
                      <select className="input-field" value={registerForm.department} onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })} style={{paddingLeft: '1rem'}}>
                        <option>Computer Science &amp; Engineering</option>
                        <option>Electrical &amp; Electronic Engineering</option>
                        <option>School of Business &amp; Economics</option>
                        <option>Civil Engineering</option>
                        <option>Campus Administration &amp; Operations</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-wrap">
                    <label>Role</label>
                    <div className="input-container">
                      <select className="input-field" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })} style={{paddingLeft: '1rem'}}>
                        {(roles.length ? roles : [{ value: 'ROLE_STUDENT', label: 'Student / Learner' }]).map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="field-wrap">
                  <label>Password</label>
                  <div className="input-container">
                    <LockKeyhole size={18} className="input-icon-left" />
                    <input className="input-field" required type="password" minLength={6} placeholder="Min. 6 characters" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
                  </div>
                </div>
                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={18} className="spin-icon" /> Creating account…</> : 'Create Account'}
                </button>
                
                <div className="form-subtext">
                  Already have an account? <button type="button" className="text-btn" onClick={() => setActiveTab('login')}>Sign in</button>
                </div>
              </form>
            )}

            {activeTab === 'login' && (
              <div className="demo-area">
                <div className="demo-divider"><span>Demo access</span></div>
                <div className="demo-grid">
                  {Object.keys(demoAccounts).map((role) => (
                    <button type="button" key={role} className="demo-btn-small"
                      onClick={() => { setActiveTab('login'); fillDemo(role); }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
