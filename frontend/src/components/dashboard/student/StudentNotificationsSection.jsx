import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../../shared/SharedComponents';
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
    api('/api/notifications')
      .then((res) => {
        setNotifications(res.data || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function markRead(id) {
    postAction(`/api/notifications/${id}/read`, fetchNotifications);
  }

  function markAllRead() {
    postAction(`/api/notifications/read-all`, fetchNotifications);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading && notifications.length === 0) return <div className="loading-spinner">Loading notifications...</div>;

  return (
    <div className="student-page student-notifications-page">
      <SectionHeader title="My Notifications" subtitle="Important updates about your classes, requests, and campus alerts." />
      <div className="student-single-panel">
        <div className="panel student-notifications-panel">
          <div className="panel-head student-panel-head">
            <h3>Recent Notifications</h3>
            <span className="panel-tag">{unreadCount} unread</span>
          </div>
          <div className="student-panel-toolbar">
            <button className="ghost-btn" type="button" onClick={markAllRead} disabled={!notifications.length}>
              <CheckCheck size={16} /> Mark all read
            </button>
          </div>
          <div className="student-panel-body">
            {error && <div className="error-message" style={{ margin: '1rem' }}>{error}</div>}
            
            {notifications.length === 0 ? (
              <div className="student-empty-state">
                <Bell size={28} />
                <h3>No notifications found</h3>
                <p>Your class alerts, request updates, and campus notices will appear here.</p>
              </div>
            ) : (
              <ul className="student-notification-list">
                {notifications.map(n => (
                  <li key={n.id} className={`student-notification-item${n.read ? '' : ' is-unread'}`}>
                    <div className="student-notification-icon">
                      <Bell size={20} />
                    </div>
                    <div className="student-notification-copy">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <small>
                        {new Date(n.createdAt).toLocaleString()}
                      </small>
                    </div>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="ghost-btn student-notification-read">
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
