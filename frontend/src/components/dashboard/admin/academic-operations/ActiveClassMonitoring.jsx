import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const ActiveClassMonitoring = () => {
    const [activeClasses, setActiveClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchActiveClasses();
        const interval = setInterval(fetchActiveClasses, 20000); // 20 seconds polling
        return () => clearInterval(interval);
    }, []);

    const fetchActiveClasses = async () => {
        try {
            const res = await api('/api/admin/academic-operations/active-classes');
            setActiveClasses(res.data || res || []);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to fetch active classes.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-state">Loading active classes...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="active-classes-monitoring">
            <div className="summary-cards">
                <div className="summary-card">
                    <h4>Classes In Progress</h4>
                    <div className="card-value">{activeClasses.length}</div>
                </div>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Teacher</th>
                            <th>Room</th>
                            <th>Scheduled Time</th>
                            <th>Started At</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeClasses.map(session => (
                            <tr key={session.id}>
                                <td>{session.courseCode} - {session.courseTitle}</td>
                                <td>{session.sectionName}</td>
                                <td>{session.teacherEmail}</td>
                                <td>{session.roomNumber}</td>
                                <td>{session.scheduledStartTime} - {session.scheduledEndTime}</td>
                                <td>{new Date(session.startedAt).toLocaleTimeString()}</td>
                                <td><span className="badge in_progress">{session.status}</span></td>
                            </tr>
                        ))}
                        {activeClasses.length === 0 && (
                            <tr>
                                <td colSpan="7" className="empty-state">No classes currently in progress.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActiveClassMonitoring;
