import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const AdminAttendanceMonitoring = () => {
    const [attendanceSessions, setAttendanceSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAttendanceSessions();
    }, []);

    const fetchAttendanceSessions = async () => {
        try {
            const res = await api('/api/admin/academic-operations/attendance');
            setAttendanceSessions(res.data || res || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to fetch attendance history.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-state">Loading attendance data...</div>;
    if (error) return <div className="error-state">{error}</div>;

    const totalSessions = attendanceSessions.length;
    let avgRate = 0;
    if (totalSessions > 0) {
        const sumRates = attendanceSessions.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0);
        avgRate = (sumRates / totalSessions).toFixed(2);
    }

    return (
        <div className="attendance-monitoring">
            <div className="summary-cards">
                <div className="summary-card">
                    <h4>Completed Sessions</h4>
                    <div className="card-value">{totalSessions}</div>
                </div>
                <div className="summary-card">
                    <h4>Avg Attendance Rate</h4>
                    <div className="card-value">{avgRate}%</div>
                </div>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Present</th>
                            <th>Late</th>
                            <th>Absent</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceSessions.map(session => (
                            <tr key={session.sessionId}>
                                <td>{session.sessionDate}</td>
                                <td>{session.courseCode}</td>
                                <td>{session.sectionName}</td>
                                <td>{session.presentCount}</td>
                                <td>{session.lateCount}</td>
                                <td>{session.absentCount}</td>
                                <td>
                                    {session.attendancePercentage !== null 
                                        ? `${session.attendancePercentage}%` 
                                        : 'N/A'}
                                </td>
                            </tr>
                        ))}
                        {attendanceSessions.length === 0 && (
                            <tr>
                                <td colSpan="7" className="empty-state">No attendance records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAttendanceMonitoring;
