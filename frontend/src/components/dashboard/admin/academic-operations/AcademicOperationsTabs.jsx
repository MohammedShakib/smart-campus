import React, { useState } from 'react';
import ScheduleManagement from './ScheduleManagement';
import ActiveClassMonitoring from './ActiveClassMonitoring';
import AdminAttendanceMonitoring from './AdminAttendanceMonitoring';
import AdminReservationManagement from './AdminReservationManagement';

const AcademicOperationsTabs = () => {
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
        <div className="dashboard-section fade-in">
            <div className="section-header">
                <h2>Academic Operations</h2>
                <p>Manage schedules, monitor live classes, review attendance and classroom reservations.</p>
            </div>

            <div className="tab-navigation">
                <button 
                    className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedule')}
                >
                    Schedule
                </button>
                <button 
                    className={`tab-button ${activeTab === 'active-classes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active-classes')}
                >
                    Active Classes
                </button>
                <button 
                    className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    Attendance
                </button>
                <button 
                    className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reservations')}
                >
                    Reservations
                </button>
            </div>

            <div className="tab-content">
                {renderTab()}
            </div>
        </div>
    );
};

export default AcademicOperationsTabs;
