import React, { useState, useEffect } from 'react';
import { SectionHeader, Table } from '../../shared/SharedComponents';
import { api } from '../../../utils/api';
import { BookOpen, Calendar } from 'lucide-react';

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

  const mapToRow = (item) => [
    item.courseCode,
    item.courseTitle,
    item.sectionName,
    item.roomNumber,
    item.dayOfWeek,
    `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
    item.status === 'ACTIVE' ? 'IN PROGRESS' : item.status
  ];

  return (
    <div>
      <SectionHeader title="Class Schedule" subtitle="Your enrolled classes for the semester." />
      <div className="section-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Today's Classes</h3>
            <span className="panel-tag">{todayClasses.length} classes</span>
          </div>
          <div className="panel-body">
            <Table
              headers={['Code', 'Course', 'Section', 'Room', 'Day', 'Time', 'Status']}
              rows={todayClasses.map(mapToRow)}
              empty="No classes scheduled today."
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>All Upcoming Classes</h3>
            <span className="panel-tag">Weekly view</span>
          </div>
          <div className="panel-body">
            <Table
              headers={['Code', 'Course', 'Section', 'Room', 'Day', 'Time', 'Status']}
              rows={otherClasses.map(mapToRow)}
              empty="No other classes scheduled."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
