import React, { useState, useEffect } from 'react';
import { SectionHeader, Table, ActionButton } from '../../shared/SharedComponents';
import { api, postAction } from '../../../utils/api';
import { Bell, Check, CheckCheck } from 'lucide-react';

export function StudentNotificationsSection() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  function fetchNotifications() {
    api('/api/student/notifications')
      .then((res) => {
        setNotifications(res.data || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function markRead(id) {
    postAction(`/api/student/notifications/${id}/read`, fetchNotifications);
  }

  function markAllRead() {
    postAction(`/api/student/notifications/read-all`, fetchNotifications);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading && notifications.length === 0) return <div className="loading-spinner">Loading notifications...</div>;

  return (
    <div>
      <SectionHeader title="My Notifications" subtitle="Important updates about your classes, requests, and campus alerts." />
      <div className="section-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Recent Notifications</h3>
            <span className="panel-tag">{unreadCount} unread</span>
          </div>
          <div className="action-row" style={{ padding: '0 1rem 1rem' }}>
            <ActionButton label="Mark All Read" icon={CheckCheck} onClick={markAllRead} />
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {error && <div className="error-message" style={{ margin: '1rem' }}>{error}</div>}
            
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>No notifications found.</div>
            ) : (
              <ul className="notification-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {notifications.map(n => (
                  <li key={n.id} style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    gap: '1rem',
                    backgroundColor: n.read ? 'transparent' : 'var(--bg-highlight)'
                  }}>
                    <div style={{ color: 'var(--brand-primary)' }}>
                      <Bell size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem' }}>{n.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                      <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '0.5rem' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </small>
                    </div>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="ghost-btn" style={{ alignSelf: 'flex-start' }}>
                        <Check size={16} /> Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
