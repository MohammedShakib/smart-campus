import React, { useState } from 'react';
import { CalendarDays, RadioTower, ClipboardCheck, CalendarCheck } from 'lucide-react';
import ScheduleManagement from './ScheduleManagement';
import ActiveClassMonitoring from './ActiveClassMonitoring';
import AdminAttendanceMonitoring from './AdminAttendanceMonitoring';
import AdminReservationManagement from './AdminReservationManagement';

const TABS = [
  { id: 'schedule', label: 'Class Schedules', icon: CalendarDays },
  { id: 'active-classes', label: 'Live Active Classes', icon: RadioTower, live: true },
  { id: 'attendance', label: 'Attendance Telemetry', icon: ClipboardCheck },
  { id: 'reservations', label: 'Room Reservations', icon: CalendarCheck }
];

export default function AcademicOperationsTabs() {
  const [activeTab, setActiveTab] = useState('schedule');

  const renderTab = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleManagement />;
      case 'active-classes':
        return <ActiveClassMonitoring />;
      case 'attendance':
        return <AdminAttendanceMonitoring />;
      case 'reservations':
        return <AdminReservationManagement />;
      default:
        return <ScheduleManagement />;
    }
  };

  return (
    <div className="academic-operations-page fade-in">
      <div className="academic-tabs" role="tablist" aria-label="Academic Operations Navigation">
        {TABS.map(({ id, label, icon: Icon, live }) => (
          <button
            key={id}
            type="button"
            className={`academic-tab${activeTab === id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(id)}
            role="tab"
            aria-selected={activeTab === id}
          >
            <Icon size={16} />
            <span>{label}</span>
            {live && <span className="tab-live-pulse" title="Live stream available" />}
          </button>
        ))}
      </div>

      <div className="tab-content-wrapper">
        {renderTab()}
      </div>
    </div>
  );
}
