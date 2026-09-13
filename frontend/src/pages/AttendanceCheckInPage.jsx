import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, LogIn, RefreshCw } from 'lucide-react';
import smartCampusLogo from '../assets/smart-campus-logo.png';
import { api } from '../utils/api';
import '../styles/dashboard.css';

function statusCopy(status, message) {
  if (status === 'success') return { title: 'Attendance recorded', detail: 'Your class attendance has been saved.' };
  if (message === 'Already checked in.') return { title: 'Already checked in', detail: 'Your attendance was already recorded for this session.' };
  if (message === 'SESSION_REQUIRED' || message === 'Student login required.') return { title: 'Student login required', detail: 'Sign in with your student account to complete this QR check-in.' };
  if (message === 'Session closed.') return { title: 'Session closed', detail: 'This attendance session is no longer accepting check-ins.' };
  if (message === 'Invalid token.' || message === 'Invalid token') return { title: 'Invalid token', detail: 'This QR code is not valid for an active class.' };
  if (message === 'Attendance session is not active.') return { title: 'Session expired', detail: 'This attendance session has expired or closed.' };
  return { title: 'Check-in failed', detail: message || 'Please try again or contact your teacher.' };
}

export function AttendanceCheckInPage() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const [state, setState] = useState({ status: 'loading', message: '' });

  function submitCheckIn() {
    if (!token) {
      setState({ status: 'error', message: 'Invalid token.' });
      return;
    }
    setState({ status: 'loading', message: '' });
    api(`/api/attendance/checkin?token=${encodeURIComponent(token)}`, { method: 'POST' })
      .then(() => setState({ status: 'success', message: '' }))
      .catch((error) => setState({ status: 'error', message: error.message }));
  }

  useEffect(() => {
    submitCheckIn();
  }, []);

  const copy = statusCopy(state.status, state.message);
  const needsLogin = state.message === 'SESSION_REQUIRED' || state.message === 'Student login required.';
  const returnTo = `${window.location.pathname}${window.location.search}`;

  return (
    <main className="checkin-page">
      <section className="checkin-card panel">
        <img src={smartCampusLogo} alt="Smart Campus" className="checkin-logo" />
        <div className={`checkin-icon ${state.status}`}>
          {state.status === 'loading' ? <Loader2 size={30} className="spin-icon" /> : state.status === 'success' ? <CheckCircle2 size={30} /> : <AlertCircle size={30} />}
        </div>
        <div className="checkin-copy">
          <h1>{state.status === 'loading' ? 'Checking attendance' : copy.title}</h1>
          <p>{state.status === 'loading' ? 'Please wait while Smart Campus verifies this QR session.' : copy.detail}</p>
        </div>
        {needsLogin ? (
          <a className="primary-btn" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
            <LogIn size={17} /> Sign in as Student
          </a>
        ) : state.status === 'error' && (
          <button className="ghost-btn" type="button" onClick={submitCheckIn}>
            <RefreshCw size={17} /> Try Again
          </button>
        )}
      </section>
    </main>
  );
}
