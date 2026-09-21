import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DoorOpen, LogIn, LogOut, ShieldCheck, ShieldAlert, Clock,
  Search, RefreshCw, UserCheck, AlertTriangle, CheckCircle2,
  XCircle, Filter, ArrowDownLeft, ArrowUpRight, Radio, Building2
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel, StatRow } from '../../shared/SharedComponents';

const GATE_OPTIONS = [
  { id: 'gate-1', name: 'Gate 1 - Main Campus Entrance' },
  { id: 'gate-2', name: 'Gate 2 - North Exit & Shuttle Bay' },
  { id: 'gate-3', name: 'Gate 3 - Library / Annex Post' },
  { id: 'gate-parking', name: 'Basement - Parking Barrier Gate' },
];

const QUICK_DEMO_USERS = [
  { label: 'Rahat (Student)', id: '011211001' },
  { label: 'Sadia (Student)', id: '011211002' },
  { label: 'Tariqul (Student)', id: '011221088' },
  { label: 'Teacher Demo', id: 'teacher-demo' },
  { label: 'Admin Demo', id: 'admin-demo' },
];

export function SecurityGateTerminalSection({ data, reload }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [identifier, setIdentifier] = useState('011211001');
  const [gateName, setGateName] = useState('Gate 1 - Main Campus Entrance');
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const loadHistory = useCallback(() => {
    setLoading(true);
    api('/api/security/gate/history')
      .then((res) => {
        setLogs(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load gate history', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleProcessAccess = async (actionType) => {
    if (!identifier.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a Student ID, Employee ID, or Email.' });
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const res = await api('/api/security/gate/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          accessType: actionType,
          gateName: gateName
        })
      });

      setFeedback({
        type: 'success',
        text: `✓ ${actionType === 'ENTRY' ? 'ENTRY (ঢোকা)' : 'EXIT (বের হওয়া)'} সফল: ${res.data?.user?.fullName || identifier} - ${res.data?.gateName || gateName}`
      });

      loadHistory();
      if (reload) reload();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Gate access processing failed.'
      });
      loadHistory();
    } finally {
      setBusy(false);
    }
  };

  const handleSetCheckInOnly = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api(`/api/campus/gate/checkin?studentId=${encodeURIComponent(identifier.trim())}`, {
        method: 'POST'
      });
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
      if (reload) reload();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  // Computed metrics
  const metrics = useMemo(() => {
    const todayEntries = logs.filter(l => l.accessType === 'ENTRY' && l.result === 'ALLOWED').length;
    const todayExits = logs.filter(l => l.accessType === 'EXIT' && l.result === 'ALLOWED').length;
    const todayDenied = logs.filter(l => l.result === 'DENIED').length;
    const uniqueAttendees = data?.uniqueGatePassCount || data?.uniqueAttendeesCount || logs.length;
    return { todayEntries, todayExits, todayDenied, uniqueAttendees };
  }, [logs, data]);

  // Filtered log records
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Type Filter
      if (filterType === 'ENTRY' && log.accessType !== 'ENTRY') return false;
      if (filterType === 'EXIT' && log.accessType !== 'EXIT') return false;
      if (filterType === 'ALLOWED' && log.result !== 'ALLOWED') return false;
      if (filterType === 'DENIED' && log.result !== 'DENIED') return false;

      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const userName = log.user?.fullName?.toLowerCase() || '';
        const userEmail = log.user?.email?.toLowerCase() || '';
        const userStudentId = log.user?.studentOrEmpId?.toLowerCase() || '';
        const idSnap = log.identifierSnapshot?.toLowerCase() || '';
        const gate = log.gateName?.toLowerCase() || '';
        const officer = log.securityOfficer?.toLowerCase() || '';
        const note = log.note?.toLowerCase() || '';

        return (
          userName.includes(query) ||
          userEmail.includes(query) ||
          userStudentId.includes(query) ||
          idSnap.includes(query) ||
          gate.includes(query) ||
          officer.includes(query) ||
          note.includes(query)
        );
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  const formatDateTime = (ts) => {
    if (!ts) return '-';
    try {
      const date = new Date(ts);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
      };
    } catch {
      return { time: ts, date: '' };
    }
  };

  return (
    <div className="sec-gate-container">
      <SectionHeader
        title="Gate Terminal & Access Controller"
        subtitle="Real-time campus entry & exit tracking. Automated verification, instant record logging, and duplicate entry prevention."
      />

      {/* KPI Overview Metrics */}
      <div className="sec-kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--emerald">
            <ArrowDownLeft size={22} />
          </div>
          <div className="sec-kpi-details">
            <span>Total Gate Entries</span>
            <strong>{metrics.todayEntries}</strong>
            <small>Students & Staff entered</small>
          </div>
        </div>

        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--blue">
            <ArrowUpRight size={22} />
          </div>
          <div className="sec-kpi-details">
            <span>Total Gate Exits</span>
            <strong>{metrics.todayExits}</strong>
            <small>Campus departures logged</small>
          </div>
        </div>

        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--amber">
            <UserCheck size={22} />
          </div>
          <div className="sec-kpi-details">
            <span>Unique Attendees (Set)</span>
            <strong>{metrics.uniqueAttendees}</strong>
            <small>Unique check-in passes</small>
          </div>
        </div>

        <div className="sec-kpi-card">
          <div className="sec-kpi-icon sec-kpi-icon--purple">
            <ShieldAlert size={22} />
          </div>
          <div className="sec-kpi-details">
            <span>Denied / Flagged Attempts</span>
            <strong>{metrics.todayDenied}</strong>
            <small>Duplicate or disabled access</small>
          </div>
        </div>
      </div>

      {/* Interactive Gate Terminal Panel */}
      <Panel title="Gate Check-In & Check-Out Terminal" tag="Live Optical & RFID Post">
        <div style={{ padding: '0.5rem 0' }}>
          <div className="sec-gate-form-grid">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Student ID / Employee ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="sec-search-input"
                  style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '1rem' }}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 011211001 or student@uiu.ac.bd"
                  disabled={busy}
                />
                <DoorOpen size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              {/* Quick Demo Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Select:</span>
                {QUICK_DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="sec-chip"
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      borderRadius: '12px',
                      background: identifier === user.id ? 'var(--accent-subtle)' : 'var(--bg-muted)',
                      border: identifier === user.id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      color: identifier === user.id ? 'var(--accent)' : 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setIdentifier(user.id)}
                  >
                    {user.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                Gate / Security Checkpoint
              </label>
              <select
                className="sec-filter-select"
                style={{ width: '100%', height: '42px', fontSize: '0.9rem' }}
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                disabled={busy}
              >
                {GATE_OPTIONS.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="primary-btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderColor: '#059669',
                padding: '0.65rem 1.4rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => handleProcessAccess('ENTRY')}
              disabled={busy}
            >
              <ArrowDownLeft size={18} />
              Verify & Record ENTRY (ক্যাম্পাসে প্রবেশ)
            </button>

            <button
              type="button"
              className="primary-btn"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderColor: '#2563eb',
                padding: '0.65rem 1.4rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => handleProcessAccess('EXIT')}
              disabled={busy}
            >
              <ArrowUpRight size={18} />
              Verify & Record EXIT (ক্যাম্পাস থেকে প্রস্থান)
            </button>

            <button
              type="button"
              className="ghost-btn"
              style={{
                padding: '0.65rem 1.1rem',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              onClick={handleSetCheckInOnly}
              title="Java Set based attendee validation"
              disabled={busy}
            >
              <ShieldCheck size={16} />
              Unique Set Check-in
            </button>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`profile-message profile-message--${feedback.type}`}
              style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>
      </Panel>

      {/* ─────────────────────────────────────────────────────────────
          CAMPUS ENTRY & EXIT RECORDS TABLE (নিচের দিকের সেকশন)
      ───────────────────────────────────────────────────────────── */}
      <Panel
        title="Campus Entry & Exit Activity Records"
        tag={`${filteredLogs.length} Records Logged`}
        action={
          <button
            type="button"
            className="sec-action-btn"
            onClick={loadHistory}
            title="Refresh logs"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      >
        {/* Filter and Search Bar */}
        <div className="sec-filter-bar" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          <div className="sec-search-wrap" style={{ flex: 1 }}>
            <Search size={16} className="sec-search-icon" />
            <input
              type="text"
              placeholder="Search by student name, ID, email, gate or note..."
              className="sec-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sec-tabs" style={{ margin: 0 }}>
            <button
              type="button"
              className={`sec-tab-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All Records ({logs.length})
            </button>
            <button
              type="button"
              className={`sec-tab-btn ${filterType === 'ENTRY' ? 'active' : ''}`}
              onClick={() => setFilterType('ENTRY')}
            >
              <ArrowDownLeft size={14} /> Entries ({logs.filter(l => l.accessType === 'ENTRY').length})
            </button>
            <button
              type="button"
              className={`sec-tab-btn ${filterType === 'EXIT' ? 'active' : ''}`}
              onClick={() => setFilterType('EXIT')}
            >
              <ArrowUpRight size={14} /> Exits ({logs.filter(l => l.accessType === 'EXIT').length})
            </button>
            <button
              type="button"
              className={`sec-tab-btn ${filterType === 'DENIED' ? 'active' : ''}`}
              onClick={() => setFilterType('DENIED')}
            >
              <ShieldAlert size={14} /> Denied ({logs.filter(l => l.result === 'DENIED').length})
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="sec-table-container">
          <table className="sec-table">
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Date & Time (সময়)</th>
                <th style={{ minWidth: '220px' }}>Person / Student (ব্যক্তি ও আইডি)</th>
                <th style={{ minWidth: '130px' }}>Movement (প্রবেশ / প্রস্থান)</th>
                <th style={{ minWidth: '180px' }}>Gate Location (গেট)</th>
                <th style={{ minWidth: '140px' }}>Verification Status</th>
                <th style={{ minWidth: '140px' }}>Security Officer</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="sec-empty-cell">
                    <RefreshCw size={18} className="spin" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Loading gate entry and exit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sec-empty-cell">
                    <DoorOpen size={28} style={{ opacity: 0.3, marginBottom: '0.5rem', display: 'block', margin: '0 auto' }} />
                    No gate access records found. Scan or verify an ID above to record entry or exit.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dt = formatDateTime(log.timestamp);
                  const isEntry = log.accessType === 'ENTRY';
                  const isAllowed = log.result === 'ALLOWED';
                  const personName = log.user?.fullName || log.identifierSnapshot || 'Campus Member';
                  const personId = log.user?.studentOrEmpId || log.identifierSnapshot || log.user?.email || '-';
                  const roleName = (log.userRoleSnapshot || log.user?.role || 'STUDENT').replace('ROLE_', '');

                  return (
                    <tr key={log.id}>
                      {/* Date & Time */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <strong style={{ fontSize: '0.9rem' }}>{dt.time}</strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {dt.date}
                        </div>
                      </td>

                      {/* Person / Student Info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--accent-subtle)',
                              color: 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}
                          >
                            {personName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem' }}>{personName}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {personId}</span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-muted)',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 600
                                }}
                              >
                                {roleName}
                              </span>
                            </div>
                            {log.user?.department && (
                              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {log.user.department}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Movement (ENTRY vs EXIT) */}
                      <td>
                        {isEntry ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            <ArrowDownLeft size={14} /> ENTRY (ঢোকা)
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              background: 'rgba(59, 130, 246, 0.12)',
                              color: '#3b82f6',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            <ArrowUpRight size={14} /> EXIT (বের হওয়া)
                          </span>
                        )}
                      </td>

                      {/* Gate Location */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.88rem' }}>{log.gateName}</span>
                        </div>
                      </td>

                      {/* Result / Status */}
                      <td>
                        {isAllowed ? (
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}
                            >
                              <CheckCircle2 size={13} /> ALLOWED
                            </span>
                            {log.note && log.note !== 'Access Granted' && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {log.note}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                fontWeight: 600,
                                fontSize: '0.8rem'
                              }}
                            >
                              <XCircle size={13} /> DENIED
                            </span>
                            {log.note && (
                              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px', fontWeight: 500 }}>
                                {log.note}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Officer */}
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {log.securityOfficer || 'Gate Officer'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
