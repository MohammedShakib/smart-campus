import React from 'react';
import { Bus, Loader2 } from 'lucide-react';

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
        <div key={bus}><Bus size={16} /><strong>{bus}</strong><span>{location}</span></div>
      ))}
    </div>
  );
}

export function StatRow({ label, value, color = 'accent' }) {
  return (
    <div className={`stat-row-item stat-row-item--${color}`}>
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </div>
  );
}

export function Panel({ title, tag, children }) {
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

export function Table({ headers, rows, empty }) {
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

export function ErrorState({ error }) {
  return (
    <div className="center-state">
      <p>{error}</p>
      <a className="primary-btn" href="/login">Back to login</a>
    </div>
  );
}
