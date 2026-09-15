import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';

const dataOf = (payload) => Array.isArray(payload) ? payload : (payload?.data || []);

const ScheduleManagement = () => {
    const [schedules, setSchedules] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        courseId: '',
        teacherId: '',
        classroomId: '',
        sectionName: '',
        dayOfWeek: 'Sunday',
        startTime: '',
        endTime: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schedulesRes, coursesRes, teachersRes, classroomsRes] = await Promise.all([
                api('/api/admin/schedules'),
                api('/api/admin/courses'),
                api('/api/admin/teachers'),
                api('/api/admin/classrooms')
            ]);
            setSchedules(dataOf(schedulesRes));
            setCourses(dataOf(coursesRes));
            setTeachers(dataOf(teachersRes));
            setClassrooms(dataOf(classroomsRes));
        } catch (err) {
            setError(err.message || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api(`/api/admin/schedules/${formData.id}`, { method: 'PUT', body: JSON.stringify(formData) });
            } else {
                await api('/api/admin/schedules', { method: 'POST', body: JSON.stringify(formData) });
            }
            setIsFormOpen(false);
            setFormData({
                id: null, courseId: '', teacherId: '', classroomId: '',
                sectionName: '', dayOfWeek: 'Sunday', startTime: '', endTime: ''
            });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to save schedule');
        }
    };

    const handleEdit = (schedule) => {
        setFormData({
            id: schedule.id,
            courseId: schedule.courseId,
            teacherId: teachers.find(t => t.email === schedule.teacherEmail)?.id || '',
            classroomId: schedule.classroomId,
            sectionName: schedule.sectionName,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
        });
        setIsFormOpen(true);
    };

    if (loading) return <div className="loading-state">Loading schedules...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="schedule-management">
            <div className="toolbar">
                <button className="primary-button" onClick={() => {
                    setIsFormOpen(true);
                    setFormData({ id: null, courseId: '', teacherId: '', classroomId: '', sectionName: '', dayOfWeek: 'Sunday', startTime: '', endTime: '' });
                }}>+ Create Schedule</button>
            </div>

            {isFormOpen && (
                <div className="form-panel">
                    <h3>{formData.id ? 'Edit Schedule' : 'Create Schedule'}</h3>
                    <form onSubmit={handleSubmit} className="standard-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Course</label>
                                <select name="courseId" value={formData.courseId} onChange={handleInputChange} required>
                                    <option value="">Select Course...</option>
                                    {courses.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Teacher</label>
                                <select name="teacherId" value={formData.teacherId} onChange={handleInputChange} required>
                                    <option value="">Select Teacher...</option>
                                    {teachers.filter(t => t.active !== false).map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Classroom</label>
                                <select name="classroomId" value={formData.classroomId} onChange={handleInputChange} required>
                                    <option value="">Select Classroom...</option>
                                    {classrooms.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.roomNumber}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Section</label>
                                <input type="text" name="sectionName" value={formData.sectionName} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Day of Week</label>
                                <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleInputChange} required>
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Start Time</label>
                                <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="primary-button">Save</button>
                            <button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Teacher</th>
                            <th>Room</th>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map(schedule => (
                            <tr key={schedule.id}>
                                <td>{schedule.courseCode}</td>
                                <td>{schedule.sectionName}</td>
                                <td>{schedule.teacherEmail}</td>
                                <td>{schedule.roomNumber}</td>
                                <td>{schedule.dayOfWeek}</td>
                                <td>{schedule.startTime} - {schedule.endTime}</td>
                                <td><span className={`badge ${schedule.status.toLowerCase()}`}>{schedule.status}</span></td>
                                <td>
                                    <button className="action-button edit" onClick={() => handleEdit(schedule)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                        {schedules.length === 0 && (
                            <tr>
                                <td colSpan="8" className="empty-state">No schedules found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduleManagement;
