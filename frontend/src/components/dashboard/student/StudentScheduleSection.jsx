import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';
import { BookOpen, Calendar, Clock, MapPin, UserRound } from 'lucide-react';

export function StudentScheduleSection() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  function fetchSchedule() {
    setLoading(true);
    api('/api/student/schedule')
      .then((res) => setSchedule(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  if (loading) return <div className="loading-spinner">Loading schedule...</div>;
  if (error) return <div className="error-message">Couldn't load schedule: {error}</div>;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  
  const todayClasses = schedule.filter(item => item.dayOfWeek === today);
  const otherClasses = schedule.filter(item => item.dayOfWeek !== today);

  const formatTime = (timeArray) => {
    if (!timeArray || !Array.isArray(timeArray) || timeArray.length < 2) return '';
    const date = new Date();
    date.setHours(timeArray[0], timeArray[1]);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderClassCard = (item) => (
    <article className="student-schedule-card" key={`${item.courseCode}-${item.sectionName}-${item.dayOfWeek}-${item.startTime}`}>
      <div className="student-schedule-card-main">
        <span className="course-code-tag">{item.courseCode}</span>
        <div>
          <h3>{item.courseTitle}</h3>
          <p>{item.sectionName}</p>
        </div>
      </div>
      <div className="student-schedule-meta">
        <span><Calendar size={14} /> {item.dayOfWeek}</span>
        <span><Clock size={14} /> {formatTime(item.startTime)} - {formatTime(item.endTime)}</span>
        <span><MapPin size={14} /> {item.roomNumber}</span>
        <span><UserRound size={14} /> {item.teacherName || item.teacherEmail}</span>
      </div>
      <span className={`student-schedule-status ${item.status === 'ACTIVE' ? 'is-active' : ''}`}>
        {item.status === 'ACTIVE' ? 'In progress' : item.status}
      </span>
    </article>
  );

  return (
    <div className="student-page student-schedule-page">
      <SectionHeader title="Class Schedule" subtitle="Your enrolled classes for the semester." />
      <div className="student-schedule-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Today's Classes</h3>
            <span className="panel-tag">{todayClasses.length} classes</span>
          </div>
          <div className="student-schedule-list">
            {todayClasses.length ? todayClasses.map(renderClassCard) : (
              <div className="student-empty-compact">
                <BookOpen size={20} />
                <span>No classes scheduled today.</span>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>All Upcoming Classes</h3>
            <span className="panel-tag">Weekly view</span>
          </div>
          <div className="student-schedule-list student-schedule-list--scroll">
            {otherClasses.length ? otherClasses.map(renderClassCard) : (
              <div className="student-empty-compact">
                <Calendar size={20} />
                <span>No other classes scheduled.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
