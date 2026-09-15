import React from 'react';
import { BusFront, Loader2, AlertCircle, Search, RotateCw } from 'lucide-react';

export function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function NoticeList({ notices }) {
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

export function BusLocations({ locations }) {
  const entries = Object.entries(locations || {});
  if (!entries.length) return <p className="muted">No bus socket transmissions yet.</p>;
  return (
    <div className="bus-list">
      {entries.map(([bus, location]) => (
        <div className="bus-item" key={bus}>
          <span className="bus-icon"><BusFront size={16} /></span>
          <div className="bus-copy">
            <div className="bus-meta">
              <strong>{bus}</strong>
              <span className="bus-live"><i aria-hidden="true" /> live</span>
            </div>
            <span className="bus-location">{location}</span>
            <div className="bus-route-line" aria-hidden="true"><span /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatRow({ label, value, color = 'accent' }) {
  return (
    <div className={`stat-row-item stat-row-item--${color}`}>
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  );
}

export function Panel({ title, tag, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {tag && <span className={`panel-tag ${statusClass(tag)}`}>{tag}</span>}
      </div>
      {children}
    </section>
  );
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase();
  if (/(healthy|optimal|online|live|available|occupied)/.test(normalized)) return 'status--success';
  if (/(socket|fifo|stack|feed|set|comparable|maintenance|users)/.test(normalized)) return 'status--info';
  if (/(pending|medium|warning)/.test(normalized)) return 'status--warning';
  if (/(critical|high|error|danger)/.test(normalized)) return 'status--danger';
  return 'status--neutral';
}

function chipClass(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return '';
  if (normalized === 'high') return 'cell-chip chip-priority-high';
  if (normalized === 'medium') return 'cell-chip chip-priority-medium';
  if (normalized === 'low') return 'cell-chip chip-priority-low';
  if (/(resolved|available|occupied|completed|online|live|optimal|healthy)/.test(normalized)) return 'cell-chip chip-status-success';
  if (/(pending|queued|waiting)/.test(normalized)) return 'cell-chip chip-status-pending';
  if (/(progress|processing|maintenance)/.test(normalized)) return 'cell-chip chip-status-progress';
  if (/(critical|error|failed)/.test(normalized)) return 'cell-chip chip-status-critical';
  return '';
}

function renderCell(cell) {
  const text = String(cell ?? '-');
  const className = chipClass(text);
  return className ? <span className={className}>{text}</span> : text;
}

export function Table({ headers, rows, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows?.length ? rows.map((row, index) => (
            <tr key={index}>{row.map((cell, i) => <td key={`${index}-${i}`}>{renderCell(cell)}</td>)}</tr>
          )) : (
            <tr><td colSpan={headers.length}>{empty || 'No records available.'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActionButton({ label, icon: Icon, onClick }) {
  return <button className="ghost-btn" type="button" onClick={onClick}><Icon size={16} /> {label}</button>;
}

export function LoadingState() {
  return (
    <div className="center-state">
      <Loader2 className="spin" size={32} />
      <p>Loading Smart Campus…</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const isAuthError = String(error).toLowerCase().includes('401') || String(error).toLowerCase().includes('session');
  
  if (isAuthError) {
    return (
      <div className="admin-error-state">
        <AlertCircle size={32} style={{ color: 'var(--amber)', marginBottom: '0.75rem' }} />
        <h3>Session Expired</h3>
        <p className="muted">Please sign in again to continue.</p>
        <a className="primary-btn" href="/login" style={{ marginTop: '1rem', display: 'inline-flex' }}>Sign in again</a>
      </div>
    );
  }

  return (
    <div className="admin-error-state">
      <AlertCircle size={32} style={{ color: 'var(--rose)', marginBottom: '0.75rem' }} />
      <h3>Couldn't load data</h3>
      <p className="muted">{error || 'Please check the server connection and try again.'}</p>
      {onRetry && (
        <button className="secondary-btn" onClick={onRetry} type="button" style={{ marginTop: '1rem' }}>
          <RotateCw size={16} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = Search, action }) {
  return (
    <div className="admin-empty-state">
      <Icon size={32} style={{ color: 'var(--tx-muted)', marginBottom: '0.75rem' }} />
      <h3>{title || 'No records found'}</h3>
      <p className="muted">{message || 'Try changing your search or filters.'}</p>
      {action && (
        <div style={{ marginTop: '1rem' }}>
          {action}
        </div>
      )}
    </div>
  );
}
